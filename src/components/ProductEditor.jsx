import React, { useState, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL } from '../lib/supabaseClient';
import useStore from '../lib/store';

const BUCKET_NAME = 'catalog';
const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

export function ProductEditor({ productId, onClose }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [newImageFile, setNewImageFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const fetchProduct = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('catalogo')
            .select('*')
            .eq('codice_articolo', productId)
            .single();
        
        if (error) {
            console.error("Errore fetch prodotto:", error);
        } else {
            setProduct(data);
            setImagePreview(data.link_immagine);
        }
        setLoading(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('Salvataggio in corso...');

        try {
            let imageUrl = product.link_immagine;
            let immagineLocale = product.immagine_locale;

            // 1. If there's a new image, process and upload it
            if (newImageFile) {
                const processImageToSVG = (sourceFile) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        const objectUrl = URL.createObjectURL(sourceFile);
                        
                        img.onload = () => {
                            URL.revokeObjectURL(objectUrl);
                            
                            // Internal high-res for quality (600px), final display 300px
                            const INTERNAL_SIZE = 600;
                            const DISPLAY_SIZE = 300;
                            
                            // 1. CREATE TEMP CANVAS FOR PROCESSING & BACKGROUND REMOVAL
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = img.width;
                            tempCanvas.height = img.height;
                            const tCtx = tempCanvas.getContext('2d');
                            tCtx.drawImage(img, 0, 0);
                            
                            const tData = tCtx.getImageData(0, 0, img.width, img.height);
                            const pixels = tData.data;
                            
                            let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
                            let foundContent = false;

                            // 2. REMOVE BACKGROUND & FIND BOUNDS
                            for (let j = 0; j < pixels.length; j += 4) {
                                const r = pixels[j];
                                const g = pixels[j + 1];
                                const b = pixels[j + 2];
                                
                                // Threshold 230 for aggressive removal
                                if ((r > 230 && g > 230 && b > 230) || (r + g + b > 690)) {
                                    pixels[j + 3] = 0; // Transparent
                                } else {
                                    // Update bounding box
                                    const x = (j / 4) % img.width;
                                    const y = Math.floor((j / 4) / img.width);
                                    minX = Math.min(minX, x);
                                    minY = Math.min(minY, y);
                                    maxX = Math.max(maxX, x);
                                    maxY = Math.max(maxY, y);
                                    foundContent = true;
                                }
                            }
                            tCtx.putImageData(tData, 0, 0);

                            // 3. FINAL CANVAS (Standard 300x300 box, but rendered at 600px for sharpness)
                            const finalCanvas = document.createElement('canvas');
                            finalCanvas.width = INTERNAL_SIZE;
                            finalCanvas.height = INTERNAL_SIZE;
                            const fCtx = finalCanvas.getContext('2d');
                            fCtx.imageSmoothingEnabled = true;
                            fCtx.imageSmoothingQuality = 'high';

                            if (foundContent) {
                                const contentW = maxX - minX + 1;
                                const contentH = maxY - minY + 1;
                                
                                // Scale to fit content into INTERNAL_SIZE with 5% padding
                                const PADDING = 0.05;
                                const safeArea = INTERNAL_SIZE * (1 - PADDING * 2);
                                const scale = Math.min(safeArea / contentW, safeArea / contentH);
                                
                                const drawW = contentW * scale;
                                const drawH = contentH * scale;
                                const offX = (INTERNAL_SIZE - drawW) / 2;
                                const offY = (INTERNAL_SIZE - drawH) / 2;
                                
                                fCtx.drawImage(tempCanvas, minX, minY, contentW, contentH, offX, offY, drawW, drawH);
                            } else {
                                // Fallback
                                fCtx.drawImage(tempCanvas, 0, 0, INTERNAL_SIZE, INTERNAL_SIZE);
                            }
                            
                            // Get PNG base64
                            const dataUrl = finalCanvas.toDataURL('image/png');
                            const base64Data = dataUrl.split(',')[1];
                            
                            // Construct SVG (ViewBox 300 300)
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

                const svgBlob = await processImageToSVG(newImageFile);
                immagineLocale = `${product.codice_articolo}.svg`;
                const storagePath = `raines_images_cleaned/${immagineLocale}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(storagePath, svgBlob, {
                        cacheControl: '0',
                        upsert: true,
                        contentType: 'image/svg+xml'
                    });

                if (uploadError) throw uploadError;
                imageUrl = `${STORAGE_BASE_URL}/${storagePath}`;
            }

            // 2. Update database record
            const { error: updateError } = await supabase
                .from('catalogo')
                .update({
                    descrizione: product.descrizione,
                    prezzo_listino: product.prezzo_listino,
                    note: product.note,
                    link_immagine: imageUrl,
                    immagine_locale: immagineLocale,
                    updated_at: new Date().toISOString()
                })
                .eq('codice_articolo', product.codice_articolo);

            if (updateError) throw updateError;

            // 3. Update local store
            useStore.getState().updateItem(product.codice_articolo, {
                descrizione: product.descrizione,
                prezzo_listino: product.prezzo_listino,
                note: product.note,
                image: `${imageUrl}?v=${Date.now()}`,
                image_url: imageUrl,
                immagine_locale: immagineLocale
            });

            setMessage('Prodotto salvato con successo!');
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            console.error("Errore salvataggio:", error);
            setMessage(`Errore: ${error.message}`);
        }
        setSaving(false);
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Caricamento scheda prodotto...</div>;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scale-up border-4 border-green-primary">
                
                {/* Image Section */}
                <div className="w-full md:w-5/12 bg-green-light/20 p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-green-primary/10">
                    <div className="w-full aspect-square bg-white card-skeuo rounded-2xl flex items-center justify-center p-4 relative group">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-xl" />
                        ) : (
                            <div className="text-gray-300 italic text-sm">Nessuna immagine</div>
                        )}
                        
                        <div className="absolute inset-0 bg-green-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <button 
                                onClick={() => fileInputRef.current.click()}
                                className="bg-white text-green-dark font-bold px-4 py-2 rounded-full text-xs shadow-lg hover:bg-green-light transition-colors"
                            >
                                CAMBIA IMMAGINE
                            </button>
                        </div>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        className="hidden" 
                        accept="image/*"
                    />
                    
                    <div className="mt-6 text-center">
                        <span className="font-mono bg-green-dark text-white px-3 py-1 rounded-md text-sm font-bold shadow-sm">
                            {product.codice_articolo}
                        </span>
                    </div>
                </div>

                {/* Form Section */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-black text-green-dark tracking-tight">EDIT SCHEDA PRODOTTO</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-statusRed transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="group">
                            <label className="text-[10px] font-black text-green-mid uppercase tracking-widest mb-1 block">Descrizione Articolo</label>
                            <textarea 
                                value={product.descrizione || ''} 
                                onChange={(e) => setProduct({...product, descrizione: e.target.value})}
                                className="w-full bg-paper/30 border-2 border-gray-100 p-3 rounded-xl focus:border-green-primary focus:outline-none transition-all min-h-[100px] text-sm font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-green-mid uppercase tracking-widest mb-1 block">Prezzo Listino</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={product.prezzo_listino || 0} 
                                        onChange={(e) => setProduct({...product, prezzo_listino: parseFloat(e.target.value)})}
                                        className="w-full bg-paper/30 border-2 border-gray-100 p-3 pl-8 rounded-xl focus:border-green-primary focus:outline-none transition-all text-sm font-bold"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-green-mid uppercase tracking-widest mb-1 block">Categoria/Note</label>
                                <input 
                                    type="text" 
                                    value={product.note || ''} 
                                    onChange={(e) => setProduct({...product, note: e.target.value})}
                                    className="w-full bg-paper/30 border-2 border-gray-100 p-3 rounded-xl focus:border-green-primary focus:outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`mt-4 p-3 rounded-xl text-xs font-bold text-center animate-fade-in ${message.includes('Errore') ? 'bg-red-50 text-statusRed' : 'bg-green-50 text-green-dark'}`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-8 flex gap-3">
                        <button 
                            disabled={saving}
                            onClick={handleSave}
                            className="flex-1 btn-skeuo py-4 rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 transform active:scale-95 transition-all"
                        >
                            {saving ? '⏳ SALVATAGGIO...' : '💾 SALVA MODIFICHE'}
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-6 border-2 border-gray-100 hover:border-gray-200 rounded-2xl text-gray-400 font-bold transition-all"
                        >
                            ANNULLA
                        </button>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                @keyframes scale-up {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-up {
                    animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #bcc4c0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

export default ProductEditor;
