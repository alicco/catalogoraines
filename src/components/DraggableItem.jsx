import React from 'react';
import { useDrag } from 'react-dnd';
import useStore from '../lib/store';

export function DraggableItem({ item, onDelete }) {
    const addToCatalog = useStore((state) => state.addToCatalog);
    const isAdminMode = useStore((state) => state.isAdminMode);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'PRODUCT',
        item: { ...item },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [item]);

    return (
        <article
            ref={drag}
            className={`bg-white rounded-lg p-2 pt-0 flex flex-col items-center text-center relative shadow-sm cursor-grab active:cursor-grabbing group transition-all border border-gray-100 ${isDragging ? 'opacity-40 scale-90' : ''}`}
        >
            <div className="w-full bg-gray-50 border-b border-gray-100 py-1 mb-2 rounded-t-lg">
                <span className="text-[10px] font-black text-green-primary uppercase tracking-tighter">{item.id}</span>
            </div>

            <div className="absolute top-8 left-2 bg-white/80 backdrop-blur shadow-sm text-gray-500 text-[9px] px-1.5 py-0.5 rounded-full font-semibold max-w-[80%] truncate border border-gray-100">{item.category || 'Prod.'}</div>

            {/* Image Container - Fixed square to prevent overflow */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mt-4 mb-2 flex items-center justify-center rounded overflow-hidden">
                {item.image ? (
                    <img
                        alt={item.name}
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                        src={item.image}
                        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                        draggable={false}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span class="text-xs text-red-500 font-bold">Error</span>`;
                        }}
                    />
                ) : (
                    <span className="text-sm font-mono font-bold text-gray-400">{item.id}</span>
                )}
            </div>

            {/* Compact Details */}
            <h3 className="font-bold text-xs text-slate-800 leading-tight mb-0.5 line-clamp-2 min-h-[2.5em]">{item.name}</h3>

            {/* Actions */}
            <div className="mt-auto w-full flex flex-col gap-1">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        addToCatalog(item);
                    }}
                    className="w-full bg-darkBlue hover:bg-opacity-90 active:scale-95 text-white text-[10px] font-black py-2 rounded-full shadow-sm transition-all duration-150 min-h-[24px] uppercase tracking-tighter"
                    aria-label={`Aggiungi ${item.name}`}
                >
                    Seleziona
                </button>

                {isAdminMode && (
                    <div className="w-full mt-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(new CustomEvent('edit-product', { detail: item }));
                            }}
                            className="w-full bg-teal hover:bg-teal/90 text-white text-[10px] font-extrabold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                            aria-label={`Modifica ${item.name}`}
                        >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            EDT
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}
