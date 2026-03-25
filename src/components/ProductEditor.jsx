import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useStore from '../lib/store';
import { supabase } from '../lib/supabaseClient';

const defaultCategories = ['Accessori', 'Fissaggi', 'Guarnizioni', 'Profili', 'Sistemi', 'Ricambi', 'Altro'];

export const ProductEditor = () => {
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: '', // This matches codice_articolo
        name: '',
        description: '',
        extended_description: '',
        price: '',
        category: 'Altro',
        image: '',
        image_url: '',
        emoji: '📦',
        subtitle: '',
        packaging: '',
        iva: '22',
        formato_cartone: '',
        unita_vendita: 'PZ',
        costo_al_metro: ''
    });

    const categories = useStore((state) => state.categories);

    useEffect(() => {
        console.log("ProductEditor: Component mounted and listening for events");
        const handleNew = () => {
            console.log("ProductEditor: Received 'new-product' event");
            setFormData({ id: '', name: '', description: '', extended_description: '', price: '', category: 'Altro', image: '', image_url: '', emoji: '📦', subtitle: '', packaging: '', iva: '22', formato_cartone: '', unita_vendita: 'PZ', costo_al_metro: '' });
            setIsEditing(false);
            setOpen(true);
        };
        const handleEdit = (e) => {
            const item = e.detail;
            console.log("ProductEditor: Received 'edit-product' event for", item.id || item.code);
            setFormData({
                id: item.id || item.code || '',
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
            console.log("ProductEditor: Component unmounting");
            window.removeEventListener('new-product', handleNew);
            window.removeEventListener('edit-product', handleEdit);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // MAPPING: React fields -> Database fields (catalogo table)
            const productData = {
                codice_articolo: formData.id,
                descrizione: formData.name,
                specifiche: formData.description,
                descrizione_estesa: formData.extended_description,
                costo: parseFloat(formData.price) || 0,
                categoria: formData.category,
                link_immagine: formData.image_url || formData.image,
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
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{isEditing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</Typography>
                    <IconButton onClick={() => setOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            label="Codice Articolo (ID)"
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            variant="outlined"
                            disabled={isEditing}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Emoji / Icona"
                            name="emoji"
                            value={formData.emoji}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Nome Prodotto (Descrizione)"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            variant="outlined"
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
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Prezzo Listino (Costo)"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
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
                            <MenuItem value="5">5%</MenuItem>
                            <MenuItem value="10">10%</MenuItem>
                            <MenuItem value="22">22%</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Unità di Vendita (es. PZ, ML)"
                            name="unita_vendita"
                            value={formData.unita_vendita}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Formato Cartone"
                            name="formato_cartone"
                            value={formData.formato_cartone}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="URL Immagine"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Specifiche / Descrizione Breve"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Descrizione Estesa"
                            name="extended_description"
                            value={formData.extended_description}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpen(false)} color="inherit">Annulla</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    color="primary" 
                    disabled={loading || !formData.name || !formData.id}
                >
                    {loading ? 'Salvataggio...' : 'Salva Prodotto'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
