import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import useStore from '../lib/store';

const BUCKET_NAME = 'catalog';
const STORAGE_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

export function ImageAssociator() {
    const [orphans, setOrphans] = useState([]);
    const [selectedOrphan, setSelectedOrphan] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [statusData, setStatusData] = useState({ message: '', type: '' });

    // Auth check
    const user = useStore(state => state.user);

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadOrphans();
    }, []);

    const showStatus = (message, type = 'success') => {
        setStatusData({ message, type });
        setTimeout(() => setStatusData({ message: '', type: '' }), 5000);
    };

    const loadOrphans = async () => {
        try {
            const { data, error } = await supabase.storage.from(BUCKET_NAME).list('orphans', {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });

            if (error) {
                console.error("Errore caricamento orfani:", error);
                return;
            }

            // Exclude placeholders/hidden files
            const valid = data.filter(f => f.name && f.name !== '.emptyFolderPlaceholder');

            const processed = await Promise.all(valid.map(async (file) => {
                const { data: urlData } = await supabase.storage
                    .from(BUCKET_NAME)
                    .createSignedUrl(`orphans/${file.name}`, 3600); // 1 hour valid

                return {
                    name: file.name,
                    id: file.id,
                    folder: 'orphans/',
                    previewUrl: urlData?.signedUrl
                };
            }));

            setOrphans(processed);

            // If the currently selected orphan was deleted/moved, clear selection
            if (selectedOrphan && !processed.find(o => o.name === selectedOrphan.name)) {
                setSelectedOrphan(null);
            }
        } catch (error) {
            console.error("Errore generico caricamento:", error);
        }
    };

    const handleBatchUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const total = files.length;
        let autoMatchCount = 0;

        try {
            // Ensure inventory is loaded
            let inventory = useStore.getState().inventory;
            if (!inventory || inventory.length === 0) {
                showStatus('Caricamento catalogo per associazione...', 'info');
                await useStore.getState().fetchCatalog();
                inventory = useStore.getState().inventory;
            }

            for (let i = 0; i < total; i++) {
                const file = files[i];
                showStatus(`Elaborazione ${i + 1}/${total}: ${file.name}...`, 'info');

                try {
                    // 1. Image processing (transform to 300x300 SVG via Canvas)
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
                                
                                // Clear canvas
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

                    const blob = await processImageToSVG(file);
                    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

                    // 2. CHECK FOR MULTIPLE PRODUCT CODES
                    // Split by common separators: underscore, dash, space, comma
                    const potentialCodes = nameWithoutExt.split(/[_\-\s,]+/).filter(Boolean);

                    // Find matches in inventory (exact match for each part)
                    const matchedProducts = [];
                    for (const codePart of potentialCodes) {
                        const match = inventory.find(p => p.id === codePart);
                        if (match && !matchedProducts.find(m => m.id === match.id)) {
                            matchedProducts.push(match);
                        }
                    }

                    if (matchedProducts.length > 0) {
                        // AUTO-LINK ALL MATCHES
                        for (const product of matchedProducts) {
                            showStatus(`Collegamento automatico: ${product.id}...`, 'info');

                            const specificNewName = `${product.id}.svg`;
                            const targetPath = `raines_images_cleaned/${specificNewName}`;

                            // Upload (Duplicate for each product as requested)
                            const { error: uploadError } = await supabase.storage
                                .from(BUCKET_NAME)
                                .upload(targetPath, blob, {
                                    cacheControl: '0',
                                    upsert: true,
                                    contentType: 'image/svg+xml'
                                });

                            if (uploadError) {
                                console.error(`Errore upload per ${product.id}:`, uploadError);
                                continue;
                            }

                            const publicUrl = `${STORAGE_BASE_URL}/${targetPath}`;

                            // Update DB
                            const { error: dbError } = await supabase
                                .from('catalogo')
                                .update({
                                    link_immagine: publicUrl,
                                    immagine_locale: specificNewName
                                })
                                .eq('codice_articolo', product.id);

                            if (dbError) {
                                console.error(`Errore DB per ${product.id}:`, dbError);
                                continue;
                            }

                            // Update local store
                            useStore.setState(state => ({
                                inventory: state.inventory.map(item =>
                                    item.id === product.id
                                        ? { ...item, image: `${publicUrl}?v=${Date.now()}`, image_url: publicUrl, immagine_locale: specificNewName }
                                        : item
                                )
                            }));
                        }

                        autoMatchCount++; // Increment count of FILES fully associated
                        showStatus(`Auto-associato ${matchedProducts.length} codici da ${file.name}`, 'success');
                    } else {
                        // NO MATCH -> Upload to ORPHANS as generic SVG
                        const newName = nameWithoutExt + ".svg";
                        const { error } = await supabase.storage
                            .from(BUCKET_NAME)
                            .upload('orphans/' + newName, blob, {
                                cacheControl: '0',
                                upsert: true,
                                contentType: 'image/svg+xml'
                            });

                        if (error) throw error;
                    }

                } catch (innerErr) {
                    console.error(`Errore su file ${file.name}:`, innerErr);
                    showStatus(`Errore ${file.name}: ${innerErr.message}`, 'error');
                }
            }

            if (autoMatchCount === total && total > 0) {
                showStatus(`✅ Successo Totale! Tutte le ${total} immagini sono state processate e associate automaticamente.`, 'success');
            } else {
                showStatus(`Elaborazione completata! (${autoMatchCount}/${total} file associati automaticamente)`, 'success');
            }

            await loadOrphans();

        } catch (err) {
            console.error(err);
            showStatus('Errore generale: ' + err.message, 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const searchProducts = async (query) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const { data, error } = await supabase
            .from('catalogo')
            .select('codice_articolo, descrizione')
            .or(`codice_articolo.ilike.%${query}%,descrizione.ilike.%${query}%`)
            .limit(20);

        if (error) {
            console.error("Errore ricerca:", error);
            return;
        }

        setSearchResults(data || []);
    };

    // Add debounce to search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length >= 2) {
                searchProducts(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleAssign = async () => {
        if (!selectedOrphan || !selectedProduct) return;

        setIsAssigning(true);
        showStatus('Spostamento immagine e salvataggio DB in corso...', 'info');

        try {
            const sourcePath = `${selectedOrphan.folder}${selectedOrphan.name}`;
            const targetPath = `raines_images_cleaned/${selectedOrphan.name}`;

            if (sourcePath !== targetPath) {
                const { error: moveError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .move(sourcePath, targetPath);

                if (moveError) {
                    console.warn("Move warning:", moveError);
                    throw new Error('Errore spostamento file: ' + moveError.message);
                }
            }

            const publicUrl = `${STORAGE_BASE_URL}/${targetPath}`;

            const { error: dbError } = await supabase
                .from('catalogo')
                .update({
                    link_immagine: publicUrl,
                    immagine_locale: selectedOrphan.name
                })
                .eq('codice_articolo', selectedProduct.codice_articolo);

            if (dbError) throw new Error('Errore DB: ' + dbError.message);

            // Also update the local store inventory so changes reflect immediately without reload
            useStore.setState(state => ({
                inventory: state.inventory.map(item =>
                    item.id === selectedProduct.codice_articolo
                        ? { ...item, image: `${publicUrl}?v=${Date.now()}`, image_url: publicUrl, immagine_locale: selectedOrphan.name }
                        : item
                )
            }));

            showStatus(`Completato! ${selectedProduct.codice_articolo} collegato a ${selectedOrphan.name}`, 'success');

            // Reset selection
            setSelectedProduct(null);
            setSelectedOrphan(null);
            setSearchQuery('');
            setSearchResults([]);

            // Reload orphans to remove the assigned one
            await loadOrphans();

        } catch (error) {
            console.error(error);
            showStatus('Errore salvataggio: ' + error.message, 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDeleteOrphan = async (e, orphan) => {
        e.stopPropagation(); // prevent selection when deleting
        if (!confirm(`Sei sicuro di voler eliminare ${orphan.name}?`)) return;

        try {
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([`${orphan.folder}${orphan.name}`]);

            if (error) throw error;

            showStatus(`${orphan.name} eliminato.`, 'success');
            if (selectedOrphan?.name === orphan.name) setSelectedOrphan(null);
            loadOrphans();
        } catch (err) {
            console.error("Errore eliminazione orfano:", err);
            showStatus(`Errore eliminazione: ${err.message}`, 'error');
        }
    }

    if (!user) {
        return <div className="p-8 text-center text-red-500 font-bold">Accesso non autorizzato.</div>;
    }

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden font-sans text-gray-800 bg-paper">
            {/* Sidebar: Orphan Images */}
            <div className="w-full lg:w-80 bg-white border-r border-green-primary flex flex-col shrink-0 overflow-hidden shadow-lg z-20">
                <div className="p-4 border-b border-green-primary/20 bg-green-light/30">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-green-dark flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            Immagini Orfane
                        </h2>
                        <span className="bg-green-mid/20 text-green-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-mid/30">
                            {orphans.length} FILE
                        </span>
                    </div>

                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleBatchUpload}
                        accept="image/*"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="btn-skeuo w-full p-2.5 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <span className="animate-pulse">⏳ Elaborazione...</span>
                        ) : (
                            <>➕ Carica Batch (Auto-Link)</>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 pb-20 custom-scrollbar bg-paper/20">
                    {orphans.length === 0 && !isUploading && (
                        <div className="col-span-2 text-center text-gray-400 py-10 text-xs italic">
                            Nessuna immagine orfana trovata.
                        </div>
                    )}
                    {orphans.map(orphan => (
                        <div
                            key={orphan.name}
                            onClick={() => setSelectedOrphan(orphan)}
                            className={`group relative bg-white rounded-xl p-2 cursor-pointer transition-all border-2 flex flex-col items-center shadow-sm ${selectedOrphan?.name === orphan.name
                                ? 'border-green-primary bg-green-light ring-2 ring-green-primary/30'
                                : 'border-gray-100 hover:border-green-mid/50 hover:shadow-md'
                                }`}
                        >
                            <button
                                onClick={(e) => handleDeleteOrphan(e, orphan)}
                                className="absolute -top-1 -right-1 bg-statusRed text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg border border-white"
                                title="Elimina"
                            >
                                ✕
                            </button>
                            <img
                                src={orphan.previewUrl}
                                alt={orphan.name}
                                className="w-full h-20 object-contain rounded bg-gray-50 mb-2"
                                loading="lazy"
                            />
                            <span className="text-[9px] font-mono text-gray-500 w-full truncate text-center" title={orphan.name}>
                                {orphan.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-paper">
                {/* Unified Header */}
                <header className="bg-green-dark text-white p-4 lg:px-8 flex items-center justify-between shadow-md z-30 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => useStore.getState().setView('kit')}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all border border-white/20 flex items-center gap-2 text-sm font-bold"
                            title="Torna al Catalogo Principale"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            INDIETRO
                        </button>
                        <div className="h-8 w-px bg-white/20 mx-2 hidden lg:block"></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Console Associazione</h1>
                            <p className="text-green-light/60 text-[10px] uppercase tracking-widest font-bold -mt-0.5">Gestione Immagini Raines</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-8 lg:gap-12">

                        {/* Preview Column */}
                        <div className="flex flex-col gap-4 shrink-0 xl:w-[450px]">
                            <div className="w-full aspect-square bg-white card-skeuo rounded-3xl flex items-center justify-center p-8 relative overflow-hidden group">
                                {selectedOrphan ? (
                                    <img
                                        src={selectedOrphan.previewUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain drop-shadow-2xl animate-fade-in"
                                    />
                                ) : (
                                    <div className="text-gray-300 font-medium text-center flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-100 flex items-center justify-center">
                                            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <p className="text-sm">Seleziona un'immagine orfana<br />per iniziare</p>
                                    </div>
                                )}
                            </div>
                            {selectedOrphan && (
                                <div className="panel-inset p-3 rounded-xl text-center">
                                    <p className="font-mono text-[11px] text-green-dark break-all font-bold">{selectedOrphan.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Linking Column */}
                        <div className="flex flex-col flex-1 gap-6 min-w-0">
                            {statusData.message && (
                                <div className={`p-4 rounded-xl text-sm font-bold border-2 animate-fade-in shadow-sm ${statusData.type === 'error'
                                    ? 'bg-red-50 border-red-200 text-statusRed'
                                    : statusData.type === 'info'
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-green-50 border-green-200 text-green-dark'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                        {statusData.message}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col relative z-20">
                                <label className="text-sm font-bold mb-2 text-green-dark uppercase tracking-wide">Cerca Prodotto da Collegare:</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cerca per codice o descrizione..."
                                        className="w-full bg-white border-2 border-green-mid/30 p-4 pl-12 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-primary focus:ring-4 focus:ring-green-primary/10 transition-all shadow-sm"
                                        autoComplete="off"
                                    />
                                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-green-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>

                                {/* Search Results Dropdown/List */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-white border-2 border-green-primary rounded-2xl overflow-hidden shadow-2xl custom-scrollbar absolute top-[100%] left-0 right-0 z-30">
                                        {searchResults.map(p => (
                                            <div
                                                key={p.codice_articolo}
                                                onClick={() => {
                                                    setSelectedProduct(p);
                                                    setSearchResults([]);
                                                }}
                                                className="p-4 border-b border-gray-100 cursor-pointer hover:bg-green-light transition-colors flex items-center group"
                                            >
                                                <span className="font-mono bg-green-dark text-white px-3 py-1 rounded-md text-xs mr-4 shrink-0 font-bold group-hover:bg-green-primary">
                                                    {p.codice_articolo}
                                                </span>
                                                <span className="text-sm font-medium text-gray-700 truncate">
                                                    {p.descrizione}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchQuery.length > 1 && searchResults.length === 0 && (
                                    <div className="mt-2 bg-white/80 p-4 rounded-xl text-sm text-gray-400 text-center border border-gray-100 italic">Nessun prodotto trovato.</div>
                                )}
                            </div>

                            {/* Selected Product Card */}
                            <div className={`card-skeuo p-6 rounded-3xl transition-all duration-300 ${selectedProduct ? 'border-green-primary ring-1 ring-green-primary' : 'opacity-60 grayscale-[0.5]'}`}>
                                <h3 className="text-[10px] uppercase tracking-widest text-green-mid font-black mb-3">Scheda Prodotto Selezionata</h3>
                                {selectedProduct ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-dark text-white font-mono px-3 py-1 rounded-lg text-base font-black shadow-md">
                                                {selectedProduct.codice_articolo}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 text-xl font-bold leading-tight mt-1">
                                            {selectedProduct.descrizione}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic text-sm">Seleziona un prodotto dalla ricerca sopra...</p>
                                )}
                            </div>

                            {/* Assign Action */}
                            <div className="mt-auto pt-8 flex flex-col gap-4">
                                <button
                                    onClick={handleAssign}
                                    disabled={!selectedOrphan || !selectedProduct || isAssigning}
                                    className={`btn-skeuo w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all transform active:scale-95 ${!selectedOrphan || !selectedProduct
                                        ? 'opacity-30 grayscale cursor-not-allowed'
                                        : isAssigning
                                            ? 'cursor-wait'
                                            : 'hover:scale-[1.01] hover:shadow-green-primary/40'
                                        }`}
                                >
                                    {isAssigning ? '🔄 SINCRONIZZAZIONE...' : '🔗 ASSOCIA ORA'}
                                </button>

                                <p className="text-center text-[10px] text-green-mid/70 font-bold uppercase tracking-tighter">
                                    L'immagine verrà salvata come SVG e collegata permanentemente nel database Cloud
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #bcc4c0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #9aa5a0;
                }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}

export default ImageAssociator;
