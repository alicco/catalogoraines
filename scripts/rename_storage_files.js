/**
 * Script per rinominare i file in Supabase Storage e aggiornare il database
 * così che il nome file corrisponda esattamente al codice_articolo.
 */

import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const SUPABASE_URL = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'catalog';

async function renameFiles() {
    console.log('🔄 Inizio ridenominazione file per coerenza con codice_articolo...');

    // 1. Recupera i prodotti da rinominare
    const { data: products, error: dbError } = await supabase
        .from('catalogo')
        .select('codice_articolo, immagine_locale')
        .not('immagine_locale', 'is', null);

    if (dbError) {
        console.error('❌ Errore nel recupero dei dati:', dbError.message);
        return;
    }

    const toRename = products.filter(p => p.immagine_locale !== `${p.codice_articolo}.png`);
    console.log(`🔍 Trovati ${toRename.length} file da rinominare.`);

    let successCount = 0;
    let errorCount = 0;

    for (const product of toRename) {
        const oldName = product.immagine_locale;
        const newName = `${product.codice_articolo}.png`;
        const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${newName}`;

        console.log(`Moving ${oldName} -> ${newName}...`);

        // A. Rinomina nello Storage (move)
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .move(oldName, newName);

        if (storageError && !storageError.message.includes('already exists')) {
            console.error(`❌ Errore storage per ${product.codice_articolo}:`, storageError.message);
            errorCount++;
            continue;
        }

        // B. Aggiorna il database
        const { error: updateError } = await supabase
            .from('catalogo')
            .update({
                immagine_locale: newName,
                link_immagine: newUrl
            })
            .eq('codice_articolo', product.codice_articolo);

        if (updateError) {
            console.error(`❌ Errore DB per ${product.codice_articolo}:`, updateError.message);
            errorCount++;
        } else {
            successCount++;
            console.log(`✅ Successo per ${product.codice_articolo}`);
        }
    }

    console.log('\n========================================');
    console.log('📊 RIEPILOGO RIDENOMINAZIONE:');
    console.log('========================================');
    console.log(`✅ File rinominati: ${successCount}`);
    console.log(`❌ Errori: ${errorCount}`);
}

renameFiles().catch(console.error);
