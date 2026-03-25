import removeBackground from '@imgly/background-removal';

/**
 * Processa un'immagine: scontorno, ridimensionamento 300x300, zoom centrato e conversione SVG.
 * @param {File|Blob} file - L'immagine originale
 * @param {string} productCode - Il codice del prodotto (usato per il nome file)
 * @returns {Promise<{blob: Blob, fileName: string}>}
 */
export async function processProductImage(file, productCode) {
    console.log(`Processing image for product: ${productCode}`);

    // 1. Scontorno (Background Removal)
    const processedBlob = await removeBackground(file, {
        progress: (status, progress) => {
            console.log(`Background removal: ${status} (${Math.round(progress * 100)}%)`);
        }
    });

    // 2. Ridimensionamento 300x300 e Zoom Centrato
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');

            const scale = Math.max(300 / img.width, 300 / img.height);
            const x = (300 - img.width * scale) / 2;
            const y = (300 - img.height * scale) / 2;

            ctx.clearRect(0, 0, 300, 300);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            const pngDataUrl = canvas.toDataURL('image/png');
            const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <image width="300" height="300" href="${pngDataUrl}" />
</svg>`.trim();

            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
            resolve({
                blob: svgBlob,
                fileName: `${productCode}.svg`
            });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(processedBlob);
    });
}
