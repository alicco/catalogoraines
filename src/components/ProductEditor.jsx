import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import useStore from '../lib/store';
import { supabase } from '../lib/supabaseClient';

export function ProductEditor() {
    const addProduct = useStore((state) => state.addProduct);
    const updateProduct = useStore((state) => state.updateProduct);
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: '', // Codice Articolo
        name: '',
        description: '',
        extended_description: '',
        price: '',
        category: 'Altro',
        image: '',
        image_url: '', // Explicit field for DB
        emoji: '📦', // Default fallback
        subtitle: '',
        packaging: '',
        iva: '22', // Default IVA
        formato_cartone: '',
        unita_vendita: 'PZ',
        costo_al_metro: ''
    });

    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Categories - Combine defaults with active inventory categories
    const defaultCategories = ['Disinfezione', 'Medicazione', 'Strumenti', 'Rianimazione', 'Diagnostica', 'Immobilizzazione', 'Arredo', 'Borse/Zaini', 'Altro'];
    const activeCategories = useStore(state => state.categories).filter(c => c !== 'All');
    const categories = [...new Set([...defaultCategories, ...activeCategories])].sort();

    useEffect(() => {
        const handleNew = () => {
            setFormData({ id: '', name: '', description: '', extended_description: '', price: '', category: 'Altro', image: '', image_url: '', emoji: '📦', subtitle: '', packaging: '', iva: '22', formato_cartone: '', unita_vendita: 'PZ', costo_al_metro: '' });
            setIsEditing(false);
            setOpen(true);
        };
        const handleEdit = (e) => {
            const item = e.detail;
            setFormData({
                id: item.id || '',
                name: item.name || '',
                description: item.description || '',
                extended_description: item.extended_description || '',
                price: item.price || '',
                category: item.category || 'Altro',
                image: item.image || item.image_url || '',
                image_url: item.image_url || item.image || '',
                emoji: item.emoji || '📦',
                subtitle: item.metadata?.subtitle || '',
                packaging: item.metadata?.packaging || '',
                iva: item.iva || '22',
                formato_cartone: item.formato_cartone || '',
                unita_vendita: item.unita_vendita || 'PZ',
                costo_al_metro: item.costo_al_metro || ''
            });
            setIsEditing(true);
            setOpen(true);
        };

        window.addEventListener('new-product', handleNew);
        window.addEventListener('edit-product', handleEdit);
        return () => {
            window.removeEventListener('new-product', handleNew);
            window.removeEventListener('edit-product', handleEdit);
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isFormValid = () => {
        return (
            formData.id.trim() !== '' &&
            formData.name.trim() !== '' &&
            formData.price !== '' &&
            formData.category.trim() !== ''
            // Image optional
        );
    };

    const handleSave = async () => {
        if (!isFormValid()) return;

        // SANITIZE PAYLOAD - map to catalogo schema via store
        const productPayload = {
            id: formData.id,
            name: formData.name,
            description: formData.description,
            extended_description: formData.extended_description,
            price: parseFloat(formData.price) || 0,
            category: formData.category,
            image_url: formData.image_url || ((formData.image && formData.image.startsWith('http')) ? formData.image : ''),
            iva: parseFloat(formData.iva) || 0,
            formato_cartone: formData.formato_cartone,
            unita_vendita: formData.unita_vendita,
            costo_al_metro: parseFloat(formData.costo_al_metro) || 0,
        };

        try {
            if (isEditing) {
                await updateProduct(productPayload);
            } else {
                await addProduct(productPayload);
            }
            setOpen(false);
        } catch (error) {
            console.error("Save failed:", error);
            alert("Errore durante il salvataggio: " + (error.message || "Errore sconosciuto"));
        }
    };

    // --- Image Upload Handlers ---
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        if (!formData.id) {
            alert("Inserisci il Codice Articolo prima di caricare l'immagine.");
            return;
        }

        // 1. Immediate Local Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setFormData(prev => ({ ...prev, image: e.target.result }));
        };
        reader.readAsDataURL(file);

        // 2. Process image and Upload to Supabase Storage
        try {
            // A. Process Image (transform to 300x300 SVG via Canvas)
            const processImageToSVG = (sourceFile) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const objectUrl = URL.createObjectURL(sourceFile);
                    
                    img.onload = () => {
                        URL.revokeObjectURL(objectUrl);
                        const canvas = document.createElement('canvas');
                        const TARGET_SIZE = 300;
                        canvas.width = TARGET_SIZE;
                        canvas.height = TARGET_SIZE;
                        const ctx = canvas.getContext('2d');
                        
                        // Calculate scaling factor to fit image within 300x300
                        const scale = Math.min(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
                        const newW = img.width * scale;
                        const newH = img.height * scale;
                        
                        // Clear canvas (ensure transparency)
                        ctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE);
                        
                        // Paste resized image into center
                        const pasteX = (TARGET_SIZE - newW) / 2;
                        const pasteY = (TARGET_SIZE - newH) / 2;
                        
                        ctx.drawImage(img, pasteX, pasteY, newW, newH);
                        
                        // Get PNG base64
                        const dataUrl = canvas.toDataURL('image/png');
                        const base64Data = dataUrl.split(',')[1];
                        
                        // Construct SVG
                        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Data}" width="300" height="300" x="0" y="0" />
</svg>`;
                        
                        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
                        resolve(svgBlob);
                    };
                    
                    img.onerror = () => reject(new Error("Errore lettura immagine locale"));
                    img.src = objectUrl;
                });
            };

            const processedBlob = await processImageToSVG(file);

            // B. Upload Processed Blob
            const fileName = `raines_images_cleaned/${formData.id}.svg`;

            const { error: uploadError } = await supabase.storage
                .from('catalog')
                .upload(fileName, processedBlob, {
                    upsert: true,
                    contentType: 'image/svg+xml',
                    cacheControl: '0'
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('catalog')
                .getPublicUrl(fileName);

            // Update FormData with the REAL remote URL
            setFormData(prev => ({
                ...prev,
                image: publicUrl,
                image_url: publicUrl
            }));

            console.log("Image uploaded successfully:", publicUrl);

        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Errore caricamento immagine: " + error.message);
        }
    };

    const handleDeleteImage = () => {
        setFormData(prev => ({
            ...prev,
            image: '',
            image_url: ''
        }));
    };

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                className: "rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            }}
        >
            <DialogTitle className="bg-green-dark text-white p-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xl font-black uppercase tracking-tight">
                        {isEditing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
                    </span>
                    <span className="text-[10px] text-green-light/60 font-bold uppercase tracking-widest">
                        Technical Item Editor
                    </span>
                </div>
            </DialogTitle>

            <DialogContent className="bg-paper p-6 flex flex-col gap-6 custom-scrollbar">

                {/* ID and Basic Info */}
                <div className="pt-4 grid grid-cols-1 gap-4">
                    <TextField
                        label="Codice Articolo"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        fullWidth
                        disabled={isEditing}
                        placeholder="es. A1001"
                        variant="outlined"
                        InputProps={{
                            className: "bg-white font-black text-green-dark"
                        }}
                        sx={{
                            '& label.Mui-focused': { color: '#2E5C45' },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E5C45' }
                        }}
                    />

                    <TextField
                        label="Nome Prodotto"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                            className: "bg-white font-bold"
                        }}
                        sx={{
                            '& label.Mui-focused': { color: '#2E5C45' },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E5C45' }
                        }}
                    />
                </div>

                <div className={`flex flex-col gap-6 transition-all duration-300 ${!formData.id ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>

                    {/* Image Area */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-green-dark/40 uppercase tracking-widest ml-1">Immagine Prodotto</label>
                        <div
                            className={`group relative w-full h-52 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white/50 backdrop-blur-sm shadow-inner ${dragActive ? 'border-green-dark bg-green-light/10' : 'border-green-dark/20 hover:border-green-dark/40'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {formData.image ? (
                                <>
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-contain p-4 drop-shadow-md" />
                                    <div className="absolute inset-0 bg-green-dark/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex flex-col items-center gap-3">
                                            <CloudUploadIcon className="text-white w-10 h-10" />
                                            <span className="text-white text-xs font-black uppercase tracking-widest">Sostituisci</span>
                                        </div>
                                    </div>
                                    {/* Delete Button */}
                                    <Tooltip title="Elimina Immagine">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage();
                                            }}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-90 transition-all z-10"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </button>
                                    </Tooltip>
                                </>
                            ) : (
                                <div className="text-center p-6 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-green-dark/5 flex items-center justify-center group-hover:bg-green-dark/10 transition-colors">
                                        <CloudUploadIcon className="text-green-dark/40" fontSize="large" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-green-dark/60">Trascina o clicca per caricare</span>
                                        <span className="text-[9px] text-green-dark/30 uppercase font-black tracking-widest">Target: {formData.id}.svg</span>
                                    </div>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <TextField
                            label="Descrizione Breve"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                            sx={{
                                '& label.Mui-focused': { color: '#2E5C45' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E5C45' }
                            }}
                        />

                        <TextField
                            label="Descrizione Estesa"
                            name="extended_description"
                            value={formData.extended_description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={4}
                            sx={{
                                '& label.Mui-focused': { color: '#2E5C45' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E5C45' }
                            }}
                        />
                    </div>

                    {/* Technical Specs Panel */}
                    <div className="panel-inset p-5 rounded-2xl flex flex-col gap-5 border border-white/20">
                        <div className="flex items-center gap-3 border-b border-green-dark/10 pb-3">
                            <span className="text-[10px] font-black text-green-dark/40 uppercase tracking-widest">Specifiche Tecniche</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                label="IVA (%)"
                                name="iva"
                                type="number"
                                value={formData.iva}
                                onChange={handleChange}
                                size="small"
                                sx={{
                                    '& label.Mui-focused': { color: '#2E5C45' },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E5C45' }
                                }}
                            />
                            <TextField
                                label="Unità Vendita"
                                name="unita_vendita"
                                value={formData.unita_vendita}
                                onChange={handleChange}
                                size="small"
                                sx={{
                                    '& label.Mui-focused': { color: '#2E5C45' },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E5C45' }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                label="Formato Cartone"
                                name="formato_cartone"
                                value={formData.formato_cartone}
                                onChange={handleChange}
                                size="small"
                                sx={{
                                    '& label.Mui-focused': { color: '#2E5C45' },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E5C45' }
                                }}
                            />
                            <TextField
                                label="Prezzo Listino (€)"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                size="small"
                                variant="filled"
                                InputProps={{
                                    className: "font-black"
                                }}
                                sx={{
                                    '& .MuiFilledInput-root': { backgroundColor: '#E0E8E3' }
                                }}
                            />
                        </div>
                    </div>
                </div>

            </DialogContent>
            <DialogActions className="bg-white/50 backdrop-blur-sm p-4 px-6 gap-3 border-t border-green-dark/5">
                <Button
                    onClick={() => setOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                    Annulla
                </Button>
                <button
                    onClick={handleSave}
                    disabled={!isFormValid()}
                    className={`btn-skeuo px-8 py-2.5 rounded-xl text-sm font-black transition-all ${!isFormValid() ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                >
                    SALVA PRODOTTO
                </button>
            </DialogActions>
        </Dialog>
    );
}
