
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching first 10 products...");
    const { data, error } = await supabase.from('products').select('*').limit(10);

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    console.log(`Found ${data.length} products.`);

    for (const p of data) {
        console.log(`Product [${p.id}]:`);
        console.log(`  Name: ${p.name}`);
        console.log(`  Image URL (DB): ${p.image_url}`);
        console.log(`  Image (DB Legacy): ${p.image ? (p.image.startsWith('data:') ? 'DATA_URI' : p.image) : 'NULL'}`);

        const urlToTest = p.image_url;
        if (urlToTest) {
            try {
                const res = await fetch(urlToTest, { method: 'HEAD' });
                console.log(`  URL Check: ${res.status} ${res.statusText}`);
            } catch (e) {
                console.log(`  URL Check: ERROR ${e.message}`);
            }
        } else {
            console.log("  URL Check: Skipped (No URL)");
        }
        console.log("---");
    }
}

check();
