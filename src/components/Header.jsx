import React from 'react';
import useStore from '../lib/store';

export function Header() {
    const isAdminMode = useStore((state) => state.isAdminMode);
    const currentView = useStore((state) => state.currentView);
    const setView = useStore((state) => state.setView);
    const signOut = useStore((state) => state.signOut);
    const user = useStore((state) => state.user);

    const handleNewProduct = () => {
        window.dispatchEvent(new CustomEvent('new-product'));
    };

    return (
        <header className="bg-green-primary border-b border-green-dark shadow-md text-white h-16 md:h-20 flex items-center justify-between px-3 md:px-6 shrink-0 z-10 w-full">
            {/* Logo Area */}
            <div className="flex items-center gap-2 md:gap-4">
                <img
                    src="/RainesNero.svg"
                    alt="Raines Logo"
                    className="h-14 md:h-18 w-auto px-2"
                />
                <div className="hidden sm:flex flex-col border-l border-white/20 pl-4">
                    <h1 className="text-xl font-black tracking-tighter text-white">CATALOG<span className="text-white/60">MANAGER</span></h1>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Professional Equipment Dashboard</p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-2 md:gap-6 text-xs md:text-sm font-medium">
                <div className="flex items-center gap-1 md:gap-2">
                    <div className="flex gap-1 md:gap-3 flex-wrap justify-end">
                        {isAdminMode && currentView === 'kit' && (
                            <>
                                <button
                                    onClick={() => setView('quote-manager')}
                                    className="btn-skeuo px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm"
                                >
                                    <span className="hidden md:inline">Gestione Cataloghi</span>
                                    <span className="md:hidden">Cataloghi</span>
                                </button>
                                <button
                                    onClick={() => setView('product-manager')}
                                    className="btn-skeuo px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm"
                                >
                                    <span className="hidden md:inline">Gestione Prodotti</span>
                                    <span className="md:hidden">Prodotti</span>
                                </button>
                                <button
                                    onClick={handleNewProduct}
                                    className="btn-skeuo-red px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-white shadow-sm text-xs md:text-sm"
                                >
                                    <span className="hidden md:inline">Nuovo Prodotto</span>
                                    <span className="md:hidden">+ Nuovo</span>
                                </button>
                            </>
                        )}
                        {/* Logout button */}
                        <button
                            onClick={signOut}
                            className="btn-skeuo px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-1.5 opacity-80 hover:opacity-100"
                            title={user?.email || 'Logout'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden md:inline">Esci</span>
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
}
