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
const PUBLIC_URL_BASE = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co/storage/v1/object/public/catalog/raines_images_cleaned';

async function updateDatabaseUrl() {
    console.log('🚀 Inizio aggiornamento database con URL V2...');

    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`❌ Directory non trovata: ${IMAGES_DIR}`);
        return;
    }

    const files = fs.readdirSync(IMAGES_DIR).filter(file => file.endsWith('_v2.png'));
    let updatedCount = 0;
    let notFoundCount = 0;

    console.log(`📂 Trovati ${files.length} file V2 da mappare.`);

    for (const file of files) {
        // file es: "A1030_v2.png" o "IMG_0123_v2.png"
        const baseName = file.replace('_v2.png', '');
        const publicUrl = `${PUBLIC_URL_BASE}/${file}`;

        // Strategia di matching:
        // 1. Cerchiamo per codice_articolo esatto (se il file è stato rinominato tipo A1030_v2.png)
        // 2. Cerchiamo per immagine_locale originale (se il file è ancora IMG_XXXX, cerchiamo IMG_XXXX.png)

        let matched = false;

        // TENTATIVO 1: Codice Articolo
        const { data: byCode, error: err1 } = await supabase
            .from('catalogo')
            .update({ link_immagine: publicUrl })
            .eq('codice_articolo', baseName)
            .select();

        if (byCode && byCode.length > 0) {
            console.log(`✅ Aggiornato (Codice): ${baseName} -> ${file}`);
            updatedCount++;
            matched = true;
        }
        else {
            // TENTATIVO 2: Immagine Locale Originale (IMG_XXXX.png)
            const originalLocalName = baseName + '.png';

            const { data: byImg, error: err2 } = await supabase
                .from('catalogo')
                .update({ link_immagine: publicUrl })
                .eq('immagine_locale', originalLocalName)
                .select();

            if (byImg && byImg.length > 0) {
                console.log(`✅ Aggiornato (ImgLocale): ${byImg[0].codice_articolo} -> ${file}`);
                updatedCount++;
                matched = true;
            }
        }

        if (!matched) {
            console.log(`⚠️ Nessun match nel DB per: ${baseName}`);
            notFoundCount++;
        }
    }

    console.log('\n===================================');
    console.log(`✨ AGGIORNAMENTO DB COMPLETATO`);
    console.log(`✅ Record aggiornati: ${updatedCount}`);
    console.log(`⚠️ File senza match: ${notFoundCount}`);
    console.log('===================================');
}

updateDatabaseUrl();
