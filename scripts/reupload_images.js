
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGES_DIR = path.resolve(__dirname, '../public/raines_images');
const BUCKET_NAME = 'product-images';

async function reupload() {
    const allFiles = fs.readdirSync(IMAGES_DIR);
    const imagesToUpload = allFiles.filter(f => f.endsWith('.png'));

    console.log(`Re-uploading ${imagesToUpload.length} images to Supabase Storage (upsert enabled)...`);

    for (const file of imagesToUpload) {
        const filePath = path.join(IMAGES_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(file, fileBuffer, {
                upsert: true,
                contentType: 'image/png'
            });

        if (error) {
            console.error(`  Error uploading ${file}:`, error.message);
        } else {
            console.log(`  Uploaded ${file} successfully.`);
        }
    }
    console.log('Done!');
}

reupload();
