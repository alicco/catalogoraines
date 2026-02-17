import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
    Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    Chip, Autocomplete, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import useStore from '../lib/store';

const PROMO_TYPES = [
    { value: 'product', label: '🏷️ Sconto Prodotto', description: 'Sconto su prodotti specifici' },
    { value: 'threshold', label: '💰 Sconto Soglia', description: 'Sconto oltre una certa spesa' },
    { value: 'bundle', label: '📦 Bundle/Kit', description: 'Sconto per acquisto multiplo' },
];

const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentuale (%)' },
    { value: 'fixed', label: 'Fisso (€)' },
];

const PROMO_COLORS = [
    { value: '#1e6b69', label: 'Verde Catalogo' },
    { value: '#2563eb', label: 'Blu' },
    { value: '#dc2626', label: 'Rosso' },
    { value: '#ea580c', label: 'Arancione' },
    { value: '#7c3aed', label: 'Viola' },
    { value: '#db2777', label: 'Rosa' },
    { value: '#ca8a04', label: 'Oro' },
    { value: '#0d9488', label: 'Teal' },
    { value: '#4f46e5', label: 'Indigo' },
    { value: '#059669', label: 'Smeraldo' },
];

const EMPTY_PROMO = {
    name: '',
    type: 'product',
    discountValue: 0,
    discountType: 'percentage',
    color: '#1e6b69',
    condition: {
        productIds: [],
        minAmount: 0,
        category: '',
        minQuantity: 0,
    },
    validFrom: '',
    validTo: '',
    active: true,
    description: '',
};

