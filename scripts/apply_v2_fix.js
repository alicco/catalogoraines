import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione Supabase
const SUPABASE_URL = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'raines_images_cleaned');
const BUCKET_NAME = 'catalog';
const PUBLIC_URL_BASE = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co/storage/v1/object/public/catalog/raines_images_cleaned';

// Mappa recuperata da local_rename.js
const mapping = [
    { "codice_articolo": "A1172", "immagine_locale": "IMG_0137.png" }, { "codice_articolo": "A1097", "immagine_locale": "IMG_0174.png" },
    { "codice_articolo": "A1078", "immagine_locale": "IMG_0176.png" }, { "codice_articolo": "A1070", "immagine_locale": "IMG_0182.png" },
    { "codice_articolo": "A1013", "immagine_locale": "IMG_0185.png" }, { "codice_articolo": "A1161", "immagine_locale": "IMG_0188.png" },
    { "codice_articolo": "A1043", "immagine_locale": "IMG_0191.png" }, { "codice_articolo": "A1175", "immagine_locale": "IMG_0225.png" },
    { "codice_articolo": "A1031", "immagine_locale": "IMG_0227.png" }, { "codice_articolo": "A1032", "immagine_locale": "IMG_0232.png" },
    { "codice_articolo": "A1062", "immagine_locale": "IMG_0234.png" }, { "codice_articolo": "A1045", "immagine_locale": "IMG_0235.png" },
    { "codice_articolo": "A1065", "immagine_locale": "IMG_0240.png" }, { "codice_articolo": "A1152", "immagine_locale": "IMG_0243.png" },
    { "codice_articolo": "A1100", "immagine_locale": "IMG_0252.png" }, { "codice_articolo": "A1133", "immagine_locale": "IMG_0255.png" },
    { "codice_articolo": "A1051", "immagine_locale": "IMG_0260.png" }, { "codice_articolo": "A1002", "immagine_locale": "IMG_0261.png" },
    { "codice_articolo": "A1073", "immagine_locale": "IMG_0265.png" }, { "codice_articolo": "A1064", "immagine_locale": "IMG_0274.png" },
    { "codice_articolo": "A1007", "immagine_locale": "IMG_0278.png" }, { "codice_articolo": "A1219", "immagine_locale": "IMG_0134.png" },
    { "codice_articolo": "F1250", "immagine_locale": "IMG_0163.png" }, { "codice_articolo": "A1190", "immagine_locale": "IMG_0178.png" },
    { "codice_articolo": "A1179", "immagine_locale": "IMG_0208.png" }, { "codice_articolo": "A1193", "immagine_locale": "IMG_0215.png" },
    { "codice_articolo": "A1191", "immagine_locale": "IMG_0223.png" }, { "codice_articolo": "A1217", "immagine_locale": "IMG_0219.png" },
    { "codice_articolo": "A1181", "immagine_locale": "IMG_0229.png" }, { "codice_articolo": "A1820", "immagine_locale": "IMG_0245.png" },
    { "codice_articolo": "A1284", "immagine_locale": "IMG_0250.png" }, { "codice_articolo": "A1206", "immagine_locale": "IMG_0267.png" },
    { "codice_articolo": "A1213", "immagine_locale": "IMG_0269.png" }, { "codice_articolo": "D1065", "immagine_locale": "IMG_0271.png" },
    { "codice_articolo": "A1247", "immagine_locale": "IMG_0167.png" }, { "codice_articolo": "F1425", "immagine_locale": "IMG_0153.png" },
    { "codice_articolo": "F1428", "immagine_locale": "IMG_0150.png" }, { "codice_articolo": "F1231", "immagine_locale": "IMG_0156.png" },
    { "codice_articolo": "F1048", "immagine_locale": "IMG_0196.png" }, { "codice_articolo": "F1642", "immagine_locale": "IMG_0199.png" },
    { "codice_articolo": "D1025", "immagine_locale": "IMG_0144.png" }, { "codice_articolo": "F1128", "immagine_locale": "IMG_0133.png" },
    { "codice_articolo": "F1047", "immagine_locale": "IMG_0148.png" }, { "codice_articolo": "F1426", "immagine_locale": "IMG_0149.png" },
    { "codice_articolo": "D1035", "immagine_locale": "IMG_0161.png" }, { "codice_articolo": "D1101", "immagine_locale": "IMG_0158.png" },
    { "codice_articolo": "A1030", "immagine_locale": "IMG_0165.png" }, { "codice_articolo": "A1162", "immagine_locale": "IMG_0183.png" },
    { "codice_articolo": "F1290", "immagine_locale": "IMG_0206.png" }, { "codice_articolo": "A1218", "immagine_locale": "IMG_0211.png" },
    { "codice_articolo": "A1009", "immagine_locale": "IMG_0214.png" }, { "codice_articolo": "A1226", "immagine_locale": "IMG_0221.png" },
    { "codice_articolo": "A1053", "immagine_locale": "IMG_0233.png" }, { "codice_articolo": "A1083", "immagine_locale": "IMG_0254.png" },
    { "codice_articolo": "A1214", "immagine_locale": "IMG_0258.png" }, { "codice_articolo": "A1122", "immagine_locale": "IMG_0264.png" },
    { "codice_articolo": "A1283", "immagine_locale": "IMG_0280.png" }, { "codice_articolo": "A1153", "immagine_locale": "IMG_0169.png" }
];

