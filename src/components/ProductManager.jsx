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
        if (!product) {
            console.error("ProductManager: handleEdit called without product");
            return;
        }
        console.log("ProductManager: Triggering edit for", product.id);
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
                <div className="flex gap-1 h-full items-center" style={{ zIndex: 100, pointerEvents: 'auto' }}>
                    <Tooltip title="Modifica">
                        <IconButton 
                            size="small" 
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log("Click edit icon detected for row", params.row.id);
                                handleEdit(params.row);
                            }} 
                            sx={{ color: '#2E5C45', backgroundColor: 'rgba(46, 92, 69, 0.05)', '&:hover': { backgroundColor: 'rgba(46, 92, 69, 0.15)' } }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteClick(params.row.id); }} className="text-red-500 hover:bg-red-50">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
            )
        }
    ];

    return (
        <div className="flex-1 flex flex-col bg-paper overflow-hidden">
            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                PaperProps={{
                    className: "rounded-3xl card-skeuo",
                    style: { borderRadius: '24px' }
                }}
            >
                <div className="p-8 text-center max-w-sm bg-white">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-statusRed shadow-inner">
                        <DeleteIcon fontSize="large" />
                    </div>
                    <h3 className="text-xl font-black text-green-dark mb-4 uppercase tracking-tight">Eliminare Prodotto?</h3>
                    <p className="text-sm text-green-mid font-medium mb-8 leading-relaxed">Questa azione è irreversibile. Il prodotto verrà rimosso permanentemente dal catalogo.</p>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setDeleteConfirmOpen(false)}
                            className="flex-1 py-3 px-6 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all uppercase text-xs tracking-widest"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 py-3 px-6 rounded-xl btn-skeuo-red font-bold transition-all uppercase text-xs tracking-widest shadow-lg active:scale-95"
                        >
                            Elimina
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* Unified Header */}
            <header className="bg-green-dark text-white p-4 lg:px-8 flex items-center justify-between shadow-md z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('kit')}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all border border-white/20 flex items-center gap-2 text-sm font-bold"
                        title="Torna al Catalogo Principale"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        INDIETRO
                    </button>
                    <div className="h-8 w-px bg-white/20 mx-2 hidden lg:block"></div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Gestione Prodotti</h1>
                        <p className="text-green-light/60 text-[10px] uppercase tracking-widest font-bold -mt-0.5">Editing Inventario Raines</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => {
                            if (filteredInventory.length > 0) {
                                console.log("Test: Editing first product");
                                handleEdit(filteredInventory[0]);
                            } else {
                                alert("Nessun prodotto da modificare");
                            }
                        }}
                        className="hidden lg:flex bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                        Debug: Modifica Primo
                    </button>
                    <span className="hidden lg:flex bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
                        {filteredInventory.length} Articoli
                    </span>
                    <button
                        onClick={handleNew}
                        className="btn-skeuo px-6 py-2 rounded-lg text-sm font-black flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <AddIcon className="w-5 h-5" />
                        NUOVO ARTICOLO
                    </button>
                </div>
            </header>

            {/* Sub-toolbar for filters and csv actions */}
            <div className="bg-white/50 backdrop-blur-sm border-b border-green-primary/10 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <FormControl size="small" variant="outlined" sx={{
                        minWidth: 200,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            '& fieldset': { borderColor: '#d1d9d4' },
                            '&:hover fieldset': { borderColor: '#5D8C71' },
                        }
                    }}>
                        <InputLabel sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#5D8C71' }}>FILTRA PER CATEGORIA</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="FILTRA PER CATEGORIA"
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}
                        >
                            {(categories || ['All']).map(cat => (
                                <MenuItem key={cat} value={cat} sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                    {cat === 'All' ? 'Tutte le categorie' : cat.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImportFile}
                    />
                    <button
                        onClick={handleImportClick}
                        className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-green-mid/20 text-green-dark text-xs font-black hover:bg-green-light/20 transition-all border-dashed"
                    >
                        <FileUploadIcon className="w-4 h-4" /> IMPORTA CSV
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-500 text-xs font-black hover:bg-gray-50 transition-all"
                    >
                        <FileDownloadIcon className="w-4 h-4" /> ESPORTA
                    </button>
                </div>
            </div>

            {/* DataGrid Area */}
            <main className="flex-1 p-4 lg:p-6 overflow-hidden">
                <div className="h-full bg-white card-skeuo rounded-2xl overflow-hidden shadow-xl" style={{ width: '100%' }}>
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
                                quickFilterProps: {
                                    debounceMs: 500,
                                    placeholder: 'CERCA ARTICOLO...',
                                    sx: {
                                        padding: '10px 20px',
                                        '& input': {
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            color: '#1E3F2F'
                                        }
                                    }
                                },
                            },
                        }}
                        sx={{
                            border: 0,
                            fontFamily: 'Inter, sans-serif',
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid #f0f3f1',
                                fontSize: '13px',
                                fontWeight: '500',
Comment: 
                            },
                            '& .MuiDataGrid-columnHeader': {
                                backgroundColor: '#F8FAF9',
                                color: '#5D8C71',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                fontSize: '11px',
                                letterSpacing: '0.05em',
                                borderBottom: '2px solid #E0E8E3',
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: '#f5f7f6',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '2px solid #E0E8E3',
                                backgroundColor: '#F8FAF9',
                            },
                            '& .MuiDataGrid-selectedRowCount': {
                                fontWeight: 'black',
                                color: '#2E5C45'
                            }
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
