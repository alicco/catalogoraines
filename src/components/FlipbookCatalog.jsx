// src/components/FlipbookCatalog.jsx
import React, { useRef, useState, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";
import jsPDF from "jspdf";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import useStore from "../lib/store";

/**
 * FlipbookCatalog - OPTIMIZED with all react-pageflip settings for maximum realism
 * 
 * Key optimizations:
 * - drawShadow: true (enables realistic shadows)
 * - maxShadowOpacity: 1 (full shadow intensity)
 * - flippingTime: 1000ms (smooth page turn)
 * - showCover: true (hard cover behavior)
 * - data-density: "hard" for covers, "soft" for inner pages
 * - useMouseEvents: true
 * - autoSize: false for consistent rendering
 */

// Helper: Convert Image URL to DataURL for PDF (supports high-res SVG)
const getDataUrl = (url, targetWidth = null, targetHeight = null) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            // Use target dimensions for high-res output, or native dimensions
            const width = targetWidth || img.width;
            const height = targetHeight || img.height;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            // REMOVED white background fill to preserve transparency
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

// RAINES Color Palette
const COLORS = {
    primaryDeep: "#00643D",    // Footer, headers, main accents
    secondaryDeep: "#006233",  // Shadows, alt accents
    mintAccent: "#4FAF8A",     // Decorations, highlights
    paperTint: "#F2F5F3",      // Paper base (User Corrected: #F2F5F3)
};

// --- PAPER TEXTURE COMPONENT (Overlay) ---
// Implements the User's CSS for texture without affecting content opacity
// --- PAPER TEXTURE COMPONENT (Overlay) ---
// Enhanced with SVG Noise for realism + Lines + Vignette. GLOBAL OVERLAY (High Z-Index).
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
            zIndex: 50 // ON TOP OF EVERYTHING
        }}
    />
);



// --- GEOMETRIC BACKGROUND (Confined to Footer) ---
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

