import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { products as initialProducts } from '../data/products';

// Helper to load/save to localStorage
const loadLocalInventory = () => {
    try {
        const saved = localStorage.getItem('raines-inventory-v3'); // FORCE REFRESH V3
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error("Error loading local inventory", e);
    }
    // Ensure we always return an array, even if initialProducts is undefined for some reason
    return Array.isArray(initialProducts) ? initialProducts : [];
};

const saveLocalInventory = (inventory) => {
    try {
        localStorage.setItem('raines-inventory-v3', JSON.stringify(inventory));
    } catch (e) {
        console.error("Error saving local inventory", e);
    }
};

const useStore = create((set, get) => ({
    // --- Auth State ---
    user: null,
    isAuthenticated: false,
    authLoading: true,

    // Catalog State - Start with empty, will be filled by fetchCatalog
    inventory: [],
    categories: ['All'],
    loading: false,

    // Catalog Builder State
    catalogItems: [],
    catalogDiscount: 0,
    catalogExpirationDate: null,

    setCatalogMetadata: (metadata) => set((state) => ({
        catalogDiscount: metadata.discount !== undefined ? metadata.discount : state.catalogDiscount,
        catalogExpirationDate: metadata.expirationDate !== undefined ? metadata.expirationDate : state.catalogExpirationDate
    })),

    // --- Catalog Actions ---
    fetchCatalog: async () => {
        try {
            set({ loading: true });
            const { data, error } = await supabase
                .from('catalogo')
                .select('*')
                .order('codice_articolo', { ascending: true });

            if (error) {
                console.error("Error fetching catalog:", error);
            } else if (data) {
                // Ensure categories are updated based on fetched data
                const uniqueCategories = ['All', ...new Set(data.map(p => p.categoria).filter(Boolean))].sort();

                // DATA NORMALIZATION: Map catalogo fields to app internal model
                const timestamp = Date.now();
                const normalizedData = data.map(p => ({
                    id: p.codice_articolo,
                    _dbId: p.id, // Keep the numeric DB id for updates
                    name: p.descrizione || '',
                    description: p.specifiche || '',
                    extended_description: p.descrizione_estesa || '',
                    price: parseFloat(p.costo) || 0,
                    category: p.categoria || 'Altro',
                    image: p.link_immagine ? `${p.link_immagine}?v=${timestamp}` : '',
                    image_url: p.link_immagine || '',
                    // Extra catalogo fields
                    formato_cartone: p.formato_cartone || '',
                    unita_vendita: p.unita_vendita || '',
                    iva: parseFloat(p.iva) || 0,
                    costo_al_metro: parseFloat(p.costo_al_metro) || 0,
                    immagine_locale: p.immagine_locale || '',
                }));

                set({
                    inventory: normalizedData,
                    categories: uniqueCategories,
                    loading: false
                });
            }
        } catch (err) {
            console.error("Unexpected error fetching catalog:", err);
            set({ loading: false });
        }
    },

    // --- Catalog Builder Actions ---
    addToCatalog: (product) => set((state) => {
        // No more quantity stacking as per user request. 
        // Every addition creates a new instance with quantity 1.
        const newCatalogItems = [...state.catalogItems, { ...product, instanceId: crypto.randomUUID(), quantity: 1 }];

        return {
            catalogItems: newCatalogItems
        };
    }),

    removeFromCatalog: (instanceId) => set((state) => {
        const newCatalogItems = state.catalogItems.filter(i => i.instanceId !== instanceId);
        return {
            catalogItems: newCatalogItems
        };
    }),

    // updateQuantity removed as per user request. Quantity is always 1.

    clearCatalog: () => set({ catalogItems: [], catalogDiscount: 0, catalogExpirationDate: null }),

    setCatalogItems: (items) => {
        // Ensure items have quantity
        const validatedItems = items.map(i => ({ ...i, quantity: i.quantity || 1 }));
        set({ catalogItems: validatedItems });
    },

    addProduct: async (newProduct) => {
        // Map app fields -> catalogo fields
        const payload = {
            codice_articolo: newProduct.id,
            descrizione: newProduct.name || '',
            specifiche: newProduct.description || '',
            descrizione_estesa: newProduct.extended_description || '',
            costo: parseFloat(newProduct.price) || 0,
            categoria: newProduct.category || 'Altro',
            link_immagine: newProduct.image_url || '',
            formato_cartone: newProduct.formato_cartone || '',
            unita_vendita: newProduct.unita_vendita || '',
            iva: parseFloat(newProduct.iva) || 0,
            costo_al_metro: parseFloat(newProduct.costo_al_metro) || 0,
        };

        const { data, error } = await supabase
            .from('catalogo')
            .insert([payload])
            .select();

        if (error) {
            console.error("Error adding product:", error);
            throw error;
        }

        if (data) {
            set((state) => {
                const p = data[0];
                const normalizedItem = {
                    id: p.codice_articolo,
                    _dbId: p.id,
                    name: p.descrizione || '',
                    description: p.specifiche || '',
                    extended_description: p.descrizione_estesa || '',
                    price: parseFloat(p.costo) || 0,
                    category: p.categoria || 'Altro',
                    image: p.link_immagine || '',
                    image_url: p.link_immagine || '',
                };
                return {
                    inventory: [...state.inventory, normalizedItem]
                };
            });
        }
    },

    updateProduct: async (updatedProduct) => {
        // Map app fields -> catalogo fields
        const payload = {
            descrizione: updatedProduct.name || '',
            specifiche: updatedProduct.description || '',
            descrizione_estesa: updatedProduct.extended_description || '',
            costo: parseFloat(updatedProduct.price) || 0,
            categoria: updatedProduct.category || 'Altro',
            link_immagine: updatedProduct.image_url || '',
            updated_at: new Date().toISOString(),
        };
        if (updatedProduct.formato_cartone !== undefined) payload.formato_cartone = updatedProduct.formato_cartone;
        if (updatedProduct.unita_vendita !== undefined) payload.unita_vendita = updatedProduct.unita_vendita;
        if (updatedProduct.iva !== undefined) payload.iva = parseFloat(updatedProduct.iva) || 0;
        if (updatedProduct.costo_al_metro !== undefined) payload.costo_al_metro = parseFloat(updatedProduct.costo_al_metro) || 0;

        const { data, error } = await supabase
            .from('catalogo')
            .update(payload)
            .eq('codice_articolo', updatedProduct.id)
            .select();

        if (error) {
            console.error("Error updating product:", error);
            throw error;
        }

        if (data && data.length > 0) {
            const p = data[0];
            set((state) => ({
                inventory: state.inventory.map((item) =>
                    item.id === updatedProduct.id ? {
                        ...item,
                        name: p.descrizione || '',
                        description: p.specifiche || '',
                        extended_description: p.descrizione_estesa || '',
                        price: parseFloat(p.costo) || 0,
                        category: p.categoria || 'Altro',
                        image: p.link_immagine || '',
                        image_url: p.link_immagine || '',
                    } : item
                )
            }));
        }
    },

    deleteProduct: async (id) => {
        const { error } = await supabase
            .from('catalogo')
            .delete()
            .eq('codice_articolo', id);

        if (error) {
            console.error("Error deleting product:", error);
            throw error;
        }

        set((state) => ({
            inventory: state.inventory.filter((item) => item.id !== id)
        }));
    },

    toggleAdminMode: () => set((state) => ({ isAdminMode: !state.isAdminMode })),

    // --- Auth Actions ---
    checkUser: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({
                user: session?.user || null,
                isAuthenticated: !!session?.user,
                authLoading: false,
            });
        } catch (err) {
            console.error('Error checking user session:', err);
            set({ user: null, isAuthenticated: false, authLoading: false });
        }

        supabase.auth.onAuthStateChange((_event, session) => {
            set({
                user: session?.user || null,
                isAuthenticated: !!session?.user,
            });
        });
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        set({ user: data.user, isAuthenticated: true });
        return data;
    },

    signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, myKits: [] });
    },

    // --- Database Actions ---
    saveCatalogToSupabase: async (info) => {
        const state = get();
        if (!state.user) throw new Error("Devi effettuare il login per salvare.");

        const catalogData = {
            user_id: state.user.id,
            name: info.name || `Catalogo ${new Date().toLocaleDateString()}`,
            items: state.catalogItems,
            total_price: 0 // No longer using total price
        };

        const { data, error } = await supabase
            .from('medical_kits') // Keep table name for now to avoid DB changes
            .insert([catalogData])
            .select();

        if (error) throw error;
        return data[0];
    },

    fetchMyKits: async () => {
        const state = get();
        if (!state.user) return;

        const { data, error } = await supabase
            .from('medical_kits')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching kits:", error);
        } else {
            set({ myKits: data });
        }
    },

    // Legacy URL Load
    loadFromEncoded: (encoded) => {
        try {
            const decoded = atob(encoded);
            const ids = JSON.parse(decoded);
            const state = get();

            // Re-find items in inventory
            const newItems = ids.map(id => {
                const product = state.inventory.find(p => p.id === id);
                return product ? { ...product, instanceId: crypto.randomUUID() } : null;
            }).filter(Boolean);

            const total = 0; // Price no longer tracked
            set({ catalogItems: newItems });
        } catch (e) {
            console.error("Errore loading shared catalog", e);
        }
    },

    getShareLink: () => {
        const state = get();
        const itemIds = state.catalogItems.map(item => item.id);
        const data = JSON.stringify(itemIds);
        const encoded = btoa(data);
        const url = new URL(window.location.href);
        url.searchParams.set('k', encoded);
        return url.toString();
    },

    // --- Saved Kits (Quotes) Actions - NOW PERSISTED TO SUPABASE ---
    savedKits: [],

    fetchSavedKits: async () => {
        try {
            const { data, error } = await supabase
                .from('saved_kits')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Normalize snake_case to camelCase for frontend
            // Re-resolve image URLs from current inventory
            const currentInventory = get().inventory;
            const resolveImages = (items) => (items || []).map(item => {
                const fresh = currentInventory.find(p => p.id === item.id);
                return fresh ? { ...item, image: fresh.image, image_url: fresh.image_url } : item;
            });

            const normalizedKits = (data || []).map(kit => ({
                id: kit.id,
                name: kit.name,
                items: resolveImages(kit.items),
                totalPrice: parseFloat(kit.total_price) || 0,
                discount: parseFloat(kit.discount) || 0,
                expirationDate: kit.expiration_date,
                createdAt: kit.created_at,
                updatedAt: kit.updated_at
            }));

            set({ savedKits: normalizedKits });
        } catch (error) {
            console.error('Error fetching saved kits:', error);
        }
    },

    saveLocalCatalog: async (catalogDetails) => {
        const state = get();
        const isUpdate = !!catalogDetails.id && !!catalogDetails.items;

        const catalogData = {
            name: catalogDetails.name,
            items: isUpdate ? catalogDetails.items : state.catalogItems,
            total_price: 0,
            discount: catalogDetails.discount !== undefined ? catalogDetails.discount : 0,
            expiration_date: catalogDetails.expirationDate || null,
            updated_at: new Date().toISOString()
        };

        try {
            if (isUpdate && catalogDetails.id) {
                // Update existing catalog
                const { error } = await supabase
                    .from('saved_kits')
                    .update(catalogData)
                    .eq('id', catalogDetails.id);

                if (error) throw error;
            } else {
                // Insert new catalog
                const { error } = await supabase
                    .from('saved_kits')
                    .insert([catalogData]);

                if (error) throw error;
            }

            // Refresh the list from database
            await get().fetchSavedKits();
        } catch (error) {
            console.error('Error saving catalog:', error);
            alert('Errore durante il salvataggio del catalogo: ' + error.message);
        }
    },

    deleteLocalCatalog: async (id) => {
        try {
            const { error } = await supabase
                .from('saved_kits')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Refresh the list from database
            await get().fetchSavedKits();
        } catch (error) {
            console.error('Error deleting catalog:', error);
            alert('Errore durante l\'eliminazione del catalogo: ' + error.message);
        }
    },

    loadLocalCatalog: (catalog) => {
        // Re-resolve images from current inventory to avoid stale URLs
        const currentInventory = get().inventory;
        const resolvedItems = (catalog.items || []).map(item => {
            const fresh = currentInventory.find(p => p.id === item.id);
            return fresh ? { ...item, image: fresh.image, image_url: fresh.image_url, price: fresh.price } : item;
        });
        set({
            catalogItems: resolvedItems,
            catalogDiscount: catalog.discount || 0,
            catalogExpirationDate: catalog.expirationDate || null
        });
    },
    // --- Promotions Engine ---
    promotions: [],

    loadPromotions: () => {
        try {
            const saved = localStorage.getItem('raines-promotions-v1');
            if (saved) {
                set({ promotions: JSON.parse(saved) });
            }
        } catch (e) {
            console.error("Error loading promotions", e);
        }
    },

    _savePromotionsToStorage: (promos) => {
        try {
            localStorage.setItem('raines-promotions-v1', JSON.stringify(promos));
        } catch (e) {
            console.error("Error saving promotions", e);
        }
    },

    savePromotion: (promo) => {
        set((state) => {
            const existing = state.promotions.find(p => p.id === promo.id);
            let updated;
            if (existing) {
                updated = state.promotions.map(p => p.id === promo.id ? { ...p, ...promo, updatedAt: new Date().toISOString() } : p);
            } else {
                const newPromo = {
                    ...promo,
                    id: promo.id || crypto.randomUUID(),
                    active: promo.active !== undefined ? promo.active : true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                updated = [...state.promotions, newPromo];
            }
            get()._savePromotionsToStorage(updated);
            return { promotions: updated };
        });
    },

    deletePromotion: (id) => {
        set((state) => {
            const updated = state.promotions.filter(p => p.id !== id);
            get()._savePromotionsToStorage(updated);
            return { promotions: updated };
        });
    },

    togglePromotion: (id) => {
        set((state) => {
            const updated = state.promotions.map(p =>
                p.id === id ? { ...p, active: !p.active, updatedAt: new Date().toISOString() } : p
            );
            get()._savePromotionsToStorage(updated);
            return { promotions: updated };
        });
    },

    getActivePromotions: () => {
        const state = get();
        const now = new Date().toISOString().slice(0, 10);
        return state.promotions.filter(p => {
            if (!p.active) return false;
            if (p.validFrom && now < p.validFrom) return false;
            if (p.validTo && now > p.validTo) return false;
            return true;
        });
    },

    loading: false,
    myKits: [],
    isAdminMode: true,
    currentView: 'kit', // 'kit' or 'product-manager' or 'promo-manager'

    setView: (view) => set({ currentView: view }),
}));

export default useStore;
