
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateToPng() {
    const { data: products, error } = await supabase.from('products').select('id, image_url');
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Updating ${products.length} products to ensure .png extension in image_url...`);

    for (const p of products) {
        if (p.image_url && p.image_url.toLowerCase().endsWith('.jpg')) {
            const newUrl = p.image_url.replace(/\.jpg$/i, '.png');
            console.log(`  Updating ${p.id}: ${p.image_url} -> ${newUrl}`);
            await supabase.from('products').update({ image_url: newUrl }).eq('id', p.id);
        }
    }
    console.log("Database update completed.");
}

updateToPng();
