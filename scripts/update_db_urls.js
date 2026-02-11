/**
 * Script per aggiornare i record nel database con i nuovi URL delle immagini caricate
 */

import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const SUPABASE_URL = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'catalog';
const BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

async function updateUrls() {
    console.log('🚀 Inizio aggiornamento URL nel database...');

    // 1. Recupera la lista dei file effettivamente presenti nel bucket
    const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 1000 });

    if (listError) {
        console.error('❌ Errore nel recupero della lista file:', listError.message);
        return;
    }

    console.log(`📦 Trovati ${files.length} file nel bucket.`);

    let updated = 0;
    let skipped = 0;

    for (const file of files) {
        // Il nome base del file (es. A1005) dovrebbe corrispondere al codice_articolo
        const codiceArticolo = file.name.split('.')[0];
        const publicUrl = `${BASE_URL}/${file.name}`;

        console.log(`🔍 Cerco prodotto con codice: ${codiceArticolo}...`);

        // Aggiorna il record nel DB
        const { data, error } = await supabase
            .from('catalogo')
            .update({
                link_immagine: publicUrl,
                immagine_locale: file.name
            })
            .eq('codice_articolo', codiceArticolo)
            .select();

        if (error) {
            console.error(`❌ Errore aggiornamento ${codiceArticolo}:`, error.message);
        } else if (data && data.length > 0) {
            updated++;
            console.log(`✅ Aggiornato record per ${codiceArticolo} con URL: ${publicUrl}`);
        } else {
            skipped++;
            console.log(`⚠️ Nessun record trovato per il codice: ${codiceArticolo}`);
        }
    }

    console.log('\n========================================');
    console.log('📊 RIEPILOGO AGGIORNAMENTO DB:');
    console.log('========================================');
    console.log(`✅ Record aggiornati: ${updated}`);
    console.log(`⚠️ File senza record: ${skipped}`);
}

updateUrls().catch(console.error);
