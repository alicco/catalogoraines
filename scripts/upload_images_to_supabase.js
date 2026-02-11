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

async function uploadImages() {
    console.log('🚀 Inizio caricamento immagini V2 su Supabase Storage...');

    // Carichiamo SOLO i file che finiscono con _v2.png
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`❌ Directory non trovata: ${IMAGES_DIR}`);
        return;
    }

    const files = fs.readdirSync(IMAGES_DIR).filter(file => file.endsWith('_v2.png'));
    let successCount = 0;
    let errorCount = 0;

    console.log(`📂 Trovati ${files.length} file V2 da caricare.`);

    for (const [index, file] of files.entries()) {
        const filePath = path.join(IMAGES_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);

        // Manteniamo la struttura raines_images_cleaned/NOMEFILE
        const storagePath = `raines_images_cleaned/${file}`;

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
                contentType: 'image/png',
                upsert: true,
                cacheControl: '0' // DISABILITA CACHE
            });

        if (error) {
            console.error(`❌ [${index + 1}/${files.length}] Errore ${file}:`, error.message);
            errorCount++;
        } else {
            console.log(`✅ [${index + 1}/${files.length}] Caricato: ${file}`);
            successCount++;
        }
    }

    console.log('\n===================================');
    console.log(`🎉 UPLOAD COMPLETATO`);
    console.log(`✅ Successi: ${successCount}`);
    console.log(`❌ Errori: ${errorCount}`);
    console.log('===================================');
}

uploadImages();