// --- PAGE FOOTER (Functional) ---
const PageFooter = ({ pageNum, isLeft, showNumber = true }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-20 z-20 overflow-hidden pointer-events-none">
            {/* Confined geometric pattern */}
            <GeometricBackground seed={pageNum || 1} isLeft={isLeft} height={80} />

            <div className="absolute inset-0 flex items-center px-10">
                {/* Logo - FIXED VISIBILITY (Removed brightness-0) */}
                {isLeft ? (
                    <img
                        src="/RainesNero.svg"
                        className="h-8 relative"
                        style={{ zIndex: 100, opacity: 0.9, objectFit: 'contain' }}
                        alt="Raines"
                    />
                ) : null}

                {/* Page number */}
                <div className="flex-1 text-center relative z-30">
                    {showNumber && pageNum && (
                        <span className="text-slate-800 text-[10px] font-black tracking-[0.2em] block transform translate-y-4 opacity-70">
                            PAGE {pageNum}
                        </span>
                    )}
                </div>

                {/* Logo - right for odd pages */}
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

// --- INDEX PAGE ---
const IndexPage = forwardRef(({ categories, startPage, isLeft }, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative overflow-hidden flex flex-col"
        data-density="soft"
    >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture />
        <div className="relative z-10 flex flex-col h-full" style={{ isolation: 'isolate' }}>
            {/* Header with green accent */}
            <div className="pt-10 px-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-12" style={{ backgroundColor: COLORS.primaryDeep }} />
                    <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', color: COLORS.primaryDeep }}>
                        Indice
                    </h1>
                </div>

                {/* Index entries */}
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

        {/* Footer (Outside wrapper to stick to bottom) */}
        <PageFooter pageNum={startPage} isLeft={isLeft} />
    </div>
));

// --- COVER PAGE (HARD) ---
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

// --- BLANK PAGE (Inside Front Cover - SOFT) ---
const BlankPage = forwardRef(({ isLeft = true }, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative"
        data-density="soft"
    >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture opacity={0.3} />
        <div className="relative z-10 h-full">
            {/* Content here if needed */}
        </div>
        <PageFooter isLeft={isLeft} showNumber={false} />
    </div>
));

// --- BACK COVER (HARD) ---
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

// --- CONTENT PAGE (SOFT - STRUCTURED CATALOG LAYOUT) ---
// Inspired by professional catalog reference with structured rows
const ContentPage = forwardRef(({ category, products, pageNum, isLeft }, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative overflow-hidden flex flex-col"
        data-density="soft"
    >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture opacity={0.3} />

        <div className="relative z-10 flex flex-col flex-1" style={{ isolation: 'isolate' }}>
            {/* Green Header Band */}
            <div className="relative overflow-hidden" style={{ backgroundColor: COLORS.primaryDeep, height: 44 }}>
                {/* Diagonal decorative accent */}
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

            {/* Products List - Structured Rows with guaranteed footer clearance */}
            <div className="flex flex-col px-6 pt-3 pb-24 flex-1">
                {products.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 group" style={{
                        borderBottom: i < products.length - 1 ? '1px solid #E2E8E4' : 'none',
                        paddingTop: i === 0 ? 2 : 8,
                        paddingBottom: 8,
                        flex: '1 1 0',
                        maxHeight: 90,
                    }}>
                        {/* Diamond Image Container */}
                        <div className="shrink-0 flex items-center justify-center" style={{ width: 68, height: 68 }}>
                            <div style={{
                                width: 54,
                                height: 54,
                                transform: 'rotate(45deg)',
                                overflow: 'hidden',
                                border: `1.5px solid ${COLORS.primaryDeep}25`,
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}>
                                {p.image ? (
                                    <img
                                        src={p.image}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ transform: 'rotate(-45deg) scale(1.42)' }}
                                        alt=""
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ transform: 'rotate(-45deg)' }}>
                                        <span className="text-lg opacity-25">📦</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
                            {/* Product Name */}
                            <h3 className="font-extrabold text-gray-900 text-[10.5px] leading-tight uppercase tracking-tight line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {p.name}
                            </h3>
                            {/* Code */}
                            <span className="text-[7.5px] font-bold uppercase tracking-wider mt-0.5" style={{ color: COLORS.primaryDeep }}>
                                COD. {p.id || 'N/A'}
                            </span>
                            {/* Description */}
                            {p.description && (
                                <p className="text-slate-400 text-[8px] leading-snug line-clamp-2 mt-0.5 italic">
                                    {p.description}
                                </p>
                            )}
                        </div>

                        {/* Price Column */}
                        <div className="shrink-0 flex flex-col items-end justify-center pl-2" style={{ minWidth: 55 }}>
                            <span className="text-[7px] text-slate-300 font-medium uppercase tracking-wide">Cad.</span>
                            <span className="font-black text-[13px] tracking-tight" style={{ color: COLORS.primaryDeep, fontFamily: 'Inter, sans-serif' }}>
                                {formatPrice(p.price)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <PageFooter pageNum={pageNum} isLeft={isLeft} />
    </div>
));

// --- DECORATIVE PAGE (geometric pattern - used for padding) ---
const DecorativePage = forwardRef(({ pageNum, isLeft }, ref) => (
    <div
        ref={ref}
        className="w-full h-full relative overflow-hidden"
        data-density="soft"
    >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: COLORS.paperTint }} />
        <PaperTexture opacity={0.6} />
        <div className="relative z-10 w-full h-full" style={{ isolation: 'isolate' }}>
            {/* Focal area - interlocked squares */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-10 border-[20px] border-slate-300" />
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-slate-200 opacity-20" />
                    <div className="absolute top-1/3 right-1/4 w-40 h-40 opacity-10" style={{ backgroundColor: COLORS.primaryDeep }} />
                </div>
            </div>
        </div>

        {/* Footer */}
        <PageFooter pageNum={pageNum} isLeft={isLeft} />
    </div>
));

