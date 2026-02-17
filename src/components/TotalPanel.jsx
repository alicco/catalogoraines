import React, { useState, useEffect } from 'react';
import useStore from '../lib/store';
import { Dialog, DialogContent, DialogActions, Button, DialogTitle, TextField, Snackbar, Alert } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

export function TotalPanel() {
    const catalogItems = useStore((state) => state.catalogItems);
    const saveCatalogToSupabase = useStore((state) => state.saveCatalogToSupabase);
    const user = useStore((state) => state.user);
    const promotions = useStore((state) => state.promotions);
    const loadPromotions = useStore((state) => state.loadPromotions);
    const setView = useStore((state) => state.setView);

    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [catalogName, setCatalogName] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const clearCatalog = useStore((state) => state.clearCatalog);

    useEffect(() => {
        loadPromotions();
    }, [loadPromotions]);

    // Active promotions (not expired, flag active)
    const now = new Date().toISOString().slice(0, 10);
    const activePromos = promotions.filter(p => {
        if (!p.active) return false;
        if (p.validFrom && now < p.validFrom) return false;
        if (p.validTo && now > p.validTo) return false;
        return true;
    });

    const handleSaveConfirm = async () => {
        if (!catalogName.trim()) {
            setSnackbar({ open: true, message: "Inserisci un nome per il catalogo.", severity: 'warning' });
            return;
        }

        const saveLocalCatalog = useStore.getState().saveLocalCatalog;
        await saveLocalCatalog({ name: catalogName });

        setSaveDialogOpen(false);
        setCatalogName('');
        setSnackbar({ open: true, message: "Catalogo salvato correttamente! ✅", severity: 'success' });
    };

    const openSaveDialog = () => {
        setCatalogName(`Catalogo ${new Date().toLocaleDateString()}`);
        setSaveDialogOpen(true);
    };

    const PROMO_TYPE_LABELS = {
        product: '🏷️ Prodotto',
        threshold: '💰 Soglia',
        bundle: '📦 Bundle',
    };

    return (
        <>
            {/* Promozioni Attive Widget */}
            <div className="card-skeuo rounded-xl overflow-hidden flex flex-col mb-4">
                <div className="bg-green-primary border-b border-green-dark p-3 md:p-4 text-center relative">
                    <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white flex items-center justify-center gap-2 font-sans">
                        <LocalOfferIcon style={{ fontSize: 24 }} />
                        PROMOZIONI ATTIVE
                    </h2>
                    {activePromos.length > 0 && (
                        <span className="absolute top-3 right-3 bg-white text-green-primary text-xs font-black px-2 py-0.5 rounded-full shadow">
                            {activePromos.length}
                        </span>
                    )}
                </div>
                <div className="p-3 md:p-4 bg-white flex flex-col gap-2 md:gap-3 max-h-48 md:max-h-60 overflow-y-auto custom-scrollbar">
                    {activePromos.slice(0, 5).map((promo) => (
                        <div key={promo.id} className="flex justify-between items-center text-xs md:text-sm font-medium text-gray-800 border-b border-slate-100 pb-2 last:border-b-0">
                            <div className="flex flex-col flex-1 mr-2">
                                <span className="font-bold text-slate-800 truncate uppercase tracking-tight font-sans">{promo.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    {PROMO_TYPE_LABELS[promo.type] || promo.type}
                                    {promo.validTo && (
                                        <span className="font-bold ml-1 text-green-primary">
                                            • Scade il {new Date(promo.validTo).toLocaleDateString('it-IT')}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="bg-green-light text-green-primary text-xs font-black px-2 py-1 rounded border border-green-primary/20 whitespace-nowrap">
                                    {promo.discountType === 'percentage'
                                        ? `-${promo.discountValue}%`
                                        : `-€${Number(promo.discountValue).toFixed(2)}`
                                    }
                                </span>
                            </div>
                        </div>
                    ))}
                    {activePromos.length === 0 && (
                        <div className="text-center text-slate-400 italic text-sm py-4 bg-paper rounded-lg border border-slate-200 border-dashed">
                            Nessuna promozione attiva al momento
                        </div>
                    )}
                    {activePromos.length > 5 && (
                        <div className="text-center text-xs text-slate-400 font-bold pt-1">
                            +{activePromos.length - 5} altre promozioni...
                        </div>
                    )}
                </div>
                <div className="px-3 pb-3 pt-1">
                    <button
                        onClick={() => setView('promo-manager')}
                        className="btn-skeuo w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm"
                    >
                        <LocalOfferIcon style={{ fontSize: 16 }} />
                        Gestisci Promozioni
                    </button>
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
                {/* <a
                    href="/image_associator.html"
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-teal hover:shadow-md transition-all group"
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-teal">Image Associator</span>
                        <span className="text-[10px] text-slate-400">Associazione immagini bulk</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </a> */}
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
