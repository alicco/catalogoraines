const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('../public/RIDIMENSIONAMENTO CATEGORIE MERCEOLOGICHE.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

fs.writeFileSync('../public/categories_mapped.json', JSON.stringify(json, null, 2));
console.log('Fatto! Verificare public/categories_mapped.json');
