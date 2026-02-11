import React from 'react';
import { useDrop } from 'react-dnd';
import useStore from '../lib/store';

export function CatalogBuilder({ dropAnimation, onDrop }) {
    const catalogItems = useStore((state) => state.catalogItems);
    const removeFromCatalog = useStore((state) => state.removeFromCatalog);
    const addToCatalog = useStore((state) => state.addToCatalog);
    const clearCatalog = useStore((state) => state.clearCatalog);

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ['PRODUCT', 'CATEGORY'],
        drop: (item) => {
            if (item.type === 'CATEGORY') {
                // Bulk add products from category
                (item.products || []).forEach(p => addToCatalog(p));
            } else {
                if (onDrop) {
                    onDrop(item);
                } else {
                    addToCatalog(item);
                }
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }), [onDrop, addToCatalog]);

    const isActive = isOver && canDrop;

    return (
        <>
            <div className="pt-4 pb-2 md:pt-6 md:pb-4 text-center relative px-6">
                <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">Catalogo Personalizzato</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Trascina prodotti o categorie qui</p>

                {catalogItems.length > 0 && (
                    <button
                        onClick={() => clearCatalog()}
                        className="absolute top-1/2 -translate-y-1/2 right-4 text-[10px] font-black bg-red-500 text-white px-3 py-1.5 rounded shadow-lg hover:bg-red-600 transition-all uppercase"
                    >
                        Svuota
                    </button>
                )}
            </div>

            {/* Draggable Area Container - Full height drop zone */}
            <div
                ref={drop}
                className={`flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar transition-all duration-200 ${isActive ? 'bg-teal/20 ring-4 ring-teal ring-inset' : canDrop ? 'bg-teal/5' : ''} ${dropAnimation ? 'scale-95' : 'scale-100'}`}
                style={{ touchAction: 'auto' }}
            >
                {catalogItems.length === 0 ? (
                    <div className={`h-full flex flex-col items-center justify-center text-gray-400 ${isActive ? 'opacity-100 scale-110' : 'opacity-60'} transition-all`}>
                        <div className={`w-20 h-20 md:w-24 md:h-24 border-4 border-dashed rounded-2xl mb-4 flex items-center justify-center transition-all ${isActive ? 'border-teal text-teal bg-teal/10 scale-110' : canDrop ? 'border-teal/50' : 'border-gray-300'}`}>
                            <span className="text-3xl md:text-4xl">{isActive ? '✓' : '+'}</span>
                        </div>
                        <p className="font-bold text-sm md:text-base">{isActive ? 'Rilascia ora!' : 'Trascina qui i prodotti'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
                        {catalogItems.map((item, index) => (
                            <CatalogItem key={item.instanceId} item={item} index={index} onRemove={() => removeFromCatalog(item.instanceId)} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function CatalogItem({ item, index, onRemove }) {

    return (
        <div className="bg-white rounded-lg relative flex flex-col items-center group shadow-sm border border-gray-100 overflow-hidden">
            <div className="w-full bg-green-primary/10 border-b border-green-primary/10 py-1 flex items-center justify-center">
                <span className="text-[10px] font-black text-green-primary uppercase tracking-tighter">{item.id}</span>
            </div>

            <button
                onClick={onRemove}
                className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition-colors z-10 p-1"
                title="Rimuovi"
            >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
            </button>

            <div className="w-16 h-16 md:w-20 md:h-20 my-2 flex items-center justify-center rounded overflow-hidden">
                {item.image ? (
                    <img
                        alt={item.name}
                        className="w-full h-full object-contain"
                        src={item.image}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span class="text-xs text-red-500 font-bold">Err</span>`;
                        }}
                    />
                ) : (
                    <span className="text-xs font-mono font-bold text-gray-400">📦</span>
                )}
            </div>

            <div className="text-center w-full px-2 pb-3">
                <h4 className="font-bold text-xs leading-tight line-clamp-2 h-8 overflow-hidden">{item.name}</h4>
                <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Sorgente: {item.category}</div>
            </div>
        </div>
    );
}
