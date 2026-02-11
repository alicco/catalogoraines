
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

// Load env
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
// Note: For actual admin rights we would need the service role key or a signed-in user.
// Since we set policy "Auth Admin Full Access" for authenticated users, we need to sign in OR use service key.
// Let's assume for this migration we can temporarily allow anon insert via SQL or just rely on the fact that we might have the service key if user provided it? 
// Actually, I don't have service key in .env usually. 
// I will temporarily allow ANON INSERT for the migration script in the SQL call next.

const supabase = createClient(supabaseUrl, supabaseKey)

// Import data from products.js (We need to read it as a module or regex parse it since it's ES6 export)
// Easier to just copy paste the array structure here or parse the file.
// Let's regex parse existing products.js to avoid duplicated data source issues.

import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log("Reading products.js...");
    const productsPath = path.resolve(__dirname, '../src/data/products.js');
    const content = fs.readFileSync(productsPath, 'utf-8');

    // Quick and dirty regex extraction of the array
    // This assumes the format in products.js is consistent
    // We'll extract the array content between "export const products = [" and "];"
    const match = content.match(/export const products = \[\s*([\s\S]*?)\];/);
    if (!match) {
        console.error("Could not find products array");
        return;
    }

    // We can't eval easily because of 'images' variable reference.
    // Let's parse manually or use a trick. 
    // The file imports logic is simple: image: images[x].

    // Revised approach:
    // Let's constructing the objects manually from the regex capture is hard.
    // Let's just create a temporary file that exports the data as CommonJS or just imports the file if we are in module mode.
    // Since this script is running in node, and the project is type:module (likely? wait, vite usually implies modules), we can try dynamic import.

    // But products.js has 'export const products', and uses 'images' array locally.
    // Let's try to just read the file, replace 'export const products' with 'const products', add 'module.exports = { products }' at the end, and 'images' array is there.

    // Wait, the file uses `export const` which is ESM. 
    // And `package.json` might not have "type": "module".
    // Let's check package.json first? No need, I can just create a temporary .mjs file.

    const tempFile = path.resolve(__dirname, 'temp_migration_data.mjs');
    // We need to make sure the file is valid ESM.
    // The original file refers to local images array.
    // We should copy the content mostly as is.

    fs.copyFileSync(productsPath, tempFile);

    try {
        const module = await import('file://' + tempFile);
        const products = module.products;

        console.log(`Found ${products.length} products. Migrating...`);

        // Prepare data
        // We need to map 'image' which might be an imported string or standard string.
        // In the current products.js, it's constructing URLs using SUPABASE_STORAGE_URL constant.
        // The import will execute that code, so 'image' will be the full URL. Perfect.

        const { data, error } = await supabase
            .from('catalog')
            .upsert(products.map(p => ({
                id: p.id, // Keep ID for consistency
                name: p.name,
                description: p.description,
                price: p.price,
                image: p.image,
                category: p.category,
                emoji: p.emoji,
                slots: p.slots || 1,
                quantity: p.quantity || 1
            })), { onConflict: 'id' });

        if (error) {
            console.error("Migration Error:", error);
        } else {
            console.log("Migration Success!");
        }

    } catch (e) {
        console.error("Import error:", e);
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
}

migrate();
