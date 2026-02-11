/**
 * Script per importare i dati dal CSV nella tabella Catalogo su Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione Supabase
const SUPABASE_URL = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2OTk3NzcsImV4cCI6MjA1MjI3NTc3N30.WuR3Av2-iN0CSqRhp2e2i_HVPz1G9FelKOJnlXYpqOM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Leggi il CSV
const csvPath = path.join(__dirname, '..', 'public', 'DBRAINESCOMPLETO.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parsing del CSV
function parseCSV(content) {
    const lines = content.split('\r\n').filter(line => line.trim());
    const header = lines[0].split(';');

    console.log('Header columns:', header);

    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');

        if (!values[0] || values[0].trim() === '') continue;

        // Parse numeri nel formato italiano (virgola come decimale)
        const parseItalianNumber = (str) => {
            if (!str || str.trim() === '') return null;
            return parseFloat(str.replace(',', '.'));
        };

        const product = {
            codice_articolo: values[0]?.trim() || '',
            descrizione: values[1]?.trim() || '',
            specifiche: values[2]?.trim() || null,
            formato_cartone: values[3]?.trim() || null,
            unita_vendita: values[4]?.trim() || null,
            costo: parseItalianNumber(values[5]),
            iva: parseItalianNumber(values[6]),
            categoria: values[7]?.trim() || null,
            link_immagine: values[8]?.trim() || null,
            costo_al_metro: parseItalianNumber(values[9]),
        };

        products.push(product);
    }

    return products;
}

async function importProducts() {
    console.log('🚀 Inizio importazione catalogo...');

    const products = parseCSV(csvContent);
    console.log(`📦 Trovati ${products.length} prodotti da importare`);

    // Importa in batch da 50 per evitare timeout
    const batchSize = 50;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        const { data, error } = await supabase
            .from('catalogo')
            .insert(batch)
            .select();

        if (error) {
            console.error(`❌ Errore batch ${i}-${i + batchSize}:`, error.message);
            errors += batch.length;
        } else {
            imported += batch.length;
            console.log(`✅ Importati ${imported}/${products.length} prodotti`);
        }
    }

    console.log('\n========================================');
    console.log('📊 RIEPILOGO IMPORTAZIONE:');
    console.log('========================================');
    console.log(`✅ Importati: ${imported}`);
    console.log(`❌ Errori: ${errors}`);
    console.log(`📦 Totale: ${products.length}`);

    // Verifica conteggio
    const { count, error: countError } = await supabase
        .from('catalogo')
        .select('*', { count: 'exact', head: true });

    if (!countError) {
        console.log(`\n🔍 Verifica DB: ${count} righe nella tabella catalogo`);
    }
}

importProducts().catch(console.error);
