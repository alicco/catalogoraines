import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const SUPABASE_URL = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'catalog';
const STORAGE_FOLDER = 'raines_images_cleaned';

async function cleanupStorage() {
    console.log('🧹 Inizio pulizia Storage Supabase...');

    // 1. Ottieni tutti i file dal bucket
    const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(STORAGE_FOLDER, { limit: 1000 });

    if (listError) {
        console.error('❌ Errore lista file:', listError);
        return;
    }

    console.log(`📂 Totale file in storage: ${files.length}`);

    // 2. Ottieni tutti i link attivi dal database
    const { data: products, error: dbError } = await supabase
        .from('catalogo')
        .select('link_immagine');

    if (dbError) {
        console.error('❌ Errore lettura DB:', dbError);
        return;
    }

    // Estrai i nomi file dai link nel DB
    // I link sono tipo: .../raines_images_cleaned/A1030_v2.png
    const activeFiles = new Set();
    products.forEach(p => {
        if (p.link_immagine) {
            const parts = p.link_immagine.split('/');
            const filename = parts[parts.length - 1];
            activeFiles.add(filename);
        }
    });

    console.log(`🔗 Totale immagini associate nel DB: ${activeFiles.size}`);

    // 3. Identifica file da eliminare
    const toDelete = files
        .filter(f => !activeFiles.has(f.name))
        .map(f => `${STORAGE_FOLDER}/${f.name}`);

    console.log(`🗑️ File da eliminare (orfani/vecchi): ${toDelete.length}`);

    if (toDelete.length === 0) {
        console.log('✅ Nessun file da eliminare.');
        return;
    }

    // 4. Elimina in blocchi di 50 (limite consigliato)
    const BATCH_SIZE = 50;
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(batch);

        if (error) {
            console.error(`❌ Errore eliminazione batch ${i}:`, error);
        } else {
            console.log(`✅ Eliminati ${batch.length} file...`);
        }
    }

    console.log('✨ Pulizia completata.');
}

cleanupStorage();
