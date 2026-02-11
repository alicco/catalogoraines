import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import useStore from '../lib/store';
import { DraggableItem } from './DraggableItem';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export function Warehouse() {
    const inventory = useStore((state) => state.inventory);
    const fetchCatalog = useStore((state) => state.fetchCatalog);
    const deleteProduct = useStore((state) => state.deleteProduct);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        fetchCatalog();
    }, []);

    // Extract unique categories and sort by count
    const categoryCounts = inventory.reduce((acc, item) => {
        const cat = item.category || 'Altro';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const sortedCategories = Object.keys(categoryCounts).sort((a, b) => {
        return categoryCounts[b] - categoryCounts[a];
    });

    // Logic:
    // 1. Search Active -> Show filtered products globally
    // 2. Category Selected -> Show filtered products by category
    // 3. Default -> Show Category List (Sorted)

    const isSearchActive = search.length > 0;
    const isCategorySelected = selectedCategory !== null;

    const displayedItems = inventory.filter(item => {
        if (isSearchActive) {
            return item.name.toLowerCase().includes(search.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
        }
        if (isCategorySelected) {
            return (item.category || 'Altro') === selectedCategory;
        }
        return false;
    });

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteProduct(itemToDelete.id);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <>
            {/* Search Bar */}
            <div className="relative mb-4 shrink-0 flex gap-2">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </span>
                    <input
                        className="panel-inset w-full text-gray-800 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-primary focus:bg-white text-sm transition-all"
                        placeholder="Cerca prodotti..."
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Sticky Category Header (Visible only when a category is selected and not searching) */}
            {!isSearchActive && isCategorySelected && (
                <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-sm shadow-sm -mx-2 px-2 pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                                title="Torna alle categorie"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h3 className="text-lg font-black text-slate-800 truncate leading-tight">
                                {selectedCategory}
                            </h3>
                        </div>
                        <span className="text-xs bg-teal/10 text-teal px-2 py-1 rounded-full font-bold whitespace-nowrap">
                            {displayedItems.length} Prod.
                        </span>
                    </div>
                </div>
            )}

            {/* Warehouse Content Area */}
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 relative">

                {/* VIEW 1: CATEGORY LIST (Home) - Sorted by quantity */}
                {!isSearchActive && !isCategorySelected && (
                    <div className="flex flex-col gap-2 h-full content-start pb-4">
                        {sortedCategories.map(category => (
                            <CategoryCard
                                key={category}
                                category={category}
                                count={categoryCounts[category]}
                                onSelect={() => setSelectedCategory(category)}
                            />
                        ))}
                    </div>
                )}

                {/* VIEW 2 & 3: PRODUCT GRID (Search or Category Detail) */}
                {(isSearchActive || isCategorySelected) && (
                    <div className="flex flex-col h-full">
                        {displayedItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 italic">
                                Nessun prodotto trovato.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 pb-10">
                                {displayedItems.map(item => (
                                    <DraggableItem
                                        key={item.id}
                                        item={item}
                                        onDelete={() => handleDeleteClick(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Elimina Prodotto</DialogTitle>
                <DialogContent>
                    Sei sicuro di voler eliminare <b>{itemToDelete?.name}</b>?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
                    <Button onClick={confirmDelete} variant="contained" color="error" startIcon={<DeleteIcon />}>
                        Elimina
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function CategoryCard({ category, count, onSelect }) {
    const inventory = useStore((state) => state.inventory);
    const addToCatalog = useStore((state) => state.addToCatalog);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'CATEGORY',
        item: {
            name: category,
            type: 'CATEGORY',
            products: inventory.filter(p => (p.category || 'Altro') === category)
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [category, inventory]);

    return (
        <button
            ref={drag}
            onClick={onSelect}
            className={`btn-skeuo px-4 py-4 rounded-xl shadow-md flex items-center justify-between transition-all hover:translate-x-1 active:scale-[0.98] border-2 border-transparent hover:border-teal/30 ${isDragging ? 'opacity-40 scale-95' : 'bg-slate-800'}`}
        >
            <div className="flex flex-col items-start">
                <span className="font-black text-white text-sm md:text-base uppercase tracking-tight">{category}</span>
            </div>
            <span className="text-xs bg-teal text-white w-8 h-8 flex items-center justify-center rounded-full font-black shadow-inner">
                {count}
            </span>
        </button>
    );
}
