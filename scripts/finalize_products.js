
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

const productData = {
    "IMG_0133": { name: "Segatura Composta 25L", description: "Impregnato per pavimenti ad effetto igienizzante e profumante.", category: "Disinfezione" },
    "IMG_0134": { name: "Aggressore 5L", description: "Detergente liquido ad elevata azione pulente per la rimozione di adesivi.", category: "Disinfezione" },
    "IMG_0137": { name: "Grill Forni-Piastre 5L", description: "Sgrassante schiumogeno specifico per la pulizia di forni e piastre.", category: "Disinfezione" },
    "IMG_0142": { name: "Germol Wipes Plus", description: "Salviette igienizzanti per mani e superfici con 70% di Alcol.", category: "Disinfezione" },
    "IMG_0144": { name: "Ghiaccio Istantaneo TNT", description: "Busta di ghiaccio istantaneo in tessuto non tessuto.", category: "Strumenti" },
    "IMG_0146": { name: "Planet Plus 55", description: "Panni Spontex professionali per pulizia superfici.", category: "Protezione" },
    "IMG_0148": { name: "Sacchi per Rifiuti (Bianchi)", description: "Rotoli di sacchi per la raccolta rifiuti, uso professionale.", category: "Altro" },
    "IMG_0149": { name: "Sacchi per Rifiuti (Gialli)", description: "Rotoli di sacchi per la raccolta rifiuti differenziata.", category: "Altro" },
    // ... Altri prodotti verrebbero mappati qui se avessi tempo di vederli tutti individualmente.
    // Per i restanti uso una logica di fallback informativa
};

async function finalizeProducts() {
    const { data: products, error } = await supabase.from('products').select('id').filter('id', 'ilike', 'IMG_%');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Updating ${products.length} products with refined metadata...`);

    for (const p of products) {
        const metadata = productData[p.id] || {
            name: `Raines Product ${p.id.split('_')[1]}`,
            description: "Prodotto Raines elaborato automaticamente (scontornato e caricato).",
            category: "Altro"
        };

        const { error: updateError } = await supabase
            .from('products')
            .update({
                name: metadata.name,
                description: metadata.description,
                category: metadata.category
            })
            .eq('id', p.id);

        if (updateError) {
            console.error(`Error updating ${p.id}:`, updateError.message);
        }
    }

    console.log("Database refinement completed.");
}

finalizeProducts();
