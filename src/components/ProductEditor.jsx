import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Typography,
    Box,
    IconButton,
    Avatar,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import useStore from '../lib/store';
import { supabase } from '../lib/supabaseClient';

export const ProductEditor = () => {
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        id: '', 
        name: '',
        description: '',
        extended_description: '',
        price: '',
        category: 'Altro',
        image_url: '',
        emoji: '📦',
        iva: '22',
        formato_cartone: '',
        unita_vendita: 'PZ',
        costo_al_metro: ''
    });

    const categories = useStore((state) => state.categories);

    useEffect(() => {
        const handleNew = () => {
            setFormData({ 
                id: '', name: '', description: '', extended_description: '', 
                price: '', category: 'Altro', image_url: '', emoji: '📦', 
                iva: '22', formato_cartone: '', unita_vendita: 'PZ', costo_al_metro: '' 
            });
            setPreviewUrl('');
            setIsEditing(false);
            setOpen(true);
        };
        const handleEdit = (e) => {
            const item = e.detail;
            const data = {
                id: item.id || item.code || '',
                name: item.name || '',
                description: item.description || '',
                extended_description: item.extended_description || '',
                price: item.price || '',
                category: item.category || 'Altro',
                image_url: item.image_url || item.image || '',
                emoji: item.emoji || '📦',
                iva: item.iva || '22',
                formato_cartone: item.formato_cartone || '',
                unita_vendita: item.unita_vendita || 'PZ',
                costo_al_metro: item.costo_al_metro || ''
            };
            setFormData(data);
            setPreviewUrl(data.image_url);
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview locale immediata
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Upload automatico su Supabase
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${formData.id || 'new'}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicData } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicData.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Errore caricamento immagine: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl('');
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const handleSave = async () => {
        if (!formData.id || !formData.name) {
            alert('Codice articolo e Nome sono obbligatori.');
            return;
        }

        setLoading(true);
        try {
            const productData = {
                codice_articolo: formData.id,
                descrizione: formData.name,
                specifiche: formData.description,
                descrizione_estesa: formData.extended_description,
                costo: parseFloat(formData.price) || 0,
                categoria: formData.category,
                link_immagine: formData.image_url,
                iva: formData.iva,
                formato_cartone: formData.formato_cartone,
                unita_vendita: formData.unita_vendita,
                costo_al_metro: formData.costo_al_metro ? parseFloat(formData.costo_al_metro) : null,
                updated_at: new Date().toISOString()
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('catalogo')
                    .update(productData)
                    .eq('codice_articolo', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('catalogo')
                    .insert([productData]);
                if (error) throw error;
            }

            await useStore.getState().fetchCatalog();
            setOpen(false);
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Errore durante il salvataggio: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => setOpen(false)} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                className: 'card-skeuo',
                sx: { borderRadius: '24px', overflow: 'hidden', border: 'none' }
            }}
        >
            <Box className="bg-green-primary p-4 flex justify-between items-center border-b border-green-dark">
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 900, letterSpacing: '-0.5px' }}>
                    {isEditing ? '🖊️ MODIFICA PRODOTTO' : '✨ NUOVO PRODOTTO'}
                </Typography>
                <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 4, bgcolor: '#fdfdfd' }}>
                <Grid container spacing={4}>
                    {/* Sezione Sinistra: Immagine e Emoji */}
                    <Grid item xs={12} md={4}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <Box 
                                sx={{ 
                                    width: 180, 
                                    height: 180, 
                                    borderRadius: '20px', 
                                    bgcolor: '#f0f2f0',
                                    border: '2px dashed #bcc4c0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)'
                                }}
                            >
                                {previewUrl ? (
                                    <Box component="img" src={previewUrl} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <Box textAlign="center" p={2}>
                                        <CloudUploadIcon sx={{ fontSize: 48, color: '#bcc4c0' }} />
                                        <Typography variant="caption" display="block" color="textSecondary">Nessuna Immagine</Typography>
                                    </Box>
                                )}
                                
                                {uploading && (
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                        <CircularProgress size={30} sx={{ m: 'auto', color: '#2E5C45' }} />
                                    </Box>
                                ) }
                            </Box>

                            <Box display="flex" gap={1} width="100%">
                                <Button 
                                    fullWidth 
                                    component="label" 
                                    className="btn-skeuo" 
                                    sx={{ py: 1, fontSize: '0.75rem' }}
                                    startIcon={<CloudUploadIcon />}
                                >
                                    Carica
                                    <input type="file" hidden accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                                </Button>
                                {previewUrl && (
                                    <IconButton onClick={handleRemoveImage} color="error" className="panel-inset" sx={{ borderRadius: '8px' }}>
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>

                            <TextField
                                fullWidth
                                label="Emoji Identificativa"
                                name="emoji"
                                value={formData.emoji}
                                onChange={handleChange}
                                placeholder="📦"
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    </Grid>

                    {/* Sezione Destra: Campi Dati */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 800 }}>Informazioni Generali</Typography>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Codice Articolo"
                                    name="id"
                                    value={formData.id}
                                    onChange={handleChange}
                                    disabled={isEditing}
                                    required
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Categoria"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nome Prodotto"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                            </Grid>
                        </Grid>

                        <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 800, mt: 3, display: 'block' }}>Prezzi e Logistica</Typography>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Costo (€)"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    select
                                    label="IVA %"
                                    name="iva"
                                    value={formData.iva}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="4">4%</MenuItem>
                                    <MenuItem value="10">10%</MenuItem>
                                    <MenuItem value="22">22%</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="U.M. (es. PZ, ML)"
                                    name="unita_vendita"
                                    value={formData.unita_vendita}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Formato Cartone"
                                    name="formato_cartone"
                                    value={formData.formato_cartone}
                                    onChange={handleChange}
                                    placeholder="es. 10pz/ct"
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Descrizioni in basso */}
                    <Grid item xs={12}>
                        <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 800 }}>Dettagli</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Specifiche Tecniche"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Descrizione Commerciale Estesa"
                            name="extended_description"
                            value={formData.extended_description}
                            onChange={handleChange}
                            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 4, bgcolor: '#f0f2f0', gap: 2 }}>
                <Button 
                    onClick={() => setOpen(false)} 
                    variant="outlined" 
                    sx={{ 
                        borderRadius: '12px', 
                        borderColor: '#bcc4c0', 
                        color: '#5D8C71',
                        px: 4
                    }}
                >
                    Annulla
                </Button>
                <Button 
                    onClick={handleSave} 
                    disabled={loading || uploading || !formData.name || !formData.id}
                    className="btn-skeuo"
                    sx={{ px: 6, py: 1.5, borderRadius: '12px', minWidth: 200 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'CONFERMA E SALVA'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
