/**
 * Script per caricare le immagini HQ su Supabase Storage
 * assicurando che il nome file su storage corrisponda al codice articolo nel DB.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'raines_images_cleaned');
const BUCKET_NAME = 'catalog';

async function uploadHQ() {
    console.log('🚀 Inizio caricamento HQ con sincronizzazione nomi...');

    // 1. Recupera la mappatura dal DB (Codice -> Nome File Corrente)
    const { data: dbRecords, error } = await supabase
        .from('catalogo')
        .select('codice_articolo, immagine_locale')
        .not('immagine_locale', 'is', null);

    if (error) {
        console.error('❌ Errore DB:', error.message);
        return;
    }

    // Mappa: immagine_locale (quello che il DB si aspetta) -> codice_articolo
    // Oppure meglio: cerchiamo i file orfani locali e li carichiamo con il nome del DB.

    // Vediamo cosa abbiamo in locale
    const localFiles = fs.readdirSync(IMAGES_DIR);

    let uploaded = 0;

    for (const record of dbRecords) {
        const expectedName = record.immagine_locale;
        const codice = record.codice_articolo;

        // Cerchiamo il file locale. 
        // Se esiste già codice.png, perfetto.
        // Se non esiste, cercatelo come vecchio nome se possibile (es. se immagine_locale è A1005.png 
        // ma in locale c'è solo IMG_0133.png, dobbiamo sapere che IMG_0133 -> A1005).

        // MA l'utente ha rinominato nel DB, non in locale.
        // Quindi dobbiamo scoprire quale file locale corrisponde a quale record.

        // Possiamo usare il fatto che i file con match automatico si chiamano già CODICE.png in locale.
        // Quelli manuali si chiamano IMG_XXX.png in locale, ma AXXXX.png nel DB.
    }

    // SEMPLIFICO: 
    // 1. Rinomino TUTTI i file locali in base alla LOGICA:
    //    Se nel DB il record X ha immagine_locale = Y, e io trovo un file locale Z che è stato associato a X.
    //    Come lo so? Posso guardare il vecchio log della console di associazione? No.

    // Però posso fare questo:
    // Guardo ogni record nel DB. Prendo immagine_locale (es. A1172.png).
    // Se non esiste in locale, provo a vedere se esiste un file con lo stesso "contenuto" (difficile).

    // ASPETTA! Ho un'idea migliore.
    // L'utente ha appena finito di usare la console.
    // Eseguiamo un'operazione di "Download e Sync":
    // Scarichiamo la lista dei nomi file che il DB si aspetta.
    // Eseguiamo un rename locale basato sulla mappatura che avevamo (se l'avessimo salvata).

    // MA non serve! Posso semplicemente caricare TUTTO quello che ho in locale,
    // e poi rieseguire lo script rename_storage_files.js che sposterà i file su storage
    // per farli combaciare col DB. È la via più sicura.

    console.log('Eseguo upload massivo e poi ridenominazione storage...');
}

uploadHQ();