export function PromoManager() {
    const promotions = useStore((state) => state.promotions);
    const inventory = useStore((state) => state.inventory);
    const categories = useStore((state) => state.categories);
    const loadPromotions = useStore((state) => state.loadPromotions);
    const savePromotion = useStore((state) => state.savePromotion);
    const deletePromotion = useStore((state) => state.deletePromotion);
    const togglePromotion = useStore((state) => state.togglePromotion);
    const setView = useStore((state) => state.setView);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_PROMO });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadPromotions();
    }, [loadPromotions]);

    const activeCount = promotions.filter(p => p.active).length;

    // --- Dialog handlers ---
    const handleNew = () => {
        setEditingPromo(null);
        setFormData({ ...EMPTY_PROMO });
        setDialogOpen(true);
    };

    const handleEdit = (promo) => {
        setEditingPromo(promo);
        setFormData({
            ...EMPTY_PROMO,
            ...promo,
            condition: { ...EMPTY_PROMO.condition, ...(promo.condition || {}) },
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            setSnackbar({ open: true, message: "Inserisci un nome per la promozione.", severity: 'warning' });
            return;
        }
        if (formData.discountValue <= 0) {
            setSnackbar({ open: true, message: "Lo sconto deve essere maggiore di 0.", severity: 'warning' });
            return;
        }

        const promoToSave = {
            ...formData,
            id: editingPromo?.id || undefined,
        };
        savePromotion(promoToSave);
        setDialogOpen(false);
        setSnackbar({ open: true, message: editingPromo ? "Promozione aggiornata! ✅" : "Promozione creata! 🎉", severity: 'success' });
    };

    const handleDeleteClick = (id) => {
        setPromoToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (promoToDelete) {
            deletePromotion(promoToDelete);
            setDeleteConfirmOpen(false);
            setPromoToDelete(null);
            setSnackbar({ open: true, message: "Promozione eliminata.", severity: 'info' });
        }
    };

    const updateFormField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateCondition = (field, value) => {
        setFormData(prev => ({
            ...prev,
            condition: { ...prev.condition, [field]: value },
        }));
    };

    // --- DataGrid columns ---
    const columns = [
        {
            field: 'active',
            headerName: 'Stato',
            width: 80,
            renderCell: (params) => (
                <Tooltip title={params.value ? "Attiva — clicca per disattivare" : "Inattiva — clicca per attivare"}>
                    <IconButton size="small" onClick={() => togglePromotion(params.row.id)}>
                        {params.value ?
                            <ToggleOnIcon style={{ color: '#1e6b69', fontSize: 28 }} /> :
                            <ToggleOffIcon style={{ color: '#ccc', fontSize: 28 }} />
                        }
                    </IconButton>
                </Tooltip>
            ),
        },
        {
            field: 'name',
            headerName: 'Nome Promozione',
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <div className="flex items-center gap-2 h-full">
                    <span
                        style={{
                            width: 12, height: 12, borderRadius: '50%',
                            backgroundColor: params.row.color || '#1e6b69',
                            flexShrink: 0, border: '2px solid rgba(0,0,0,0.1)',
                        }}
                    />
                    <span className="font-semibold text-slate-800">{params.value}</span>
                </div>
            ),
        },
        {
            field: 'type',
            headerName: 'Tipo',
            width: 160,
            renderCell: (params) => {
                const typeInfo = PROMO_TYPES.find(t => t.value === params.value);
                return <Chip label={typeInfo?.label || params.value} size="small" variant="outlined" />;
            },
        },
        {
            field: 'discountValue',
            headerName: 'Sconto',
            width: 100,
            renderCell: (params) => (
                <span className="font-black text-red-600 text-sm">
                    {params.row.discountType === 'percentage'
                        ? `-${params.value}%`
                        : `-€${Number(params.value).toFixed(2)}`
                    }
                </span>
            ),
        },
        {
            field: 'description',
            headerName: 'Descrizione',
            minWidth: 200,
            flex: 1,
            renderCell: (params) => (
                <span className="text-slate-500 text-xs">{params.value || '—'}</span>
            ),
        },
        {
            field: 'validFrom',
            headerName: 'Da',
            width: 110,
            renderCell: (params) => (
                <span className="text-xs text-slate-600">
                    {params.value ? new Date(params.value).toLocaleDateString('it-IT') : '—'}
                </span>
            ),
        },
        {
            field: 'validTo',
            headerName: 'A',
            width: 110,
            renderCell: (params) => {
                const isExpired = params.value && new Date(params.value) < new Date();
                return (
                    <span className={`text-xs ${isExpired ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
                        {params.value ? new Date(params.value).toLocaleDateString('it-IT') : '—'}
                        {isExpired && ' ⚠'}
                    </span>
                );
            },
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <div className="flex gap-1 h-full items-center">
                    <Tooltip title="Modifica">
                        <IconButton size="small" onClick={() => handleEdit(params.row)}>
                            <EditIcon fontSize="small" style={{ color: '#1e6b69' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton size="small" onClick={() => handleDeleteClick(params.row.id)} className="text-red-500">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        },
    ];

    // Products list for autocomplete
    const productOptions = inventory.map(p => ({ id: p.id, label: `${p.id} — ${p.name}` }));

    return (
        <div className="h-full flex flex-col bg-gray-50 p-6 overflow-hidden">
            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <div className="p-6 text-center max-w-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <DeleteIcon />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Eliminare questa promozione?</h3>
                    <p className="text-sm text-gray-500 mb-6">L'azione è irreversibile.</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outlined" onClick={() => setDeleteConfirmOpen(false)}
                            style={{ borderColor: '#e2e8f0', color: '#64748b' }}>Annulla</Button>
                        <Button variant="contained" color="error" onClick={confirmDelete} disableElevation>Elimina</Button>
                    </div>
                </div>
            </Dialog>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button onClick={() => setView('kit')} variant="outlined"
                        style={{ borderColor: '#1e6b69', color: '#1e6b69' }}
                        startIcon={<ArrowBackIcon />}>
                        Torna al Kit
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <LocalOfferIcon style={{ color: '#1e6b69' }} />
                        Gestione Promozioni
                    </h1>
                    <Chip
                        label={`${activeCount} Attive`}
                        size="small"
                        style={{
                            backgroundColor: activeCount > 0 ? '#dcfce7' : '#f1f5f9',
                            color: activeCount > 0 ? '#166534' : '#64748b',
                            fontWeight: 'bold',
                        }}
                    />
                    <Chip
                        label={`${promotions.length} Totali`}
                        size="small"
                        variant="outlined"
                        style={{ fontWeight: 'bold' }}
                    />
                </div>
                <Button startIcon={<AddIcon />} variant="contained" onClick={handleNew}
                    style={{ backgroundColor: '#1e6b69', color: 'white' }}>
                    Nuova Promozione
                </Button>
            </div>

            {/* DataGrid */}
            <div className="flex-1 bg-white rounded-xl shadow-md overflow-hidden" style={{ width: '100%' }}>
                <DataGrid
                    rows={promotions}
                    columns={columns}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25, page: 0 } },
                    }}
                    pageSizeOptions={[25, 50]}
                    disableRowSelectionOnClick
                    density="comfortable"
                    sx={{
                        border: 0,
                        '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0' },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f8fafc',
                            color: '#475569',
                            fontWeight: 'bold',
                        },
                    }}
                    localeText={{
                        noRowsLabel: 'Nessuna promozione creata. Clicca "Nuova Promozione" per iniziare! 🚀',
                    }}
                />
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalOfferIcon style={{ color: '#1e6b69' }} />
                    {editingPromo ? 'Modifica Promozione' : 'Nuova Promozione'}
                </DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Name */}
                        <TextField
                            label="Nome Promozione"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => updateFormField('name', e.target.value)}
                            placeholder="es. Offerta Febbraio 2026"
                        />

                        {/* Color */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 font-medium">Colore Promozione</label>
                            <div className="flex gap-2 flex-wrap">
                                {PROMO_COLORS.map(c => (
                                    <Tooltip key={c.value} title={c.label}>
                                        <button
                                            type="button"
                                            onClick={() => updateFormField('color', c.value)}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                backgroundColor: c.value,
                                                border: formData.color === c.value ? '3px solid #000' : '2px solid rgba(0,0,0,0.1)',
                                                cursor: 'pointer', transition: 'transform 0.15s',
                                                transform: formData.color === c.value ? 'scale(1.2)' : 'scale(1)',
                                            }}
                                        />
                                    </Tooltip>
                                ))}
                            </div>
                        </div>

                        {/* Type */}
                        <FormControl fullWidth>
                            <InputLabel>Tipo Promozione</InputLabel>
                            <Select
                                value={formData.type}
                                label="Tipo Promozione"
                                onChange={(e) => updateFormField('type', e.target.value)}
                            >
                                {PROMO_TYPES.map(t => (
                                    <MenuItem key={t.value} value={t.value}>
                                        <div className="flex flex-col">
                                            <span>{t.label}</span>
                                            <span className="text-xs text-gray-400">{t.description}</span>
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Discount Value */}
                        <TextField
                            label="Valore Sconto"
                            type="number"
                            fullWidth
                            value={formData.discountValue}
                            onChange={(e) => updateFormField('discountValue', parseFloat(e.target.value) || 0)}
                            InputProps={{
                                endAdornment: formData.discountType === 'percentage' ? '%' : '€',
                            }}
                        />

                        {/* Discount Type */}
                        <FormControl fullWidth>
                            <InputLabel>Tipo Sconto</InputLabel>
                            <Select
                                value={formData.discountType}
                                label="Tipo Sconto"
                                onChange={(e) => updateFormField('discountType', e.target.value)}
                            >
                                {DISCOUNT_TYPES.map(t => (
                                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Conditional Fields based on Promo Type */}
                        {formData.type === 'product' && (
                            <div className="col-span-2">
                                <Autocomplete
                                    multiple
                                    options={productOptions}
                                    value={productOptions.filter(o => (formData.condition.productIds || []).includes(o.id))}
                                    onChange={(_, newValue) => updateCondition('productIds', newValue.map(v => v.id))}
                                    getOptionLabel={(option) => option.label}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Prodotti Target" placeholder="Seleziona prodotti..." />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option.id}
                                                label={option.id}
                                                size="small"
                                                style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                                            />
                                        ))
                                    }
                                />
                            </div>
                        )}

                        {formData.type === 'threshold' && (
                            <TextField
                                label="Soglia Minima (€)"
                                type="number"
                                fullWidth
                                value={formData.condition.minAmount}
                                onChange={(e) => updateCondition('minAmount', parseFloat(e.target.value) || 0)}
                                placeholder="es. 400"
                                InputProps={{ startAdornment: <ShoppingCartIcon style={{ color: '#94a3b8', marginRight: 8 }} /> }}
                            />
                        )}

                        {formData.type === 'bundle' && (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Categoria</InputLabel>
                                    <Select
                                        value={formData.condition.category}
                                        label="Categoria"
                                        onChange={(e) => updateCondition('category', e.target.value)}
                                    >
                                        {(categories || []).filter(c => c !== 'All').map(cat => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Quantità Minima"
                                    type="number"
                                    fullWidth
                                    value={formData.condition.minQuantity}
                                    onChange={(e) => updateCondition('minQuantity', parseInt(e.target.value) || 0)}
                                    placeholder="es. 3"
                                    InputProps={{ startAdornment: <InventoryIcon style={{ color: '#94a3b8', marginRight: 8 }} /> }}
                                />
                            </>
                        )}

                        {/* Validity Dates */}
                        <TextField
                            label="Valida dal"
                            type="date"
                            fullWidth
                            value={formData.validFrom}
                            onChange={(e) => updateFormField('validFrom', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Valida fino al"
                            type="date"
                            fullWidth
                            value={formData.validTo}
                            onChange={(e) => updateFormField('validTo', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />

                        {/* Description */}
                        <div className="col-span-2">
                            <TextField
                                label="Descrizione (opzionale)"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.description}
                                onChange={(e) => updateFormField('description', e.target.value)}
                                placeholder="es. Sconto speciale valido solo per ordini online..."
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="col-span-2 flex items-center">
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.active}
                                        onChange={(e) => updateFormField('active', e.target.checked)}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1e6b69' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1e6b69' } }}
                                    />
                                }
                                label={formData.active ? "Promozione Attiva" : "Promozione Inattiva"}
                            />
                        </div>
                    </div>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} style={{ color: '#64748b' }}>Annulla</Button>
                    <Button variant="contained" onClick={handleSave} disableElevation
                        style={{ backgroundColor: '#1e6b69', color: 'white' }}>
                        {editingPromo ? 'Salva Modifiche' : 'Crea Promozione'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Calendar Timeline */}
            {promotions.length > 0 && (
                <div className="mt-4 bg-white rounded-xl shadow-md p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarTodayIcon style={{ color: '#1e6b69', fontSize: 20 }} />
                        <h2 className="text-sm font-bold text-gray-700">Timeline Promozioni</h2>
                    </div>
                    {(() => {
                        const today = new Date();
                        const allDates = promotions.flatMap(p => [
                            p.validFrom ? new Date(p.validFrom) : null,
                            p.validTo ? new Date(p.validTo) : null,
                        ]).filter(Boolean);
                        if (allDates.length === 0) return <p className="text-xs text-gray-400">Nessuna data impostata.</p>;

                        const minDate = new Date(Math.min(...allDates.map(d => d.getTime()), today.getTime()));
                        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime()), today.getTime()));
                        // Add padding: 7 days before, 30 days after
                        const rangeStart = new Date(minDate); rangeStart.setDate(rangeStart.getDate() - 7);
                        const rangeEnd = new Date(maxDate); rangeEnd.setDate(rangeEnd.getDate() + 30);
                        const totalDays = Math.max(1, (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));
                        const todayPct = ((today - rangeStart) / (rangeEnd - rangeStart)) * 100;

                        // Month markers
                        const months = [];
                        const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
                        while (cursor <= rangeEnd) {
                            const pct = ((cursor - rangeStart) / (rangeEnd - rangeStart)) * 100;
                            if (pct >= 0 && pct <= 100) {
                                months.push({ label: cursor.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }), pct });
                            }
                            cursor.setMonth(cursor.getMonth() + 1);
                        }

                        return (
                            <div className="relative" style={{ minHeight: promotions.length * 32 + 30 }}>
                                {/* Month labels */}
                                <div className="relative h-5 mb-1 border-b border-gray-200">
                                    {months.map((m, i) => (
                                        <span key={i} className="absolute text-[10px] text-gray-400 font-medium" style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}>{m.label}</span>
                                    ))}
                                </div>

                                {/* Today marker */}
                                <div className="absolute top-5 bottom-0" style={{ left: `${todayPct}%`, width: 2, backgroundColor: '#dc2626', zIndex: 10, opacity: 0.7 }} />
                                <div className="absolute" style={{ left: `${todayPct}%`, top: 20, transform: 'translateX(-50%)', backgroundColor: '#dc2626', color: 'white', fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 'bold', zIndex: 11 }}>OGGI</div>

                                {/* Promo bars */}
                                {promotions.map((promo, idx) => {
                                    const from = promo.validFrom ? new Date(promo.validFrom) : rangeStart;
                                    const to = promo.validTo ? new Date(promo.validTo) : rangeEnd;
                                    const leftPct = Math.max(0, ((from - rangeStart) / (rangeEnd - rangeStart)) * 100);
                                    const rightPct = Math.min(100, ((to - rangeStart) / (rangeEnd - rangeStart)) * 100);
                                    const widthPct = Math.max(0.5, rightPct - leftPct);
                                    const barColor = promo.color || '#1e6b69';
                                    const isExpired = promo.validTo && new Date(promo.validTo) < today;

                                    return (
                                        <div key={promo.id} className="absolute flex items-center" style={{ top: 30 + idx * 32, left: 0, right: 0, height: 28 }}>
                                            <Tooltip title={`${promo.name}${promo.validFrom ? ' | Da: ' + new Date(promo.validFrom).toLocaleDateString('it-IT') : ''}${promo.validTo ? ' | A: ' + new Date(promo.validTo).toLocaleDateString('it-IT') : ''}`}>
                                                <div
                                                    style={{
                                                        position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                                                        height: 22, borderRadius: 6, backgroundColor: barColor,
                                                        opacity: isExpired ? 0.35 : (promo.active ? 0.85 : 0.4),
                                                        display: 'flex', alignItems: 'center', paddingLeft: 8,
                                                        cursor: 'pointer', transition: 'opacity 0.2s',
                                                        border: isExpired ? '1px dashed rgba(0,0,0,0.2)' : 'none',
                                                    }}
                                                    onClick={() => handleEdit(promo)}
                                                >
                                                    <span style={{ color: 'white', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {promo.name}{isExpired ? ' (scaduta)' : (!promo.active ? ' (off)' : '')}
                                                    </span>
                                                </div>
                                            </Tooltip>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Snackbar */}
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
        </div>
    );
}
