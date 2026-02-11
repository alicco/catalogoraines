
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const IMAGES_DIR = path.resolve(__dirname, '../public/raines_images');
const BUCKET_NAME = 'product-images';

async function uploadImages() {
    console.log(`Scanning ${IMAGES_DIR}...`);

    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('Images directory not found');
        return;
    }

    const files = fs.readdirSync(IMAGES_DIR);
    console.log(`Found ${files.length} files.`);

    for (const file of files) {
        const filePath = path.join(IMAGES_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);

        // Upload to Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(file, fileBuffer, {
                upsert: true,
                contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
            });

        if (error) {
            console.error(`Error uploading ${file}:`, error.message);
            continue;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(file);

        console.log(`Uploaded ${file} -> ${publicUrl}`);

        // Update Database (Assume ID is filename without extension, e.g. 'F1417.jpg' -> 'F1417')
        const id = path.parse(file).name;

        const { error: dbError } = await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', id); // Try exact ID match 

        if (dbError) {
            console.error(`Error updating DB for ${id}:`, dbError.message);
        } else {
            console.log(`Updated DB record for ${id}`);
        }
    }

    console.log('Done!');
}

uploadImages();
