// src/components/FlipbookCatalog2.jsx
// BASED ON FlipbookCatalog — same covers, footer, texture, effects
// ONLY CHANGE: Content pages use Spread layout (MosaicPage left + DetailPage right)
import React, { useRef, useState, useEffect, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";
import jsPDF from "jspdf";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import useStore from "../lib/store";

// Helper: Convert Image URL to DataURL for PDF (supports high-res SVG)
const getDataUrl = (url, targetWidth = null, targetHeight = null) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const width = targetWidth || img.width;
            const height = targetHeight || img.height;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve({
                data: canvas.toDataURL("image/png", 1.0),
                width: width,
                height: height,
                ratio: width / height
            });
        };
        img.onerror = () => resolve(null);
    });
};

const formatPrice = (p) => (typeof p === "number" ? `€ ${p.toFixed(2)}` : p || "");

// RAINES Color Palette (IDENTICAL to FlipbookCatalog)
const COLORS = {
    primaryDeep: "#00643D",
    secondaryDeep: "#006233",
    mintAccent: "#4FAF8A",
    paperTint: "#F2F5F3",
};

// Decorative fills for mosaic rects
const DECO_FILLS = [
    "#00643D", "#4FAF8A", "#006233", "#A8D5C2", "#1B7A4E", "#D4EDE2",
];

// --- PAPER TEXTURE (IDENTICAL to FlipbookCatalog) ---
const PaperTexture = ({ opacity = 1, mixBlendMode = 'multiply' }) => (
    <div
        style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: `
                url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E"),
                repeating-linear-gradient(
                    0deg,
                    rgba(0,0,0,0.03) 0px,
                    rgba(0,0,0,0.03) 1px,
                    transparent 1px,
                    transparent 4px
                ),
                radial-gradient(circle at 10% 20%, rgba(0,0,0,0.05), transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(0,0,0,0.05), transparent 40%)
            `,
            backgroundBlendMode: 'overlay, normal, normal, normal',
            mixBlendMode: mixBlendMode,
            opacity: opacity,
            zIndex: 50
        }}
    />
);

// --- SPINE SHADOW (NEW) ---
const SpineShadow = ({ isLeft }) => (
    <div
        style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 60,
            zIndex: 60,
            pointerEvents: 'none',
            ...(isLeft
                ? { right: 0, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.04) 70%, rgba(0,0,0,0.12) 100%)' }
                : { left: 0, background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.04) 70%, rgba(0,0,0,0.12) 100%)' }
            )
        }}
    />
);

// --- PAGE EDGE HIGHLIGHT (NEW) ---
const PageEdgeHighlight = ({ isLeft }) => (
    <div
        style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 1,
            zIndex: 65,
            pointerEvents: 'none',
            backgroundColor: 'rgba(255,255,255,0.4)',
            ...(isLeft ? { left: 0 } : { right: 0 })
        }}
    />
);

// --- GEOMETRIC BACKGROUND (IDENTICAL to FlipbookCatalog) ---
const GeometricBackground = ({ seed = 1, isLeft, height = 80 }) => {
    const shapes = [];
    const count = 10 + (seed % 6);

    for (let i = 0; i < count; i++) {
        const s = (seed * (i + 7)) % 250;
        const size = 6 + (s % 40);
        const x = isLeft ? (s * 1.5) : (480 - (s * 1.5) - size);
        const y = (s * 2.5) % height;
        const rotation = (s * 13) % 45;
        const color = i % 4 === 0 ? COLORS.mintAccent :
            (i % 4 === 1 ? COLORS.primaryDeep :
                (i % 4 === 2 ? '#E2E8F0' : '#CBD5E1'));
        const outlined = (s % 2 === 0);
        shapes.push({ size, color, outlined, x, y, rotation });
    }

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
            {shapes.map((sh, idx) => (
                <div
                    key={idx}
                    className="absolute"
                    style={{
                        width: sh.size,
                        height: sh.size,
                        backgroundColor: sh.outlined ? 'transparent' : sh.color,
                        border: sh.outlined ? `1.2px solid ${sh.color}` : 'none',
                        left: sh.x,
                        top: sh.y,
                        transform: `rotate(${sh.rotation}deg)`,
                        opacity: 0.25
                    }}
                />
            ))}
        </div>
    );
};

// --- PAGE FOOTER (IDENTICAL to FlipbookCatalog) ---
const PageFooter = ({ pageNum, isLeft, showNumber = true }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-20 z-20 overflow-hidden pointer-events-none">
            <GeometricBackground seed={pageNum || 1} isLeft={isLeft} height={80} />

            <div className="absolute inset-0 flex items-center px-10">
                {isLeft ? (
                    <img
                        src="/RainesNero.svg"
                        className="h-8 relative"
                        style={{ zIndex: 100, opacity: 0.9, objectFit: 'contain' }}
                        alt="Raines"
                    />
                ) : null}

                <div className="flex-1 text-center relative z-30">
                    {showNumber && pageNum && (
                        <span className="text-slate-800 text-[10px] font-black tracking-[0.2em] block transform translate-y-4 opacity-70">
                            PAGE {pageNum}
                        </span>
                    )}
                </div>

                {!isLeft ? (
                    <img
                        src="/RainesNero.svg"
                        className="h-8 relative"
                        style={{ zIndex: 100, opacity: 0.9, objectFit: 'contain' }}
                        alt="Raines"
                    />
                ) : null}
            </div>
        </div>
    );
};

