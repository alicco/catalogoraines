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

async function checkCount() {
    const { data, error } = await supabase.from('catalogo').select('categoria');
    if (error) {
        console.error(error); return;
    }
    const counts = {};
    for (const p of data) {
        counts[p.categoria] = (counts[p.categoria] || 0) + 1;
    }
    console.log("Count for each category:");
    for (const [cat, count] of Object.entries(counts)) {
        console.log(`- ${cat}: ${count} prodotti => Pagine piene (da 5): ${Math.floor(count / 5)}, Rimanenti ultima pag: ${count % 5}`);
    }
}
checkCount();