async function applyFix() {
    console.log('🚀 Inizio FIX V2: Ridenominazione, Upload e Sync...');

    let processed = 0;

    for (const item of mapping) {
        // Il file generato da clean_images è IMG_xxxx_v2.png
        // Lo vogliamo trasformare in CODICE_v2.png

        const originalBase = item.immagine_locale.replace('.png', ''); // IMG_0137
        const currentFileV2 = `${originalBase}_v2.png`; // IMG_0137_v2.png
        const targetFileV2 = `${item.codice_articolo}_v2.png`; // A1172_v2.png

        const currentPath = path.join(IMAGES_DIR, currentFileV2);
        const targetPath = path.join(IMAGES_DIR, targetFileV2);

        // 1. Ridenominazione Locale
        if (fs.existsSync(currentPath)) {
            // Se esiste IMG_xxxx_v2.png, rinominalo
            fs.renameSync(currentPath, targetPath);
            console.log(`📝 Rinominato locale: ${currentFileV2} -> ${targetFileV2}`);
        } else if (!fs.existsSync(targetPath)) {
            // Se non esiste né il vecchio né il nuovo, saltiamo
            console.log(`⚠️ File non trovato: ${currentFileV2}`);
            continue;
        }

        // A questo punto abbiamo sicuramente targetPath (o esisteva già o l'abbiamo appena rinominato)
        if (fs.existsSync(targetPath)) {

            // 2. Upload su Supabase
            const fileBuffer = fs.readFileSync(targetPath);
            const storagePath = `raines_images_cleaned/${targetFileV2}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true,
                    cacheControl: '0'
                });

            if (uploadError) {
                console.error(`❌ Errore upload ${targetFileV2}:`, uploadError.message);
                continue;
            }

            // 3. Update Database
            const publicUrl = `${PUBLIC_URL_BASE}/${targetFileV2}`;

            const { error: dbError } = await supabase
                .from('catalogo')
                .update({ link_immagine: publicUrl })
                .eq('codice_articolo', item.codice_articolo);

            if (dbError) {
                console.error(`❌ Errore DB update ${item.codice_articolo}:`, dbError.message);
            } else {
                console.log(`✅ COMPLETATO: ${item.codice_articolo} -> ${targetFileV2}`);
                processed++;
            }
        }
    }

    console.log(`\n🎉 FIX COMPLETATO: ${processed} prodotti aggiornati.`);
}

applyFix();
