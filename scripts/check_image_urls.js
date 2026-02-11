
import https from 'https';

const urls = [
    "https://pbzeuxbmiawnjwpnbwkh.supabase.co/storage/v1/object/public/product-images/A1005.jpg",
    "https://pbzeuxbmiawnjwpnbwkh.supabase.co/storage/v1/object/public/product-images/A1056.jpg",
    "https://pbzeuxbmiawnjwpnbwkh.supabase.co/storage/v1/object/public/product-images/D1005.jpg"
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
            console.log("Image MISSING (or access denied)");
        } else {
            console.log("Image OK");
        }
        console.log("---");
    }).on('error', (e) => {
        console.error(`Error fetching ${url}:`, e);
    });
});
