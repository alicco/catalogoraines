import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Manca SUPABASE_URL o SUPABASE_KEY nel file .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mapping = {
    "PRODOTTI CHIMICI ": [
        "DETERGENZA PROFESSIONALE"
    ],
    "CARTA E DISPENSER": [
        "CARTA E COMPLEMENTI BAGNO"
    ],
    "SACCHI PER RIFIUTI E DIFFERENZIATA ": [
        "SACCHI N.U. E PATTUMIERE"
    ],
    "CARRELLI PULIZIE - PATTUMIERE - CESTINI": [
        "PATTUMIERE-CESTINI-CONTENITORI",
        "SECCHI PER LAVAGGIO",
        "CARRELLI E ACCESSORI"
    ],
    "PANNI ,STROFINACCI E SPUGNE": [
        "PANNI-STROFINACCI-SPUGNE"
    ],
    "MACCHINE PER LA PULIZIA": [
        "DISCHI ABRASIVI"
    ],
    "ATTREZZATURE PER PULIZIE": [
        "SCOPE-ALZAIMMONDIZIA-MANICI-FRATTAZZI",
        "RADAZZE- SPINGIACQUA",
        "MOP",
        "TERGIVETRO - LAVAVETRO - RASCHIETTI",
        "PIUMINI- SCOVOLI",
        "SISTEMI DI LAVAGGIO PROFESSIONALI"
    ],
    "GUANTI, DPI  E ABBIGLIAMENTO MONOUSO": [
        "GUANTI MONOUSO",
        "GUANTI RIUTILIZZABILI",
        "ABBIGLIAMENTO  MONOUSO E DPI",
        "CAMICI IN  TESSUTO"
    ],
    "PRONTO SOCCORSO - FARMACIA ": [
        "PRONTO SOCCORSO - FARMACIA",
        "IGIENIZZAZIONE MANI"
    ],
    "BANDIERE, CARTELLI E SEGNALETICA": [
        "BANDIERE E ACCESSORI",
        "CARTELLI E SEGNALETICA"
    ],
    "CANCELLERIA E ALTRO": [
        "CANCELLERIA E ALTRO"
    ]
};

async function updateCategories() {
    console.log("Inizio aggiornamento massivo categorie su Supabase...");
    let totalUpdated = 0;

    for (const [newCategory, oldCategories] of Object.entries(mapping)) {
        // Trim newCategory to avoid trailing spaces
        const finalCategoryName = newCategory.trim();
        console.log(`\nNuova Categoria -> [${finalCategoryName}]`);

        for (const oldCat of oldCategories) {
            console.log(`   Analizzo -> [${oldCat}]`);

            const { data, error } = await supabase
                .from('catalogo')
                .update({ categoria: finalCategoryName })
                .eq('categoria', oldCat)
                .select('id');

            if (error) {
                console.error(`     Errore aggiornamento per ${oldCat}:`, error.message);
            } else {
                console.log(`     Aggiornati ${data.length} prodotti da ${oldCat} a ${finalCategoryName}`);
                totalUpdated += data.length;
            }
        }
    }

    console.log(`\nAggiornamento completo! Totale prodotti modificati: ${totalUpdated}`);
}

updateCategories();
