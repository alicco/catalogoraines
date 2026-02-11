
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

// Helper to guess category from name/description
function guessCategory(text) {
    const desc = text.toLowerCase();
    if (desc.includes('disinfettante') || desc.includes('acqua ossigenata') || desc.includes('iodopovidone') || desc.includes('spray')) return 'Disinfezione';
    if (desc.includes('benda') || desc.includes('garza') || desc.includes('cerotti') || desc.includes('telo') || desc.includes('compressa')) return 'Medicazione';
    if (desc.includes('forbici') || desc.includes('laccio') || desc.includes('termometro') || desc.includes('misuratore') || desc.includes('ghiaccio') || desc.includes('pinzette')) return 'Strumenti';
    if (desc.includes('guanti') || desc.includes('mascherina') || desc.includes('camice') || desc.includes('visiera')) return 'Protezione';
    if (desc.includes('cassetta') || desc.includes('armadietto') || desc.includes('valigetta') || desc.includes('pacco reintegro') || desc.includes('borsetta') || desc.includes('kit')) return 'Kit Completi';
    return 'Altro';
}

async function analyzeAndImport() {
    // Get all IMG_*.png files
    const allFiles = fs.readdirSync(IMAGES_DIR);
    const newImages = allFiles.filter(f => f.startsWith('IMG_') && f.endsWith('.png'));

    console.log(`Analyzing and importing ${newImages.length} new images...`);

    for (const file of newImages) {
        const filePath = path.join(IMAGES_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);
        const id = path.parse(file).name; // e.g. IMG_0133

        console.log(`--- Processing ${id} ---`);

        // 1. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(file, fileBuffer, {
                upsert: true,
                contentType: 'image/png'
            });

        if (uploadError) {
            console.error(`  Upload error for ${file}:`, uploadError.message);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(file);

        console.log(`  Uploaded to: ${publicUrl}`);

        // 2. Metadata for Database (Placeholder - will be replaced by manual batch or AI analysis)
        // Since I cannot call an "AI Vision API" directly from this script easily without keys,
        // and I am the AI, I will generate a JSON mapping if I can see them.
        // Wait! I can see images if I list them or use tools. 
        // For now, I'll insert with placeholder names and let the user know I'll enrich them.

        const productName = `Prodotto ${id}`;
        const productDesc = `Descrizione per ${id} (analisi in corso)`;
        const category = guessCategory(productName);

        const { error: dbError } = await supabase
            .from('products')
            .upsert({
                id: id,
                name: productName,
                description: productDesc,
                price: 0,
                category: category,
                image_url: publicUrl,
                metadata: { source: 'automated_import' }
            });

        if (dbError) {
            console.error(`  DB error for ${id}:`, dbError.message);
        } else {
            console.log(`  Inserted/Updated DB record for ${id}`);
        }
    }

    console.log('Finished analyze and import process.');
}

analyzeAndImport();
