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

const mapping = {
    "PRODOTTI CHIMICI": [
        "DETERGENTI DISINFETTANTI"
    ],
    "SACCHI PER RIFIUTI E DIFFERENZIATA": [
        "SACCHI NETTEZZA URBANA E PATTUMIERE"
    ],
    "PANNI ,STROFINACCI E SPUGNE": [
        "PANNI STROFINACCI SPUGNE"
    ],
    "ATTREZZATURE PER PULIZIE": [
        "SCOPE ALZAIMMONDIZIA MANICI FRATTAZZI",
        "RADAZZE SPINGIACQUA",
        "TERGIVETRO LAVAVETRO RASCHIETTI",
        "PIUMINI SCOVOLI"
    ],
    "GUANTI, DPI  E ABBIGLIAMENTO MONOUSO": [
        "CAMICI IN TESSUTO"
    ],
    "PRONTO SOCCORSO - FARMACIA": [
        "PRONTO SOCCORSO FARMACIA",
        "PRONTO SOCCORSO - FARMACIA"
    ]
};

async function fixCategories() {
    console.log("Inizio correzione massiva categorie mancanti...");
    let totalUpdated = 0;

    for (const [newCategory, oldCategories] of Object.entries(mapping)) {
        for (const oldCat of oldCategories) {
            const { data, error } = await supabase
                .from('catalogo')
                .update({ categoria: newCategory })
                .eq('categoria', oldCat)
                .select('id');

            if (error) {
                console.error(`Errore aggiornamento per ${oldCat}:`, error.message);
            } else if (data && data.length > 0) {
                console.log(`Aggiornati ${data.length} prodotti da [${oldCat}] a [${newCategory}]`);
                totalUpdated += data.length;
            }
        }
    }

    console.log(`\nCorrezione completa! Totale prodotti modificati in questa passata: ${totalUpdated}`);
}

fixCategories();
