import React, { useState, useEffect } from 'react';
import { DndProvider, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { Warehouse } from './components/Warehouse';
import { CatalogBuilder } from './components/CatalogBuilder';
import { TotalPanel } from './components/TotalPanel';
import { Toast } from './components/Toast';
import useStore from './lib/store';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';

import { ProductEditor } from './components/ProductEditor';

import ErrorBoundary from './components/ErrorBoundary';

import { ProductManager } from './components/ProductManager';
import { QuoteManager } from './components/QuoteManager';
import { PromoManager } from './components/PromoManager';
import { FlipbookCatalog2 } from './components/FlipbookCatalog2';

// Custom Drag Layer for preview during drag (touch only, HTML5 has native preview)
function CustomDragLayer() {
  const { isDragging, item, currentOffset, itemType } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType(),
  }));

  // Only show on touch devices (check if touch is supported and no mouse)
  const isTouchDevice = 'ontouchstart' in window;

  if (!isDragging || !currentOffset || !item || !isTouchDevice) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
        left: 0,
        top: 0,
        transform: `translate(${currentOffset.x - 48}px, ${currentOffset.y - 48}px)`,
      }}
    >
      <div className="w-32 bg-white p-2 rounded-lg shadow-2xl ring-2 ring-teal flex flex-col items-center">
        {item.image && (
          <img src={item.image} className="w-20 h-20 object-contain mb-1" alt="" />
        )}
        <div className="font-bold text-xs text-center line-clamp-2">{item.name}</div>
      </div>
    </div>
  );
}

// Multi-backend configuration
const HTML5toTouch = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition,
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: { enableMouseEvents: false, delayTouchStart: 300, ignoreContextMenu: true },
      preview: true,
      transition: TouchTransition,
    },
  ],
};

function App() {
  const [toast, setToast] = useState(null);
  const [dropAnimation, setDropAnimation] = useState(false);
  const inventory = useStore((state) => state.inventory);
  const fetchCatalog = useStore((state) => state.fetchCatalog);
  const currentView = useStore((state) => state.currentView);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const authLoading = useStore((state) => state.authLoading);
  const checkUser = useStore((state) => state.checkUser);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCatalog();

      const params = new URLSearchParams(window.location.search);
      const catalogData = params.get('k');
      if (catalogData) {
        useStore.getState().loadFromEncoded(catalogData);
        setToast({ message: "Catalogo caricato!", type: "info" });
      }
    }
  }, [fetchCatalog, isAuthenticated]);

  // Handle item drop - called from CatalogBuilder
  const handleDrop = (item) => {
    // Only animate on touch devices
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) {
      setDropAnimation(true);
      setTimeout(() => setDropAnimation(false), 400);
    }
    useStore.getState().addToCatalog(item);
    setToast({ message: `${item.name} aggiunto al catalogo`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Auth Gate ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1E3F2F, #2E5C45)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <img src="/RainesNero.svg" alt="Raines" className="h-16 w-auto brightness-0 invert opacity-60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (currentView === 'product-manager') {
    return (
      <ErrorBoundary>
        <ProductManager />
        <ProductEditor />
      </ErrorBoundary>
    );
  }

  if (currentView === 'quote-manager') {
    return (
      <ErrorBoundary>
        <QuoteManager />
      </ErrorBoundary>
    );
  }

  if (currentView === 'promo-manager') {
    return (
      <ErrorBoundary>
        <PromoManager />
      </ErrorBoundary>
    );
  }

  if (currentView === 'flipbook-catalog') {
    const catalogItems = useStore.getState().catalogItems;
    return (
      <ErrorBoundary>
        <FlipbookCatalog2
          items={catalogItems}
          onClose={() => useStore.getState().setView('kit')}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <DndProvider backend={MultiBackend} options={HTML5toTouch}>
        <div className="bg-paper font-sans text-gray-800 h-screen flex flex-col overflow-hidden">
          <Header />

          {/* Editor Modal is globally available */}
          <ProductEditor />

          {/* Custom drag preview layer */}
          <CustomDragLayer />

          {/* Mobile: Side-by-side products + kit, then total below */}
          <main className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-6 p-3 lg:p-6 overflow-auto lg:overflow-hidden">

            {/* Mobile: Top row with Products + Kit side by side */}
            <div className="flex flex-row lg:contents gap-3 h-[55vh] lg:h-auto">
              {/* Left Column (Product Catalog) */}
              <section className="flex flex-col w-1/2 lg:w-1/4 lg:min-w-[280px] h-full lg:h-full overflow-hidden">
                <Warehouse />
              </section>

              {/* Center Column (Your Catalog Builder) */}
              <section className={`flex flex-col w-1/2 lg:flex-1 h-full lg:h-full bg-white border-2 border-green-primary rounded-xl lg:rounded-3xl overflow-hidden shadow-sm relative transition-transform duration-300 ${dropAnimation ? 'scale-95' : 'scale-100'}`}>
                <CatalogBuilder dropAnimation={dropAnimation} onDrop={handleDrop} />
              </section>
            </div>

            {/* Right Column (Summary & Actions) */}
            <section className="flex flex-col w-full lg:w-1/4 lg:min-w-[280px] gap-3 lg:gap-4">
              <TotalPanel />
            </section>
          </main>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} />}
      </DndProvider>
    </ErrorBoundary>
  );
}

export default App;
