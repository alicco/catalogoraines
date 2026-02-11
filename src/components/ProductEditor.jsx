import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField } from '@mui/material';
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
            setFormData({ id: '', name: '', description: '', extended_description: '', price: '', category: 'Altro', image: '', image_url: '', emoji: '📦', subtitle: '', packaging: '' });
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

        // 2. Upload to Supabase Storage
        try {
            const fileName = `raines_images_cleaned/${formData.id}_v2.png`;

            // Upload to catalog bucket
            const { error: uploadError } = await supabase.storage
                .from('catalog')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type,
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

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle style={{ backgroundColor: '#1e3a52', color: 'white' }}>
                {isEditing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </DialogTitle>
            <DialogContent className="flex flex-col gap-4 pt-4">

                {/* Spacer requested by user */}
                <div style={{ height: '30px' }}></div>

                <TextField
                    className="mt-2"
                    label="Codice Articolo (OBBLIGATORIO PER INIZIARE)"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    fullWidth
                    disabled={isEditing}
                    helperText={isEditing ? "Non modificabile" : "Inserisci PRIMA il codice per sbloccare il resto"}
                    color={!formData.id ? "warning" : "success"}
                    focused={!formData.id && !isEditing}
                />

                <TextField
                    className="mt-2"
                    label="Nome Prodotto (Principal)"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    variant="filled"
                    sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                />

                <div className={`flex flex-col gap-4 transition-opacity duration-300 ${!formData.id ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    {/* Image Upload Area */}
                    <div
                        className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${dragActive ? 'border-teal bg-teal/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {formData.image ? (
                            <div className="relative w-full h-full group">
                                <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-medium">Cambia Immagine</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4 text-gray-500">
                                <p className="font-bold">Clicca o Trascina immagine</p>
                                <p className="text-xs mt-1">Verrà salvata come: <b>{formData.id || '...'}</b></p>
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

                    <TextField
                        label="Descrizione Breve (Sottotitolo)"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={2}
                    />

                    <TextField
                        label="Descrizione Estesa"
                        name="extended_description"
                        value={formData.extended_description}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Inserisci qui la descrizione estesa del prodotto per il catalogo..."
                    />

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-200 pb-2">Dati Tecnici & Commerciali</h4>

                        <div className="flex gap-4">
                            <TextField
                                label="IVA (%)"
                                name="iva"
                                type="number"
                                value={formData.iva}
                                onChange={handleChange}
                                fullWidth
                                inputProps={{ min: 0 }}
                            />
                            <TextField
                                label="Unità di Vendita"
                                name="unita_vendita"
                                value={formData.unita_vendita}
                                onChange={handleChange}
                                fullWidth
                                placeholder="es. PZ, MT, KG"
                            />
                        </div>

                        <div className="flex gap-4">
                            <TextField
                                label="Formato Cartone"
                                name="formato_cartone"
                                value={formData.formato_cartone}
                                onChange={handleChange}
                                fullWidth
                                placeholder="es. 12 x 1L"
                            />
                            <TextField
                                label="Costo al metro (€)"
                                name="costo_al_metro"
                                type="number"
                                value={formData.costo_al_metro}
                                onChange={handleChange}
                                fullWidth
                                inputProps={{ min: 0, step: 0.001 }}
                            />
                        </div>
                    </div>
                </div>

            </DialogContent>
            <DialogActions style={{ padding: '16px 24px' }}>
                <Button onClick={() => setOpen(false)} style={{ color: '#666' }}>
                    Annulla
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    style={{ backgroundColor: isFormValid() ? '#10b981' : '#ccc', color: 'white' }}
                    disabled={!isFormValid()}
                >
                    Salva
                </Button>
            </DialogActions>
        </Dialog>
    );
}
