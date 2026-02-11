import React, { useState } from 'react';
import useStore from '../lib/store';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { KitPDFDocument } from './KitPDFDocument';
import { Dialog, DialogContent, DialogActions, Button, DialogTitle, TextField, Snackbar, Alert } from '@mui/material';

export function TotalPanel() {
    const catalogItems = useStore((state) => state.catalogItems);
    const removeFromCatalog = useStore((state) => state.removeFromCatalog);
    const saveCatalogToSupabase = useStore((state) => state.saveCatalogToSupabase);
    const user = useStore((state) => state.user);
    const catalogDiscount = useStore((state) => state.catalogDiscount || 0);
    const catalogExpirationDate = useStore((state) => state.catalogExpirationDate || null);

    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [catalogName, setCatalogName] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const clearCatalog = useStore((state) => state.clearCatalog);

    const handleSaveConfirm = async () => {
        if (!catalogName.trim()) {
            setSnackbar({ open: true, message: "Inserisci un nome per il catalogo.", severity: 'warning' });
            return;
        }

        // Use local saving
        const saveLocalCatalog = useStore.getState().saveLocalCatalog;
        await saveLocalCatalog({ name: catalogName });

        setSaveDialogOpen(false);
        setCatalogName(''); // Reset
        setSnackbar({ open: true, message: "Catalogo salvato correttamente! ✅", severity: 'success' });
    };

    const openSaveDialog = () => {
        setCatalogName(`Catalogo ${new Date().toLocaleDateString()}`);
        setSaveDialogOpen(true);
    };

    return (
        <>
            {/* Catalog Widget */}
            <div className="bg-white rounded-xl overflow-hidden flex flex-col shadow-md">
                <div className="bg-green-primary p-3 md:p-4 text-center relative">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#4dd0e1]">Prodotti Selezionati</h2>
                </div>
                <div className="p-3 md:p-4 bg-white flex flex-col gap-2 md:gap-3 max-h-48 md:max-h-60 overflow-y-auto custom-scrollbar">
                    {catalogItems.map((item) => (
                        <div key={item.instanceId} className="flex justify-between items-center text-xs md:text-sm font-medium text-gray-800 border-b border-gray-100 pb-2">
                            <span className="truncate mr-2 flex-1">{item.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => removeFromCatalog(item.instanceId)} className="text-gray-400 hover:text-red-500" aria-label="Rimuovi dal catalogo">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {catalogItems.length === 0 && <div className="text-center text-gray-400 italic text-sm">Nessun prodotto selezionato</div>}
                </div>
            </div>

            {/* Management Section */}
            <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Strumenti Gestionali</h3>
                <a
                    href="/pro_viewer.html"
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-teal hover:shadow-md transition-all group"
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-teal">Product Viewer</span>
                        <span className="text-[10px] text-slate-400">Strumento analisi prodotti</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </a>
                <a
                    href="/image_associator.html"
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-teal hover:shadow-md transition-all group"
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-teal">Image Associator</span>
                        <span className="text-[10px] text-slate-400">Associazione immagini bulk</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </a>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-4 flex flex-col gap-2 md:gap-3">
                <button
                    className="btn-skeuo w-full py-2.5 md:py-3 rounded-lg font-medium shadow-md transition-all text-sm md:text-base bg-white border-2 border-green-primary text-green-primary hover:bg-green-50"
                    onClick={openSaveDialog}
                >
                    Salva Catalogo Personalizzato
                </button>

                <button
                    className="btn-skeuo w-full py-2.5 md:py-3 rounded-lg font-medium shadow-md transition-all text-sm md:text-base tracking-wide"
                    onClick={() => useStore.getState().setView('flipbook-catalog')}
                >
                    Sfoglia Catalogo 3D
                </button>
            </div>

            {/* Save Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                <DialogTitle>Salva Catalogo</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nome del Catalogo"
                        fullWidth
                        value={catalogName}
                        onChange={(e) => setCatalogName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Annulla</Button>
                    <Button onClick={handleSaveConfirm} variant="contained" sx={{ bgcolor: '#006233', '&:hover': { bgcolor: '#4A9A5F' } }}>Salva</Button>
                </DialogActions>
            </Dialog>


            {/* Toast Notification */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
