import React, { useState, useRef } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Button, IconButton, TextField, Tooltip, Dialog, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import useStore from '../lib/store';

export function ProductManager() {
    const inventory = useStore((state) => state.inventory);
    const categories = useStore((state) => state.categories);
    const deleteProduct = useStore((state) => state.deleteProduct);
    const addProduct = useStore((state) => state.addProduct); // Added for Import
    const setView = useStore((state) => state.setView);

    // Category filter
    const [selectedCategory, setSelectedCategory] = useState('All');
    const filteredInventory = selectedCategory === 'All'
        ? inventory
        : inventory.filter(p => p.category === selectedCategory);

    // We reuse the event system to trigger the existing ProductEditor dialog
    const handleEdit = (product) => {
        const event = new CustomEvent('edit-product', { detail: product });
        window.dispatchEvent(event);
    };

    const handleNew = () => {
        const event = new CustomEvent('new-product');
        window.dispatchEvent(event);
    };

    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        // Prevent event propagation if needed, though usually handled by column definition
        setProductToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (productToDelete) {
            deleteProduct(productToDelete);
            setDeleteConfirmOpen(false);
            setProductToDelete(null);
        }
    };

    // CSV Export
    const handleExport = () => {
        const headers = ["codice", "nome", "descrizione", "descrizione_estesa", "prezzo", "categoria", "iva", "formato_cartone", "unita_vendita", "costo_al_metro"];
        const csvContent = [
            headers.join(";"),
            ...inventory.map(item => [
                item.id,
                `"${item.name.replace(/"/g, '""')}"`,
                `"${(item.description || '').replace(/"/g, '""')}"`,
                `"${(item.extended_description || '').replace(/"/g, '""')}"`,
                item.price,
                item.category,
                item.iva || 0,
                item.formato_cartone || '',
                item.unita_vendita || '',
                item.costo_al_metro || 0
            ].join(";"))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `inventario_raines_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CSV Import
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');

            // Heuristic to skip header
            const startIndex = rows[0].toLowerCase().includes('codice') || rows[0].toLowerCase().includes('id') ? 1 : 0;

            let count = 0;
            for (let i = startIndex; i < rows.length; i++) {
                // Split by ; (user format)
                // TODO: Better CSV parser for quoted fields containing ;
                const cols = rows[i].split(';');

                if (cols.length >= 2) { // Minimum ID and Name
                    // Mapping based on user file: CATEGORIA,ARTICOLO,QTY_MIN,SCADENZA,CONTROLLO,NOTE,CODICE,IMMAGINE,PREZZO
                    // But user might simpler format too. Let's try to map by standard headers or fallback to index.
                    // User file: CAtegoria (0), Articolo (1)... Codice (6)... Prezzo (8)
                    // Let's assume standard export format first: id, name, description, price, category, image
                    // OR check if it matches the user's specific file format from previous turn.
                    // The user file had: CATEGORIA PRODOTTO,ARTICOLO,...,CODICE,IMMAGINE,PREZZO

                    // Let's check typical export format first (cols[0] is ID usually in our export)
                    // BUT if importing the file we saw:
                    // Col 0: Categoria
                    // Col 1: Articolo (Name)
                    // ...
                    // Col 6: Codice (ID)
                    // Col 8: Prezzo

                    let product = {};

                    // Helper to clean quotes
                    const clean = (val) => val ? val.trim().replace(/^"|"$/g, '').replace(/""/g, '"') : '';

                    if (rows[0].includes('CATEGORIA PRODOTTO')) {
                        // Custom legacy mapping
                        product.category = clean(cols[0]);
                        product.name = clean(cols[1]);
                        product.id = clean(cols[6]);
                        product.description = clean(cols[5]);
                        let priceStr = clean(cols[9] || cols[8]);
                        product.price = parseFloat(priceStr.replace('€', '').replace(',', '.')) || 0;
                    } else {
                        // Standard matching export format: codice;nome;descrizione;descrizione_estesa;prezzo;categoria;iva;formato;unita;costom
                        product.id = clean(cols[0]);
                        product.name = clean(cols[1]);
                        product.description = clean(cols[2]);
                        product.extended_description = clean(cols[3]);
                        product.price = parseFloat(clean(cols[4])) || 0;
                        product.category = clean(cols[5]) || 'Altro';
                        product.iva = parseFloat(clean(cols[6])) || 22;
                        product.formato_cartone = clean(cols[7]);
                        product.unita_vendita = clean(cols[8]);
                        product.costo_al_metro = parseFloat(clean(cols[9])) || 0;
                    }

                    if (product.id) {
                        addProduct(product);
                        count++;
                    }
                }
            }
            alert(`Importati ${count} prodotti!`);
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    // Columns Definition
    const columns = [
        { field: 'id', headerName: 'Codice', width: 90 },
        { field: 'name', headerName: 'Nome Prodotto', minWidth: 150, flex: 1 },
        { field: 'description', headerName: 'Sottotitolo', width: 200 },
        { field: 'extended_description', headerName: 'Descrizione Estesa', width: 300 },
        { field: 'category', headerName: 'Categoria', width: 120 },
        {
            field: 'price',
            headerName: 'Prezzo',
            width: 90,
            type: 'number',
            valueFormatter: (value) => {
                const val = (value && typeof value === 'object' && value.value !== undefined) ? value.value : value;
                if (val == null || val === '') return '';
                return `€ ${Number(val).toFixed(2)}`;
            }
        },
        {
            field: 'iva', headerName: 'IVA', width: 60, type: 'number', valueFormatter: (value) => {
                const val = (value && typeof value === 'object' && value.value !== undefined) ? value.value : value;
                return val ? `${val}%` : '22%';
            }
        },
        { field: 'unita_vendita', headerName: 'Unità', width: 70 },
        { field: 'formato_cartone', headerName: 'Formato', width: 100 },
        { field: 'costo_al_metro', headerName: 'Costo/m', width: 90, type: 'number' },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <div className="flex gap-1 h-full items-center">
                    <Tooltip title="Modifica">
                        <IconButton size="small" onClick={() => handleEdit(params.row)} className="text-teal">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton size="small" onClick={() => handleDeleteClick(params.row.id)} className="text-red-500 hover:bg-red-50">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
            )
        }
    ];

    return (
        <div className="h-full flex flex-col bg-gray-50 p-6 overflow-hidden">
            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <div className="p-6 text-center max-w-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <DeleteIcon />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Eliminare questo prodotto?</h3>
                    <p className="text-sm text-gray-500 mb-6">L'azione è irreversibile. Il prodotto verrà rimosso anche dai kit salvati se presenti.</p>

                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outlined"
                            onClick={() => setDeleteConfirmOpen(false)}
                            style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                        >
                            Annulla
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmDelete}
                            disableElevation
                        >
                            Elimina
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setView('kit')}
                        variant="outlined"
                        style={{ borderColor: '#1e6b69', color: '#1e6b69' }}
                    >
                        ← Torna al Kit
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-800">Gestione Prodotti</h1>
                    <span className="bg-teal/10 text-teal px-3 py-1 rounded-full text-sm font-bold">
                        {filteredInventory.length} / {inventory.length} Articoli
                    </span>
                </div>

                <div className="flex gap-3 items-center">
                    {/* Category Filter */}
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Categoria</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="Categoria"
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            sx={{ fontSize: '0.875rem' }}
                        >
                            {(categories || ['All']).map(cat => (
                                <MenuItem key={cat} value={cat}>{cat === 'All' ? 'Tutte le categorie' : cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImportFile}
                    />
                    <Button
                        startIcon={<FileUploadIcon />}
                        onClick={handleImportClick}
                        style={{ color: '#1e6b69', borderColor: '#1e6b69' }}
                        variant="outlined"
                    >
                        Importa CSV
                    </Button>
                    <Button
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                        style={{ color: '#666' }}
                    >
                        Esporta CSV
                    </Button>
                    <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={handleNew}
                        style={{ backgroundColor: '#1e6b69', color: 'white' }}
                    >
                        Nuovo Prodotto
                    </Button>
                </div>
            </div>

            {/* DataGrid */}
            <div className="flex-1 bg-white rounded-xl shadow-md overflow-hidden" style={{ width: '100%' }}>
                <DataGrid
                    rows={filteredInventory}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 25, page: 0 },
                        },
                    }}
                    pageSizeOptions={[25, 50, 100]}
                    checkboxSelection
                    disableRowSelectionOnClick
                    density="comfortable"
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 },
                        },
                    }}
                    sx={{
                        border: 0,
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f0f0f0',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f8fafc',
                            color: '#475569',
                            fontWeight: 'bold',
                        },
                    }}
                />
            </div>
        </div>
    );
}