// --- MAIN COMPONENT ---
export function FlipbookCatalog({ items = [], catalogTitle = "Catalogo", onClose }) {
    const flipBookRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const setView = useStore((state) => state.setView);

    // Build content pages (6 products per page)
    const contentPages = [];
    const categoryMap = {};
    items.forEach(item => {
        const cat = item.category || "Prodotti";
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(item);
    });

    // Track which page each category starts on
    // Page structure: Cover(no num) | Blank(no num) | Index(3) | Content starts at 4
    // Track which page each category starts on
    // Initial assumption: Start at 4 (Cover, Blank, Index, Content...)
    let currentContentPage = 4;
    const categoryIndex = [];

    Object.entries(categoryMap).forEach(([cat, list]) => {
        categoryIndex.push({ name: cat, page: currentContentPage });
        // INCREASED to 5 products per page as requested by user
        for (let i = 0; i < list.length; i += 5) {
            contentPages.push({ category: cat, products: list.slice(i, i + 5) });
            currentContentPage++;
        }
    });

    /**
     * Standard catalog structure:
     * - Page 1: Front Cover (HARD)
     * - Page 2: Blank page (OPTIONAL - to ensure total pages are EVEN)
     * - Page 2/3: Index page
     * - Pages N...: Content pages
     * - Page Last: Back Cover (HARD)
     */

    // Calculate if we need a blank page to make total EVEN.
    // Base: Cover(1) + Index(1) + Content + Back(1) = 3 + Content
    const baseTotal = 3 + contentPages.length;

    // User Requirement: "Se dispari, aggiungi bianca dopo copertina. Se pari, no."
    // If baseTotal is Odd -> We need +1 (Blank) -> Total becomes Even.
    // If baseTotal is Even -> No Blank.
    const needsBlank = (baseTotal % 2 !== 0);

    // If NO blank, shift all page numbers back by 1 (Index becomes 2, Content starts at 3)
    if (!needsBlank) {
        // Adjust category index
        categoryIndex.forEach(item => item.page -= 1);
    }

    const contentStartPage = needsBlank ? 4 : 3;

    // Build final page array
    const allPages = [];

    // Add content pages
    for (let i = 0; i < contentPages.length; i++) {
        allPages.push({ type: 'content', data: contentPages[i], pageNum: i + contentStartPage });
    }

    const totalPages = allPages.length + (needsBlank ? 4 : 3); // Covers, Index, maybe Blank

    // Handle page flip events
    const onFlip = (e) => {
        setCurrentPage(e.data);
    };

    // --- PDF GENERATION ---
    const downloadPDF = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF({ unit: "mm", format: "a4" });
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            const FOOTER_HEIGHT = 32; // INCREASED as requested (was 16)

            // RAINES Color Palette for PDF
            const PDF_COLORS = {
                primaryDeep: { r: 0, g: 100, b: 61 },     // #00643D
                secondaryDeep: { r: 0, g: 98, b: 51 },    // #006233
                mintAccent: { r: 79, g: 175, b: 138 },    // #4FAF8A
                paperTint: { r: 242, g: 245, b: 243 },    // #F2F5F3 (Solid, no texture lines)
            };

            // Preload Logo for Footer - Use SQUARE or original aspect ratio to avoid squashing
            const logoFooterRes = await getDataUrl("/RainesNero.svg", 200, 200);

            // Helper: Draw Geometric Background (Confined to Footer - ENHANCED)
            const drawGeometricBackground = (pageNum, isLeft) => {
                const seed = pageNum || 1;
                const count = 15 + (seed % 10); // INCREASED count

                for (let i = 0; i < count; i++) {
                    const s = (seed * (i + 13)) % 250;
                    const size = 5 + (s % 15);
                    const x = isLeft ? (s * 0.7) : (W - (s * 0.7) - size);
                    const y = (H - 26) + ((s * 0.9) % 26);

                    const colorIndex = i % 4;
                    const color = colorIndex === 0 ? PDF_COLORS.mintAccent :
                        (colorIndex === 1 ? PDF_COLORS.primaryDeep :
                            (colorIndex === 2 ? { r: 230, g: 235, b: 230 } : { r: 200, g: 205, b: 200 }));

                    // More filled shapes (70% filled)
                    const outlined = (s % 3 === 0);

                    doc.setDrawColor(color.r, color.g, color.b);
                    doc.setFillColor(color.r, color.g, color.b);
                    doc.setLineWidth(0.1);

                    if (outlined) {
                        doc.rect(x, y, size, size, 'D');
                    } else {
                        doc.setGState(new doc.GState({ opacity: 0.35 })); // INCREASED opacity
                        doc.rect(x, y, size, size, 'F');
                        doc.setGState(new doc.GState({ opacity: 1.0 }));
                    }
                }
            };

            // Helper: Draw Minimal Footer (Raised)
            const drawFooter = (pageNum, isLeft, showNumber = true) => {
                if (showNumber && pageNum) {
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.setFont("helvetica", "bold");
                    doc.text(`PAGE ${pageNum}`, W / 2, H - 14, { align: 'center' }); // RAISED
                }

                if (logoFooterRes?.data) {
                    const lW = 20;
                    const lRatio = logoFooterRes.ratio || 5;
                    const lH = lW / lRatio;
                    const lY = H - 22; // RAISED even more

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

            const drawTexture = () => {
                // TEXTURE REMOVED by user request ("fastidiose linee")
                // Leaving empty to maintain solid background
            };

            // COVER PAGE - A4 at 300dpi = 2480x3508 pixels
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

            // PAGE 2: BLANK (Inside Front Cover) - Conditional
            if (needsBlank) {
                doc.addPage();
                drawBackground();
                drawGeometricBackground(2, true);
                drawFooter(null, true, false);
            }

            // INDEX PAGE (Page 3 or 2)
            doc.addPage();
            drawBackground();
            drawGeometricBackground(needsBlank ? 3 : 2, !needsBlank);
            drawTexture();

            // Index header with green accent bar
            const cPrimary = PDF_COLORS.primaryDeep;
            const cMint = PDF_COLORS.mintAccent;

            doc.setFillColor(cPrimary.r, cPrimary.g, cPrimary.b);
            doc.rect(15, 25, 3, 20, 'F');
            doc.setFontSize(26); // SLIGHTLY BIGGER
            doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
            doc.setFont("helvetica", "bold");
            doc.text("INDICE", 22, 40);

            // Index entries
            let indexY = 60;
            categoryIndex.forEach(cat => {
                // Square bullet (Gray)
                doc.setFillColor(200, 200, 200);
                doc.rect(18, indexY - 2, 2.5, 2.5, 'F');

                // Category name
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                doc.setFont("helvetica", "normal");
                doc.text(cat.name, 25, indexY + 1);

                // Page number
                doc.setFontSize(12);
                doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
                doc.setFont("helvetica", "bold");
                doc.text(String(cat.page).padStart(2, '0'), 190, indexY + 1, { align: 'right' });

                // Separator line
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.2);
                doc.line(25, indexY + 5, 190, indexY + 5);

                indexY += 12;
            });

            // Corner Decorations REMOVED per user request

            drawFooter(needsBlank ? 3 : 2, !needsBlank);

            // CONTENT PAGES (starting at page 4)
            for (let i = 0; i < allPages.length; i++) {
                const page = allPages[i];
                const isLeft = (page.pageNum % 2) === 0;

                doc.addPage();
                drawBackground();
                drawGeometricBackground(page.pageNum, isLeft);
                drawTexture();

                if (page.type === 'decorative') {
                    // Decorative padding page
                    // Background already drawn

                    const cPrimary = PDF_COLORS.primaryDeep;
                    const cMint = PDF_COLORS.mintAccent;
                    const cSecondary = PDF_COLORS.secondaryDeep;

                    // Decorative padding page (REMOVED Rombi - Squares only)
                    const squares = [
                        { x: W / 2, y: H / 2 - 20, size: 40, color: [cMint.r, cMint.g, cMint.b], fill: false },
                        { x: W / 3, y: H / 3, size: 30, color: [cSecondary.r, cSecondary.g, cSecondary.b], fill: true },
                        { x: 2 * W / 3, y: 2 * H / 3 - 20, size: 35, color: [cPrimary.r, cPrimary.g, cPrimary.b], fill: true },
                        { x: W / 4, y: 3 * H / 4, size: 20, color: [cMint.r, cMint.g, cMint.b], fill: false },
                    ];

                    squares.forEach(s => {
                        doc.setDrawColor(...s.color);
                        doc.setFillColor(...s.color);
                        doc.rect(s.x, s.y, s.size, s.size, s.fill ? 'F' : 'D');
                    });
                } else {
                    // Content page - STRUCTURED CATALOG LAYOUT
                    const pageData = page.data;
                    const cPrimary = PDF_COLORS.primaryDeep;
                    const cMint = PDF_COLORS.mintAccent;

                    // Green Header Band
                    doc.setFillColor(cPrimary.r, cPrimary.g, cPrimary.b);
                    doc.rect(0, 0, W, 18, 'F');

                    // Diagonal accent on header
                    doc.setFillColor(cMint.r, cMint.g, cMint.b);
                    doc.setGState(new doc.GState({ opacity: 0.15 }));
                    // Simple diagonal stripe approximation
                    doc.triangle(W - 35, 0, W - 15, 0, W - 25, 18, 'F');
                    doc.triangle(W - 20, 0, W, 0, W - 10, 18, 'F');
                    doc.setGState(new doc.GState({ opacity: 1 }));

                    // Category name in header
                    doc.setFontSize(10);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont("helvetica", "bold");
                    doc.text(pageData.category.toUpperCase(), 15, 12);

                    // CATALOGO label right side
                    doc.setFontSize(7);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont("helvetica", "normal");
                    doc.text("CATALOGO", W - 15, 12, { align: 'right' });

                    // Products List - Structured rows
                    const startY = 26;
                    const maxY = H - FOOTER_HEIGHT - 8; // guarantee footer clearance
                    const itemCount = pageData.products.length;
                    const availableHeight = maxY - startY;
                    const rowHeight = Math.min(46, availableHeight / Math.max(itemCount, 1));

                    for (let j = 0; j < pageData.products.length; j++) {
                        const p = pageData.products[j];
                        const y = startY + (j * rowHeight);

                        // Skip if would overlap footer
                        if (y + rowHeight > maxY) break;

                        // Diamond image frame
                        const diamondCx = 30;
                        const diamondCy = y + rowHeight / 2;
                        const diamondSize = Math.min(14, rowHeight * 0.35);

                        // Draw diamond border
                        doc.setDrawColor(cPrimary.r, cPrimary.g, cPrimary.b);
                        doc.setGState(new doc.GState({ opacity: 0.15 }));
                        doc.setLineWidth(0.3);
                        // Diamond shape (rotated square)
                        const dPts = [
                            [diamondCx, diamondCy - diamondSize],
                            [diamondCx + diamondSize, diamondCy],
                            [diamondCx, diamondCy + diamondSize],
                            [diamondCx - diamondSize, diamondCy]
                        ];
                        doc.lines(
                            [[diamondSize, diamondSize], [0, 2 * diamondSize], [-diamondSize, diamondSize], [0, 0]],
                            diamondCx - diamondSize, diamondCy - diamondSize,
                            [1, 1], 'D', true
                        );
                        doc.setGState(new doc.GState({ opacity: 1 }));

                        // Product image inside diamond (rectangular crop approximation)
                        if (p.image) {
                            const d = await getDataUrl(p.image);
                            if (d?.data) {
                                const imgSize = diamondSize * 1.6;
                                doc.addImage(d.data, 'PNG',
                                    diamondCx - imgSize / 2,
                                    diamondCy - imgSize / 2,
                                    imgSize, imgSize,
                                    undefined, 'FAST'
                                );
                            }
                        }

                        // Product details
                        const textX = 46;

                        // Product name (bold, uppercase)
                        doc.setFontSize(9.5);
                        doc.setTextColor(25, 25, 25);
                        doc.setFont("helvetica", "bold");
                        const nameLines = doc.splitTextToSize(p.name.toUpperCase(), 105);
                        doc.text(nameLines.slice(0, 2), textX, y + 6);

                        // Code
                        const codeY = y + 6 + (nameLines.length > 1 ? 7 : 4);
                        doc.setFontSize(7);
                        doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
                        doc.setFont("helvetica", "bold");
                        doc.text(`COD. ${p.id || 'N/A'}`, textX, codeY);

                        // Description
                        if (p.description) {
                            doc.setFontSize(7);
                            doc.setTextColor(140, 140, 140);
                            doc.setFont("helvetica", "italic");
                            const descLines = doc.splitTextToSize(p.description, 105);
                            doc.text(descLines.slice(0, 2), textX, codeY + 4);
                        }

                        // Price (right-aligned)
                        doc.setFontSize(7);
                        doc.setTextColor(160, 160, 160);
                        doc.setFont("helvetica", "normal");
                        doc.text("Cad.", W - 20, y + 5, { align: 'right' });

                        doc.setFontSize(12);
                        doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
                        doc.setFont("helvetica", "bold");
                        doc.text(formatPrice(p.price), W - 20, y + 11, { align: 'right' });

                        // Separator line
                        if (j < pageData.products.length - 1) {
                            doc.setDrawColor(225, 230, 227);
                            doc.setLineWidth(0.2);
                            doc.line(15, y + rowHeight - 2, W - 15, y + rowHeight - 2);
                        }
                    }
                }

                // Footer for all content/decorative pages
                drawFooter(page.pageNum, isLeft);
            }


            // BACK COVER - use copertinapost.svg
            doc.addPage();
            const backCoverRes = await getDataUrl("/copertinapost.svg", 2480, 3508);
            if (backCoverRes?.data) {
                doc.addImage(backCoverRes.data, 'PNG', 0, 0, W, H);
            } else {
                // Fallback
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
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cGF0aCBkPSJNMzAgMGwzMCA1Mi0zMC01MnoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcGF0aD4KPC9zdmc+')] pointer-events-none" />

            {/* Top Controls */}
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

            {/* FLIPBOOK with OPTIMIZED SETTINGS */}
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

                    // === SHADOW SETTINGS (MAXIMUM REALISM) ===
                    drawShadow={true}
                    maxShadowOpacity={0.8}

                    // === ANIMATION SETTINGS ===
                    flippingTime={900}

                    // === COVER BEHAVIOR ===
                    showCover={true}

                    // === INTERACTION ===
                    useMouseEvents={true}
                    swipeDistance={30}
                    clickEventForward={true}

                    // === MOBILE ===
                    mobileScrollSupport={true}
                    usePortrait={false}

                    // === RENDERING ===
                    autoSize={false}
                    startPage={0}
                    startZIndex={0}

                    // === EVENTS ===
                    onFlip={onFlip}

                    className="shadow-2xl"
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {[
                        // 1. Cover Page
                        <CoverPage key="cover" />,

                        // 2. Blank Page (Conditional)
                        ...(needsBlank ? [<BlankPage key="blank" isLeft={true} />] : []),

                        // 3. Index Page
                        <IndexPage
                            key="index"
                            categories={categoryIndex}
                            startPage={needsBlank ? 3 : 2}
                            isLeft={!needsBlank}
                        />,

                        // 4. Content Pages
                        ...allPages.map((page, i) => (
                            page.type === 'content' ? (
                                <ContentPage
                                    key={`content-${i}`}
                                    category={page.data.category}
                                    products={page.data.products}
                                    pageNum={page.pageNum}
                                    isLeft={(page.pageNum % 2) === 0}
                                />
                            ) : (
                                <DecorativePage
                                    key={`decorative-${i}`}
                                    pageNum={page.pageNum}
                                    isLeft={(page.pageNum % 2) === 0}
                                />
                            )
                        )),

                        // 5. Back Cover
                        <BackCover key="back-cover" />
                    ]}
                </HTMLFlipBook>
            </div>

            {/* Navigation Controls */}
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

export default FlipbookCatalog;
