
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugStore() {
    console.log("Fetching from DB...");
    const { data, error } = await supabase.from('products').select('*');

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    console.log(`Fetched ${data.length} items.`);

    // Mimic Store Normalization
    const normalizedData = data.map(p => ({
        ...p,
        image: p.image_url || p.image || ''
    }));

    console.log("\nSample Normalized Items (First 3):");
    normalizedData.slice(0, 3).forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`Final Image Prop: ${p.image}`);
        console.log("---");
    });
}

debugStore();
