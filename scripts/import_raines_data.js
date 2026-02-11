import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const csvPath = 'c:/Users/forza/Downloads/RainesNotion/RainesNotion/Prodotti Raines bb1a119613fd47aab6e1d6b64d0b46de.csv';
const outputPath = 'c:/Users/forza/Documents/Raines1.0/src/data/products.js';

// Helper to determine category from description
function guessCategory(desc) {
    desc = desc.toLowerCase();
    if (desc.includes('disinfettante') || desc.includes('acqua ossigenata') || desc.includes('iodopovidone')) return 'Disinfezione';
    if (desc.includes('benda') || desc.includes('garza') || desc.includes('cerotti') || desc.includes('telo')) return 'Medicazione';
    if (desc.includes('forbici') || desc.includes('laccio') || desc.includes('termometro') || desc.includes('misuratore') || desc.includes('ghiaccio')) return 'Strumenti';
    if (desc.includes('guanti') || desc.includes('mascherina') || desc.includes('camice')) return 'Protezione';
    if (desc.includes('cassetta') || desc.includes('armadietto') || desc.includes('valigetta') || desc.includes('pacco reintegro') || desc.includes('borsetta')) return 'Kit Completi';
    return 'Altro';
}

try {
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0);
    // Skip header
    const dataLines = lines.slice(1);

    const products = dataLines.map((line, index) => {
        // Simple CSV parse handling quotes roughly
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        let desc = parts[0]?.replace(/^"|"$/g, '').trim() || 'Unknown';
        let code = parts[1]?.trim() || `UNK-${index}`;
        let pack = parts[2]?.trim() || '';
        let img = parts[3]?.trim() || '';

        // If image exists, map to public path
        const imagePath = img ? `/raines_images/${img}` : null;

        return {
            id: code,
            name: desc,
            description: pack,
            price: 0, // Default price
            category: guessCategory(desc),
            image: imagePath,
            emoji: '💊' // Fallback
        };
    });

    const fileContent = `export const products = ${JSON.stringify(products, null, 4)};`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully wrote ${products.length} products to ${outputPath}`);

} catch (err) {
    console.error("Error processing:", err);
}
