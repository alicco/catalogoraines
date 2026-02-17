import React, { useState, useEffect } from 'react';
import {
    DataGrid,
    GridToolbar
} from '@mui/x-data-grid';
import { itIT } from '@mui/x-data-grid/locales';
import {
    Box,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Chip,
    Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import useStore from '../lib/store';

export function QuoteManager() {
    const savedKits = useStore((state) => state.savedKits);
    const fetchSavedKits = useStore((state) => state.fetchSavedKits);
    const deleteLocalCatalog = useStore((state) => state.deleteLocalCatalog);
    const setView = useStore((state) => state.setView);
    const loadLocalCatalog = useStore((state) => state.loadLocalCatalog);
    const saveLocalCatalog = useStore((state) => state.saveLocalCatalog);

    const [editDialog, setEditDialog] = useState({ open: false, type: '', params: null, value: '' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        fetchSavedKits();
    }, [fetchSavedKits]);

    const handleLoad = (catalog) => {
        setConfirmDialog({
            open: true,
            title: 'Carica Catalogo',
            message: `Vuoi caricare il catalogo "${catalog.name}"? Questo sostituirà il lavoro corrente.`,
            onConfirm: () => {
                loadLocalCatalog(catalog);
                setView('kit');
            }
        });
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            title: 'Elimina Catalogo',
            message: 'Sei sicuro di voler eliminare definitivamente questo catalogo salvato?',
            onConfirm: () => deleteLocalCatalog(id)
        });
    };

    const handleEditName = (params) => {
        setEditDialog({
            open: true,
            type: 'name',
            params: params.row,
            value: params.row.name || ''
        });
    };

    const handleEditDiscount = (params) => {
        setEditDialog({
            open: true,
            type: 'discount',
            params: params.row,
            value: params.row.discount || 0
        });
    };

    const handleEditExpiration = (params) => {
        let dateVal = '';
        if (params.row.expirationDate) {
            const d = new Date(params.row.expirationDate);
            if (!isNaN(d.getTime())) {
                dateVal = d.toISOString().split('T')[0];
            }
        }
        setEditDialog({
            open: true,
            type: 'date',
            params: params.row,
            value: dateVal
        });
    };

    const handleEditSave = () => {
        const { type, params, value } = editDialog;
        if (!params) return;

        const updatedData = { ...params };
        if (type === 'name') updatedData.name = value;
        else if (type === 'date') updatedData.expirationDate = value;
        else if (type === 'discount') updatedData.discount = parseFloat(value) || 0;

        saveLocalCatalog(updatedData);
        setEditDialog({ open: false, type: '', params: null, value: '' });
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Nome Catalogo',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <div onClick={() => handleEditName(params)} className="flex items-center gap-2 cursor-pointer group hover:bg-green-light/50 px-2 py-1 rounded-md transition-all">
                    <span className="font-bold text-green-dark">{params.value}</span>
                    <EditIcon sx={{ fontSize: 14, opacity: 0, color: 'var(--color-green-primary)', transition: 'opacity 0.2s', '.group:hover &': { opacity: 0.7 } }} />
                </div>
            )
        },
        {
            field: 'createdAt',
            headerName: 'Creato il',
            width: 140,
            renderCell: (params) => (
                <span className="text-gray-500 font-medium text-xs">
                    {new Date(params.value).toLocaleDateString('it-IT')}
                </span>
            )
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 180,
            sortable: false,
            headerAlign: 'center',
            renderCell: (params) => (
                <div className="flex gap-2 h-full items-center justify-center">
                    <Tooltip title="Apri nel Builder">
                        <button
                            onClick={() => handleLoad(params.row)}
                            className="btn-skeuo px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-normal flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <RestoreIcon sx={{ fontSize: 16 }} />
                            CARICA
                        </button>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(params.row.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full bg-paper animate-in fade-in duration-500 font-sans">
            {/* Header */}
            <div className="bg-green-primary px-4 md:px-8 py-4 md:py-6 shadow-lg flex items-center justify-between border-b border-green-dark shrink-0">
                <div className="flex items-center gap-4 md:gap-6">
                    <button
                        onClick={() => setView('kit')}
                        className="btn-skeuo w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90"
                    >
                        <CloseIcon fontSize="small" />
                    </button>
                    <div>
                        <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">Archivio Cataloghi</h2>
                        <p className="text-green-light text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Gestione e consultazione salvataggi</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4 bg-green-dark/30 px-5 py-2.5 rounded-2xl border border-white/5">
                    <div className="text-right">
                        <div className="text-white font-black text-lg leading-none">{savedKits.length}</div>
                        <div className="text-green-light/60 text-[8px] font-bold uppercase tracking-widest mt-1">Sincronizzati</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <RestoreIcon className="text-green-light/40" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
                <Paper elevation={0} className="flex-1 rounded-3xl border border-gray-200 overflow-hidden flex flex-col bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]">
                    <DataGrid
                        rows={savedKits}
                        columns={columns}
                        localeText={itIT?.components?.MuiDataGrid?.defaultProps?.localeText}
                        slots={{ toolbar: GridToolbar }}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.id}
                        sx={{
                            border: 'none',
                            fontFamily: 'inherit',
                            '& .MuiDataGrid-main': {
                                backgroundColor: 'transparent',
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid #f0f2f0',
                                display: 'flex',
                                alignItems: 'center',
                                '&:focus, &:focus-within': {
                                    outline: 'none !important'
                                }
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: '#f8faf9',
                                borderBottom: '2px solid #e0e8e3',
                                '& .MuiDataGrid-columnHeaderTitle': {
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.05em',
                                    color: '#5d8c71'
                                }
                            },
                            '& .MuiDataGrid-toolbarContainer': {
                                padding: '16px 24px',
                                borderBottom: '1px solid #f0f2f0',
                                bgcolor: '#fbfcfb',
                                '& .MuiButton-root': {
                                    color: 'var(--color-green-primary)',
                                    fontWeight: '800',
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    borderRadius: '8px',
                                    px: 2,
                                    '&:hover': {
                                        bgcolor: 'var(--color-green-light)'
                                    }
                                },
                                '& .MuiSvgIcon-root': {
                                    color: 'var(--color-green-primary)',
                                    opacity: 0.7
                                }
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '2px solid #e0e8e3',
                                bgcolor: '#fbfcfb'
                            },
                            '& .MuiDataGrid-row:hover': {
                                bgcolor: '#f1f5f2'
                            },
                            '& .MuiDataGrid-columnSeparator': {
                                display: 'none'
                            }
                        }}
                    />
                </Paper>
            </div>

            {/* Edit Dialog */}
            <Dialog
                open={editDialog.open}
                onClose={() => setEditDialog({ ...editDialog, open: false })}
                PaperProps={{
                    className: "card-skeuo",
                    sx: { borderRadius: '24px', minWidth: '400px', backgroundImage: 'none', border: 'none' }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: 'var(--color-green-dark)',
                    pt: 4,
                    px: 4,
                    fontSize: '1.2rem'
                }}>
                    {editDialog.type === 'name' ? '✏️ Modifica Nome' :
                        editDialog.type === 'discount' ? '🏷️ Imposta Sconto' : '📅 Imposta Scadenza'}
                </DialogTitle>
                <DialogContent sx={{ px: 4, py: 1 }}>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label={editDialog.type === 'name' ? "Nome Catalogo" : editDialog.type === 'discount' ? "Sconto (%)" : "Data di Scadenza"}
                            type={editDialog.type === 'discount' ? "number" : editDialog.type === 'date' ? "date" : "text"}
                            value={editDialog.value}
                            onChange={(e) => setEditDialog({ ...editDialog, value: e.target.value })}
                            variant="outlined"
                            autoFocus
                            InputLabelProps={editDialog.type === 'date' ? { shrink: true } : {}}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    backgroundColor: '#f8faf9',
                                    '& fieldset': { borderColor: '#e0e8e3' },
                                    '&:hover fieldset': { borderColor: 'var(--color-green-mid)' },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'var(--color-green-primary)',
                                    }
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 2, gap: 1 }}>
                    <Button
                        onClick={() => setEditDialog({ ...editDialog, open: false })}
                        sx={{ color: 'gray', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem' }}
                    >
                        Annulla
                    </Button>
                    <button
                        onClick={handleEditSave}
                        className="btn-skeuo px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-tight shadow-lg"
                    >
                        Salva Modifiche
                    </button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                PaperProps={{
                    className: "card-skeuo",
                    sx: { borderRadius: '24px', minWidth: '350px', border: 'none' }
                }}
            >
                <DialogTitle sx={{ fontWeight: '900', textTransform: 'uppercase', pt: 4, px: 4, color: 'var(--color-green-dark)' }}>
                    {confirmDialog.title}
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <p className="text-gray-600 font-medium text-sm leading-relaxed">{confirmDialog.message}</p>
                </DialogContent>
                <DialogActions sx={{ p: 4, gap: 1 }}>
                    <Button
                        onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                        sx={{ color: 'gray', fontWeight: 'bold' }}
                    >
                        Annulla
                    </Button>
                    <button
                        onClick={() => {
                            if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                            setConfirmDialog({ ...confirmDialog, open: false });
                        }}
                        className={`px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-tight shadow-lg transition-transform active:scale-95 ${confirmDialog.title.includes('Elimina') ? 'btn-skeuo-red' : 'btn-skeuo'}`}
                    >
                        Conferma
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