// --- INDEX PAGE (IDENTICAL to FlipbookCatalog) ---
const IndexPage = forwardRef(({ categories, startPage, isLeft }, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative overflow-hidden flex flex-col"
        data-density="soft"
    >
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture />
        <SpineShadow isLeft={isLeft} />
        <PageEdgeHighlight isLeft={isLeft} />
        <div className="relative z-10 flex flex-col h-full" style={{ isolation: 'isolate' }}>
            <div className="pt-10 px-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-12" style={{ backgroundColor: COLORS.primaryDeep }} />
                    <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', color: COLORS.primaryDeep }}>
                        Indice
                    </h1>
                </div>

                <div className="space-y-4">
                    {categories.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-200 pb-2 group">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-sm bg-slate-300 group-hover:bg-emerald-500 transition-colors" />
                                <span className="text-slate-700 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {cat.name}
                                </span>
                            </div>
                            <span className="font-bold text-lg" style={{ fontFamily: 'Inter, sans-serif', color: COLORS.primaryDeep }}>
                                {String(cat.page).padStart(2, '0')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <PageFooter pageNum={startPage} isLeft={isLeft} />
    </div>
));

// --- COVER PAGE (IDENTICAL to FlipbookCatalog) ---
const CoverPage = forwardRef((props, ref) => {
    return (
        <div
            ref={ref}
            className="bg-white w-full h-full relative overflow-hidden"
            data-density="hard"
        >
            <img
                src="/RainesApp.svg"
                className="absolute inset-0 w-full h-full"
                alt="Catalog Cover"
            />
        </div>
    );
});

// --- BLANK PAGE (IDENTICAL to FlipbookCatalog) ---
const BlankPage = forwardRef(({ isLeft = true }, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative"
        data-density="soft"
    >
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture opacity={0.3} />
        <SpineShadow isLeft={isLeft} />
        <PageEdgeHighlight isLeft={isLeft} />
        <div className="relative z-10 h-full">
        </div>
        <PageFooter isLeft={isLeft} showNumber={false} />
    </div>
));

// --- BACK COVER (IDENTICAL to FlipbookCatalog) ---
const BackCover = forwardRef((props, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative overflow-hidden"
        data-density="hard"
    >
        <img
            src="/copertinapost.svg"
            className="absolute inset-0 w-full h-full"
            alt="Back Cover"
        />
    </div>
));

// ============================================================================
// NEW: PRODUCT LIST PAGE (Entrambe le pagine) — Righe Prodotto (Img + Testo)
// ============================================================================

const ProductListPage = forwardRef(({ category, products, pageNum, isLeft, promoMap = {} }, ref) => (
    <div ref={ref} className="w-full h-full relative overflow-hidden flex flex-col" data-density="soft">
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture opacity={0.3} />
        <SpineShadow isLeft={isLeft} />
        <PageEdgeHighlight isLeft={isLeft} />

        <div className="relative z-10 flex flex-col flex-1" style={{ isolation: 'isolate' }}>
            {/* Green Header Band (Uniformato su entrambe le pagine) */}
            <div className="relative overflow-hidden" style={{ backgroundColor: COLORS.primaryDeep, height: 44 }}>
                <div className="absolute right-0 top-0 h-full w-28" style={{
                    background: `linear-gradient(135deg, transparent 35%, ${COLORS.mintAccent}30 35%, ${COLORS.mintAccent}30 55%, transparent 55%)`,
                }} />
                <div className="absolute inset-0 flex items-center justify-between px-8">
                    <h2 className="font-extrabold text-white text-xs tracking-wider uppercase" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em' }}>
                        {category}
                    </h2>
                    <span className="text-white/50 text-[9px] font-bold uppercase tracking-[0.3em]">
                        CATALOGO
                    </span>
                </div>
            </div>

            {/* Product details list — strict 5 slots */}
            <div className="flex flex-col px-5 pt-3 pb-24 h-full" style={{ height: '100%' }}>
                {Array.from({ length: 5 }).map((_, i) => {
                    const p = products[i];
                    if (!p) return <div key={i} className="flex-1" />; // Spacer for empty slots

                    const promo = promoMap[p.id];
                    return (
                        <div key={i} className="flex flex-row items-center gap-3 relative shrink-0 grow-0" style={{
                            height: '20%', // Exactly 20% of the available vertical space
                            borderBottom: i < 4 ? '1px solid #E2E8E4' : 'none',
                            paddingTop: 8,
                            paddingBottom: 8,
                            overflow: 'hidden' // Prevent overflow
                        }}>
                            {/* Image Container (Left) */}
                            <div className="shrink-0 w-16 h-16 aspect-square bg-transparent rounded border flex items-center justify-center p-1 relative" style={{ borderColor: COLORS.primaryDeep }}>
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-[10px] text-slate-300 font-mono">No Img</span>
                                )}
                            </div>

                            {/* Details Container (Right) */}
                            <div className="flex-1 flex flex-col h-full min-w-0 justify-center">
                                <div className="flex items-start gap-2 justify-between">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-extrabold text-gray-900 text-[11px] leading-tight uppercase tracking-tight line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                                            {p.name}
                                        </h3>
                                        <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 inline-block" style={{ color: COLORS.primaryDeep }}>
                                            COD. {p.id || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Offer badge */}
                                    {promo && (
                                        <div className="shrink-0 flex flex-col items-center px-1.5 py-0.5 rounded" style={{ backgroundColor: `${promo.color || COLORS.primaryDeep}20`, border: `1px solid ${promo.color || COLORS.primaryDeep}` }}>
                                            <span className="text-[8px] font-black uppercase" style={{ color: promo.color || COLORS.primaryDeep }}>
                                                {promo.discountType === 'percentage' ? `-${promo.discountValue}%` : `-€${Number(promo.discountValue).toFixed(0)}`}
                                            </span>
                                            {promo.validTo && (
                                                <span className="text-[6px] font-bold" style={{ color: promo.color || COLORS.primaryDeep, opacity: 0.9 }}>
                                                    fino al {new Date(promo.validTo).toLocaleDateString('it-IT')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-slate-500 text-[8px] leading-snug line-clamp-2 mt-1 pr-2">
                                    {p.description || "Scheda tecnica disponibile su richiesta."}
                                </p>

                                {/* Format Row (only carton) */}
                                {p.formato_cartone && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-[7px] font-bold text-slate-400 uppercase">Cartone:</span>
                                        <span className="text-[7px] text-slate-600 font-semibold">{p.formato_cartone}</span>
                                    </div>
                                )}

                                {/* Price row */}
                                <div className="flex items-center justify-between mt-auto pr-1 pt-1">
                                    <span className="text-slate-300 text-[8px] font-medium uppercase tracking-wide">
                                        Cad.{p.unita_vendita ? ` (${p.unita_vendita})` : ''}
                                    </span>
                                    <span className="font-black text-[13px] tracking-tight" style={{ color: COLORS.primaryDeep, fontFamily: 'Inter, sans-serif' }}>
                                        {formatPrice(p.price)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <PageFooter pageNum={pageNum} isLeft={isLeft} />
    </div>
));

// --- DECORATIVE PAGE (IDENTICAL to FlipbookCatalog) ---
const DecorativePage = forwardRef(({ pageNum, isLeft }, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative overflow-hidden"
        data-density="soft"
    >
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture opacity={0.6} />
        <SpineShadow isLeft={isLeft} />
        <PageEdgeHighlight isLeft={isLeft} />
        <div className="relative z-10 w-full h-full" style={{ isolation: 'isolate' }}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-10 border-[20px] border-slate-300" />
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-slate-200 opacity-20" />
                    <div className="absolute top-1/3 right-1/4 w-40 h-40 opacity-10" style={{ backgroundColor: COLORS.primaryDeep }} />
                </div>
            </div>
        </div>
        <PageFooter pageNum={pageNum} isLeft={isLeft} />
    </div>
));

// ============================================================================
// PROMO PAGE — Offerte attive (colori catalogo)
// ============================================================================
const PROMO_TYPE_LABELS = {
    product: 'Sconto Prodotto',
    threshold: 'Sconto Soglia',
    bundle: 'Bundle / Kit',
};

// Default description generator when user doesn't provide one
const getPromoDefaultDesc = (promo) => {
    if (promo.description) return promo.description;
    const discLabel = promo.discountType === 'percentage'
        ? `${promo.discountValue}%` : `€${Number(promo.discountValue).toFixed(2)}`;
    switch (promo.type) {
        case 'product':
            return `Sconto del ${discLabel} su prodotti selezionati. Approfittane subito.`;
        case 'threshold':
            return `Raggiungendo una spesa minima, ottieni uno sconto del ${discLabel} sull'intero ordine.`;
        case 'bundle':
            return `Acquistando più articoli della stessa categoria, risparmi il ${discLabel}. Ideale per kit completi.`;
        default:
            return `Promozione attiva con sconto del ${discLabel}. Condizioni in vigore fino ad esaurimento.`;
    }
};

// Build a map: productId -> promo info (for banner rendering)
const buildPromoMap = (activePromotions) => {
    const map = {};
    for (const promo of activePromotions) {
        if (promo.type === 'product' && promo.condition?.productIds) {
            for (const pid of promo.condition.productIds) {
                if (!map[pid]) {
                    map[pid] = promo;
                }
            }
        }
    }
    return map;
};

const PromoPage = forwardRef(({ promotions = [], pageNum, isLeft }, ref) => (
    <div ref={ref} className="w-full h-full relative overflow-hidden flex flex-col" data-density="soft">
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture opacity={0.3} />
        <SpineShadow isLeft={isLeft} />
        <PageEdgeHighlight isLeft={isLeft} />

        <div className="relative z-10 flex flex-col flex-1" style={{ isolation: 'isolate' }}>
            {/* Green Header Band — same style as catalog pages */}
            <div className="relative overflow-hidden" style={{ backgroundColor: COLORS.primaryDeep, height: 44 }}>
                <div className="absolute right-0 top-0 h-full w-28" style={{
                    background: `linear-gradient(135deg, transparent 35%, ${COLORS.mintAccent}30 35%, ${COLORS.mintAccent}30 55%, transparent 55%)`,
                }} />
                <div className="absolute inset-0 flex items-center justify-between px-8">
                    <h2 className="font-extrabold text-white text-xs tracking-wider uppercase" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em' }}>
                        Offerte in Corso
                    </h2>
                    <span className="text-white/50 text-[9px] font-bold uppercase tracking-[0.3em]">
                        CATALOGO
                    </span>
                </div>
            </div>

            {/* Promo list */}
            <div className="flex flex-col px-5 pt-4 pb-24 flex-1 gap-4">
                {promotions.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
                        Nessuna offerta attiva al momento.
                    </div>
                )}
                {promotions.map((promo, i) => (
                    <div key={promo.id || i} className="flex items-start gap-4 border-b border-slate-100 pb-4">
                        {/* Discount Badge — green */}
                        <div className="shrink-0 flex items-center justify-center rounded-sm mt-0.5 shadow-sm"
                            style={{
                                backgroundColor: promo.color || COLORS.primaryDeep,
                                width: 50,
                                height: 28,
                            }}>
                            <span className="text-white text-[10px] font-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {promo.discountType === 'percentage'
                                    ? `-${promo.discountValue}%`
                                    : `-€${Number(promo.discountValue).toFixed(0)}`
                                }
                            </span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-gray-900 text-[13px] leading-tight uppercase tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {promo.name}
                            </h3>
                            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 inline-block" style={{ color: promo.color || COLORS.primaryDeep }}>
                                {PROMO_TYPE_LABELS[promo.type] || promo.type}
                            </span>
                            <p className="text-slate-500 text-[10px] leading-snug line-clamp-2 mt-1 italic">
                                {getPromoDefaultDesc(promo)}
                            </p>
                            {promo.validTo && (
                                <span className="text-[10px] font-bold mt-1 block uppercase tracking-wide" style={{ color: promo.color || COLORS.primaryDeep, fontFamily: 'Inter, sans-serif' }}>
                                    Scadenza: {new Date(promo.validTo).toLocaleDateString('it-IT')}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <PageFooter pageNum={pageNum} isLeft={isLeft} />
    </div>
));

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function FlipbookCatalog2({ items = [], catalogTitle = "Catalogo", onClose }) {
    const flipBookRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const setView = useStore((state) => state.setView);

    // Load promotions from localStorage on mount (critical: without this, promotions are always [])
    const loadPromotions = useStore((state) => state.loadPromotions);
    useEffect(() => {
        loadPromotions();
    }, [loadPromotions]);

    // Load active promotions from store
    const allPromotions = useStore((state) => state.promotions);
    const now = new Date().toISOString().slice(0, 10);
    const activePromotions = (allPromotions || []).filter(p => {
        if (!p.active) return false;
        if (p.validFrom && now < p.validFrom) return false;
        if (p.validTo && now > p.validTo) return false;
        return true;
    });
    const hasPromos = activePromotions.length > 0;
    const promoMap = buildPromoMap(activePromotions);
    console.log('[Catalog] promoMap:', promoMap, 'activePromotions:', activePromotions.length);

    // Build PAGES: products per page (ProductListPage)
    const categoryMap = {};
    items.forEach(item => {
        const cat = item.category || "Prodotti";
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(item);
    });

    // ========================================================================
    // PAGE STRUCTURE (fixed):
    //   Page 1: Cover (right, alone)
    //   WITH promos:  Page 2 (left): PromoPage  |  Page 3 (right): IndexPage  ← one spread
    //   WITHOUT promos: Page 2 (left): IndexPage | Page 3 (right): BlankPage  ← one spread
    //   Page 4+ : ProductListPage (6 products per page, sequential)
    //   Last page: BackCover (left, alone — handled by showCover)
    // ========================================================================
    const needsBlank = !hasPromos; // blank only when no promo page (to keep MosaicPage on left)
    const promoPageNum = hasPromos ? 2 : null;
    const indexPageNum = hasPromos ? 3 : 2;
    const blankPageNum = needsBlank ? 3 : null;

    // Content always starts on page 4
    let pageCounter = 4;
    const categoryIndex = [];
    const internalPages = [];

    Object.entries(categoryMap).forEach(([cat, list]) => {
        categoryIndex.push({ name: cat, page: pageCounter });
        for (let i = 0; i < list.length; i += 5) {
            const chunk = list.slice(i, i + 5);
            internalPages.push({
                category: cat,
                products: chunk,
                pageNum: pageCounter,
            });
            pageCounter += 1;
        }
    });

    const needsFillerBlank = internalPages.length % 2 !== 0;
    const totalPages = pageCounter + (needsFillerBlank ? 1 : 0);

    const onFlip = (e) => {
        setCurrentPage(e.data);
    };

    // --- PDF GENERATION (SAME STRUCTURE as FlipbookCatalog, adapted for spreads) ---
    const downloadPDF = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF({ unit: "mm", format: "a4" });
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            const FOOTER_HEIGHT = 32;

            const PDF_COLORS = {
                primaryDeep: { r: 0, g: 100, b: 61 },
                secondaryDeep: { r: 0, g: 98, b: 51 },
                mintAccent: { r: 79, g: 175, b: 138 },
                paperTint: { r: 242, g: 245, b: 243 },
            };

            const logoFooterRes = await getDataUrl("/RainesNero.svg", 200, 200);

            const drawGeometricBackground = (pageNum, isLeft) => {
                const seed = pageNum || 1;
                const count = 15 + (seed % 10);
                for (let i = 0; i < count; i++) {
                    const s = (seed * (i + 13)) % 250;
                    const size = 5 + (s % 15);
                    const x = isLeft ? (s * 0.7) : (W - (s * 0.7) - size);
                    const y = (H - 26) + ((s * 0.9) % 26);
                    const colorIndex = i % 4;
                    const color = colorIndex === 0 ? PDF_COLORS.mintAccent :
                        (colorIndex === 1 ? PDF_COLORS.primaryDeep :
                            (colorIndex === 2 ? { r: 230, g: 235, b: 230 } : { r: 200, g: 205, b: 200 }));
                    const outlined = (s % 3 === 0);
                    doc.setDrawColor(color.r, color.g, color.b);
                    doc.setFillColor(color.r, color.g, color.b);
                    doc.setLineWidth(0.1);
                    if (outlined) {
                        doc.rect(x, y, size, size, 'D');
                    } else {
                        doc.setGState(new doc.GState({ opacity: 0.35 }));
                        doc.rect(x, y, size, size, 'F');
                        doc.setGState(new doc.GState({ opacity: 1.0 }));
                    }
                }
            };

            const drawFooter = (pageNum, isLeft, showNumber = true) => {
                if (showNumber && pageNum) {
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.setFont("helvetica", "bold");
                    doc.text(`PAGE ${pageNum}`, W / 2, H - 14, { align: 'center' });
                }
                if (logoFooterRes?.data) {
                    const lW = 20;
                    const lRatio = logoFooterRes.ratio || 5;
                    const lH = lW / lRatio;
                    const lY = H - 22;
                    if (isLeft) {
                        doc.addImage(logoFooterRes.data, 'PNG', 15, lY, lW, lH, undefined, 'FAST');
                    } else {
                        doc.addImage(logoFooterRes.data, 'PNG', W - 15 - lW, lY, lW, lH, undefined, 'FAST');
                    }
                }
            };

            const drawBackground = () => {
                const c = PDF_COLORS.paperTint;
                doc.setFillColor(c.r, c.g, c.b);
                doc.rect(0, 0, W, H, 'F');
            };

            // COVER PAGE
            const coverRes = await getDataUrl("/RainesApp.svg", 2480, 3508);
            if (coverRes?.data) {
                doc.addImage(coverRes.data, 'PNG', 0, 0, W, H);
            } else {
                const c = PDF_COLORS.primaryDeep;
                doc.setFillColor(c.r, c.g, c.b);
                doc.rect(0, 0, W, H, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(36);
                doc.text("CATALOGO", W / 2, H / 2, { align: 'center' });
            }

            // PROMO PAGE (page 2, right after cover — conditional)
            if (hasPromos) {
                doc.addPage();
                drawBackground();
                const promoIsLeft = true; // page 2 is always left
                drawGeometricBackground(promoPageNum, promoIsLeft);

                // Green header band (catalog style)
                const cPri = PDF_COLORS.primaryDeep;
                doc.setFillColor(cPri.r, cPri.g, cPri.b);
                doc.rect(0, 0, W, 18, 'F');
                const cMint = PDF_COLORS.mintAccent;
                doc.setGState(new doc.GState({ opacity: 0.3 }));
                doc.setFillColor(cMint.r, cMint.g, cMint.b);
                doc.triangle(W - 35, 0, W - 15, 0, W - 25, 18, 'F');
                doc.triangle(W - 20, 0, W, 0, W - 10, 18, 'F');
                doc.setGState(new doc.GState({ opacity: 1 }));

                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.text("OFFERTE IN CORSO", 15, 12);
                doc.setFontSize(7);
                doc.text("CATALOGO", W - 15, 12, { align: 'right' });

                // Promo list
                let promoY = 28;
                const promoMaxY = H - FOOTER_HEIGHT - 8;
                for (const promo of activePromotions) {
                    if (promoY + 20 > promoMaxY) break;

                    // Green discount badge
                    doc.setFillColor(cPri.r, cPri.g, cPri.b);
                    doc.roundedRect(12, promoY, 16, 8, 1, 1, 'F');
                    doc.setFontSize(7);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont("helvetica", "bold");
                    const discText = promo.discountType === 'percentage'
                        ? `-${promo.discountValue}%`
                        : `-€${Number(promo.discountValue).toFixed(0)}`;
                    doc.text(discText, 20, promoY + 5.5, { align: 'center' });

                    // Promo name
                    doc.setFontSize(9);
                    doc.setTextColor(25, 25, 25);
                    doc.setFont("helvetica", "bold");
                    doc.text(promo.name.toUpperCase(), 32, promoY + 4.5);

                    // Type label (green)
                    doc.setFontSize(6.5);
                    doc.setTextColor(cMint.r, cMint.g, cMint.b);
                    doc.setFont("helvetica", "bold");
                    const typeLabel = promo.type === 'product' ? 'SCONTO PRODOTTO' : (promo.type === 'threshold' ? 'SCONTO SOGLIA' : 'BUNDLE / KIT');
                    doc.text(typeLabel, 32, promoY + 8);

                    // Description (always show, use default if empty)
                    const descText = getPromoDefaultDesc(promo);
                    doc.setFontSize(7);
                    doc.setTextColor(140, 140, 140);
                    doc.setFont("helvetica", "italic");
                    const descLines = doc.splitTextToSize(descText, 130);
                    doc.text(descLines.slice(0, 2), 32, promoY + 12);

                    // Validity
                    if (promo.validTo) {
                        doc.setFontSize(8); // Increased from 6
                        const c = PDF_COLORS.primaryDeep;
                        doc.setTextColor(c.r, c.g, c.b); // Uses PDF_COLORS (object) instead of COLORS (hex string)
                        doc.setFont("helvetica", "bold"); // Changed to bold
                        doc.text(`Scadenza: ${new Date(promo.validTo).toLocaleDateString('it-IT')}`, 32, promoY + 16);
                    }

                    // Separator
                    doc.setDrawColor(225, 230, 227);
                    doc.setLineWidth(0.2);
                    const sepY = promoY + 20;
                    doc.line(15, sepY, W - 15, sepY);
                    promoY = sepY + 4;
                }

                drawFooter(promoPageNum, promoIsLeft);
            }

            // INDEX PAGE (page 3 if promos, page 2 if no promos)
            doc.addPage();
            drawBackground();
            const indexIsLeft = !hasPromos; // with promos: right (p3); without: left (p2)
            drawGeometricBackground(indexPageNum, indexIsLeft);

            const cPrimary = PDF_COLORS.primaryDeep;
            doc.setFillColor(cPrimary.r, cPrimary.g, cPrimary.b);
            doc.rect(15, 25, 3, 20, 'F');
            doc.setFontSize(26);
            doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
            doc.setFont("helvetica", "bold");
            doc.text("INDICE", 22, 40);

            let indexY = 60;
            categoryIndex.forEach(cat => {
                doc.setFillColor(200, 200, 200);
                doc.rect(18, indexY - 2, 2.5, 2.5, 'F');
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                doc.setFont("helvetica", "normal");
                doc.text(cat.name, 25, indexY + 1);
                doc.setFontSize(12);
                doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
                doc.setFont("helvetica", "bold");
                doc.text(String(cat.page).padStart(2, '0'), 190, indexY + 1, { align: 'right' });
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.2);
                doc.line(25, indexY + 5, 190, indexY + 5);
                indexY += 12;
            });
            drawFooter(indexPageNum, indexIsLeft);

            // BLANK page (only when no promos — page 3, right side)
            if (needsBlank) {
                doc.addPage();
                drawBackground();
                drawGeometricBackground(blankPageNum, false);
                drawFooter(null, false, false);
            }

            // CONTENT PAGES (Sequential, replacing Left Mosaic & Right Detail)
            for (const page of internalPages) {
                const isLeft = page.pageNum % 2 === 0;

                doc.addPage();
                drawBackground();
                drawGeometricBackground(page.pageNum, isLeft);

                // Green header band
                const cPrimary = PDF_COLORS.primaryDeep;
                const cMint = PDF_COLORS.mintAccent;
                doc.setFillColor(cPrimary.r, cPrimary.g, cPrimary.b);
                doc.rect(0, 0, W, 18, 'F');
                doc.setFillColor(cMint.r, cMint.g, cMint.b);
                doc.setGState(new doc.GState({ opacity: 0.15 }));
                doc.triangle(W - 35, 0, W - 15, 0, W - 25, 18, 'F');
                doc.triangle(W - 20, 0, W, 0, W - 10, 18, 'F');
                doc.setGState(new doc.GState({ opacity: 1 }));

                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.text(page.category.toUpperCase(), 15, 12);
                doc.setFontSize(7);
                doc.text("CATALOGO", W - 15, 12, { align: 'right' });

                // Product rows (up to 5 slots)
                const startY = 24;
                const maxY = H - FOOTER_HEIGHT - 6;
                const availableHeight = maxY - startY;
                const rowHeight = availableHeight / 5; // Space for 5 items

                for (let j = 0; j < page.products.length; j++) {
                    const p = page.products[j];
                    const y = startY + (j * rowHeight);

                    // Row background/border
                    if (j < 4) { // Add separator line for all but the last item
                        doc.setDrawColor(226, 232, 228); // #E2E8E4
                        doc.setLineWidth(0.2);
                        doc.line(12, y + rowHeight - 1, W - 12, y + rowHeight - 1);
                    }

                    // 1) Image box (left side of the row)
                    const imgBoxSize = 25;
                    const imgBoxX = 12;
                    const imgBoxY = y + 2;

                    doc.setDrawColor(PDF_COLORS.primaryDeep.r, PDF_COLORS.primaryDeep.g, PDF_COLORS.primaryDeep.b);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 1, 1, 'S');

                    if (p.image_url) {
                        try {
                            const imgData = await getDataUrl(p.image_url);
                            if (imgData?.data) {
                                // Add image centered inside the box (approx 2mm padding)
                                doc.addImage(imgData.data, 'PNG', imgBoxX + 2, imgBoxY + 2, imgBoxSize - 4, imgBoxSize - 4, undefined, 'FAST');
                            }
                        } catch (err) {
                            console.error("PDF image load error:", err);
                        }
                    }

                    // 2) Content bounds
                    const textStartX = imgBoxX + imgBoxSize + 4; // Right of the image box
                    let currentY = imgBoxY + 3;

                    // Product Name
                    doc.setFontSize(10);
                    doc.setTextColor(25, 25, 25);
                    doc.setFont("helvetica", "bold");
                    const nameLines = doc.splitTextToSize(p.name.toUpperCase(), W - textStartX - 40); // Leave space for promo
                    doc.text(nameLines.slice(0, 2), textStartX, currentY);

                    // Promo Badge
                    const productPromo = promoMap[p.id];
                    if (productPromo) {
                        const badgeText = productPromo.discountType === 'percentage'
                            ? `-${productPromo.discountValue}%`
                            : `-€${Number(productPromo.discountValue).toFixed(0)}`;

                        const pc = productPromo.color || null;
                        if (pc) {
                            const r = parseInt(pc.slice(1, 3), 16), g = parseInt(pc.slice(3, 5), 16), b = parseInt(pc.slice(5, 7), 16);
                            doc.setFillColor(r, g, b);
                        } else {
                            doc.setFillColor(cPrimary.r, cPrimary.g, cPrimary.b);
                        }

                        doc.roundedRect(W - 32, imgBoxY, 20, 6, 1, 1, 'F');
                        doc.setFontSize(7);
                        doc.setTextColor(255, 255, 255);
                        doc.setFont("helvetica", "bold");
                        doc.text(badgeText, W - 22, imgBoxY + 4.5, { align: 'center' });
                    }

                    currentY += (nameLines.length > 1 ? 7.5 : 4);

                    // Code
                    doc.setFontSize(7.5);
                    doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
                    doc.setFont("helvetica", "bold");
                    doc.text(`COD. ${p.id || 'N/A'}`, textStartX, currentY);

                    currentY += 4;

                    // Description
                    if (p.description) {
                        doc.setFontSize(7.5);
                        doc.setTextColor(110, 110, 110);
                        doc.setFont("helvetica", "normal");
                        const descLines = doc.splitTextToSize(p.description, W - textStartX - 15);
                        doc.text(descLines.slice(0, 2), textStartX, currentY);
                        currentY += descLines.slice(0, 2).length * 3.5;
                    }

                    currentY += 1.5;

                    // Carton format
                    if (p.formato_cartone) {
                        doc.setFontSize(6.5);
                        doc.setTextColor(150, 150, 150);
                        doc.setFont("helvetica", "bold");
                        doc.text("Cartone: ", textStartX, currentY);
                        doc.setFont("helvetica", "normal");
                        doc.text(p.formato_cartone, textStartX + 14, currentY);
                        currentY += 3.5;
                    }

                    // Price & Unit (Bottom aligned within the row bounds)
                    const priceY = imgBoxY + imgBoxSize - 1;

                    doc.setFontSize(7.5);
                    doc.setTextColor(160, 160, 160);
                    doc.setFont("helvetica", "bold");
                    doc.text(`Cad.${p.unita_vendita ? ` (${p.unita_vendita})` : ''}`, textStartX, priceY);

                    // Price (Right aligned)
                    doc.setFontSize(12);
                    doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
                    doc.setFont("helvetica", "bold");
                    const pText = formatPrice(p.price);
                    doc.text(pText, W - 12, priceY, { align: 'right' });
                }

                drawFooter(page.pageNum, isLeft);
            }

            // Filler blank page to keep back cover on the left side (even page count)
            if (needsFillerBlank) {
                doc.addPage();
                drawBackground();
            }

            // BACK COVER
            doc.addPage();
            const backCoverRes = await getDataUrl("/copertinapost.svg", 2480, 3508);
            if (backCoverRes?.data) {
                doc.addImage(backCoverRes.data, 'PNG', 0, 0, W, H);
            } else {
                doc.setFillColor(41, 84, 61);
                doc.rect(0, 0, W, H, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(28);
                doc.setFont("helvetica", "bold");
                doc.text("RAINES", W / 2, H / 2, { align: 'center' });
            }

            doc.save("Catalogo_Raines_2026.pdf");
        } catch (e) {
            console.error(e);
            alert("Errore PDF: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden">
            {/* Subtle texture (IDENTICAL to FlipbookCatalog) */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cGF0aCBkPSJNMzAgMGwzMCA1Mi0zMC01MnoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcGF0aD4KPC9zdmc+')] pointer-events-none" />

            {/* Top Controls (IDENTICAL to FlipbookCatalog) */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
                <button
                    onClick={onClose}
                    className="pointer-events-auto bg-black/30 hover:bg-black/50 p-3 rounded-full text-white backdrop-blur-md transition-all border border-white/10"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4">
                    <span className="text-white/50 text-sm font-medium">
                        {currentPage + 1} / {totalPages}
                    </span>
                    <button
                        onClick={downloadPDF}
                        disabled={isGenerating}
                        className="pointer-events-auto bg-[#097B35] hover:bg-[#07602a] text-white px-6 py-3 rounded-full font-bold shadow-xl flex gap-2 transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse">Generazione...</span>
                        ) : (
                            <>
                                <Download size={20} />
                                <span className="hidden sm:inline">SCARICA PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* FLIPBOOK (IDENTICAL settings to FlipbookCatalog) */}
            <div className="flex-1 flex items-center justify-center relative py-20">
                <HTMLFlipBook
                    ref={flipBookRef}
                    width={480}
                    height={680}
                    size="fixed"
                    minWidth={280}
                    maxWidth={600}
                    minHeight={400}
                    maxHeight={850}

                    drawShadow={true}
                    maxShadowOpacity={0.8}
                    flippingTime={900}
                    showCover={true}
                    useMouseEvents={true}
                    swipeDistance={30}
                    clickEventForward={true}
                    mobileScrollSupport={true}
                    usePortrait={false}
                    autoSize={false}
                    startPage={0}
                    startZIndex={0}
                    onFlip={onFlip}

                    className="shadow-2xl"
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {[
                        // 1. Cover Page (page 1, right — alone)
                        <CoverPage key="cover" />,

                        // 2-3. WITH promos: Promo(left) + Index(right) spread
                        //       WITHOUT promos: Index(left) + Blank(right) spread
                        ...(hasPromos ? [
                            <PromoPage
                                key="promo-page"
                                promotions={activePromotions}
                                pageNum={promoPageNum}
                                isLeft={true}
                            />,
                            <IndexPage
                                key="index"
                                categories={categoryIndex}
                                startPage={indexPageNum}
                                isLeft={false}
                            />,
                        ] : [
                            <IndexPage
                                key="index"
                                categories={categoryIndex}
                                startPage={indexPageNum}
                                isLeft={true}
                            />,
                            <BlankPage key="blank" isLeft={false} />,
                        ]),

                        // 4+. Content Pages: ProductListPage (left and right alternating)
                        ...internalPages.map((page, i) => (
                            <ProductListPage
                                key={`page-${i}`}
                                category={page.category}
                                products={page.products}
                                pageNum={page.pageNum}
                                isLeft={page.pageNum % 2 === 0} // Even pages are left, odd are right
                                promoMap={promoMap}
                            />
                        )),

                        // Optional Filler Blank to keep Back Cover on the Left
                        ...(needsFillerBlank ? [
                            <BlankPage key="filler-blank" isLeft={false} />
                        ] : []),

                        // Last. Back Cover (left — showCover renders it alone)
                        <BackCover key="back-cover" />,
                    ]}
                </HTMLFlipBook>
            </div>

            {/* Navigation Controls (IDENTICAL to FlipbookCatalog) */}
            <div className="absolute bottom-8 w-full flex justify-center gap-16 pointer-events-none">
                <button
                    onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
                    className="pointer-events-auto bg-white/5 hover:bg-white/15 backdrop-blur-sm text-white/60 hover:text-white p-4 rounded-full transition-all border border-white/10"
                >
                    <ChevronLeft size={28} />
                </button>
                <button
                    onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
                    className="pointer-events-auto bg-white/5 hover:bg-white/15 backdrop-blur-sm text-white/60 hover:text-white p-4 rounded-full transition-all border border-white/10"
                >
                    <ChevronRight size={28} />
                </button>
            </div>
        </div>
    );
}

export default FlipbookCatalog2;
