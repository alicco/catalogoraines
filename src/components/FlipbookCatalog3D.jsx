/**
 * FlipbookCatalog3D.jsx
 * 
 * Uses react-3d-flipbook (WebGL/Three.js) for realistic 3D effects.
 * Converts dynamic React layouts to images using html-to-image.
 */
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Flipbook } from 'react-3d-flipbook';
import 'react-3d-flipbook/dist/styles.css';
import { toPng } from 'html-to-image';
import { X, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import useStore from "../lib/store";

// REUSING COMPONENTS FROM FlipbookCatalog2 conceptually, 
// but we need them in a way that we can "snapshot" them.
// We'll define them here so we can control their rendering for the snapshot.

const COLORS = {
    primaryDeep: "#00643D",
    secondaryDeep: "#006233",
    mintAccent: "#4FAF8A",
    paperTint: "#F2F5F3",
};

const DECO_FILLS = ["#00643D", "#4FAF8A", "#006233", "#A8D5C2", "#1B7A4E", "#D4EDE2"];

// Helper for formatting price
const formatPrice = (p) => (typeof p === "number" ? `€ ${p.toFixed(2)}` : p || "");

// --- Shared Components for Background ---

const PaperTexture = () => (
    <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
        opacity: 0.3, zIndex: 50
    }} />
);

const GeometricBackground = ({ seed = 1, isLeft }) => {
    const shapes = useMemo(() => {
        const res = [];
        const count = 10 + (seed % 6);
        for (let i = 0; i < count; i++) {
            const s = (seed * (i + 7)) % 250;
            const size = 6 + (s % 40);
            const x = isLeft ? (s * 1.5) : (480 - (s * 1.5) - size);
            const y = (s * 2.5) % 80;
            const rotation = (s * 13) % 45;
            const color = i % 4 === 0 ? COLORS.mintAccent : (i % 4 === 1 ? COLORS.primaryDeep : (i % 4 === 2 ? '#E2E8F0' : '#CBD5E1'));
            res.push({ size, color, outlined: (s % 2 === 0), x, y, rotation });
        }
        return res;
    }, [seed, isLeft]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
            {shapes.map((sh, idx) => (
                <div key={idx} className="absolute" style={{
                    width: sh.size, height: sh.size,
                    backgroundColor: sh.outlined ? 'transparent' : sh.color,
                    border: sh.outlined ? `1.2px solid ${sh.color}` : 'none',
                    left: sh.x, top: sh.y, transform: `rotate(${sh.rotation}deg)`, opacity: 0.25
                }} />
            ))}
        </div>
    );
};

const PageFooter = ({ pageNum, isLeft, showNumber = true }) => (
    <div className="absolute bottom-0 left-0 right-0 h-20 z-20 overflow-hidden">
        <GeometricBackground seed={pageNum || 1} isLeft={isLeft} />
        <div className="absolute inset-0 flex items-center px-10">
            {isLeft && <img src="/RainesNero.svg" className="h-8 opacity-90 object-contain" alt="Raines" />}
            <div className="flex-1 text-center">
                {showNumber && <span className="text-slate-800 text-[10px] font-black tracking-[0.2em] opacity-70">PAGE {pageNum}</span>}
            </div>
            {!isLeft && <img src="/RainesNero.svg" className="h-8 opacity-90 object-contain" alt="Raines" />}
        </div>
    </div>
);

// --- Layout Components for Snapshot ---

const MosaicLayout = ({ category, products, startFigNum, pageNum, isLeft }) => {
    const MOSAIC_POSITIONS = [
        { top: 14, left: 12, size: 105 }, { top: 8, left: 56, size: 88 },
        { top: 50, left: 8, size: 95 }, { top: 46, left: 54, size: 100 },
    ];
    return (
        <div className="w-[480px] h-[680px] relative overflow-hidden flex flex-col bg-[#F2F5F3]">
            <PaperTexture />
            <div className="relative z-10 flex flex-col flex-1">
                <div className="relative overflow-hidden bg-[#00643D] h-[44px]">
                    <div className="absolute inset-0 flex items-center justify-between px-8">
                        <h2 className="font-extrabold text-white text-xs tracking-wider uppercase">{category}</h2>
                        <span className="text-white/50 text-[9px] font-bold uppercase tracking-[0.3em]">CATALOGO</span>
                    </div>
                </div>
                <div className="relative flex-1 mx-3 my-1">
                    {/* Simplified deco rects for snapshot stability */}
                    <div className="absolute top-[5%] left-0 w-28 h-45 bg-[#00643D] opacity-10 rotate-45" />
                    <div className="absolute top-[40%] right-[2%] w-22 h-35 bg-[#4FAF8A] opacity-10" />

                    {products.slice(0, 4).map((p, i) => {
                        const pos = MOSAIC_POSITIONS[i];
                        return (
                            <div key={i} className="absolute" style={{ top: `${pos.top}%`, left: `${pos.left}%` }}>
                                <div className="relative" style={{ width: pos.size, height: pos.size }}>
                                    <div className="absolute inset-0 rotate-45 overflow-hidden border-2 border-[#00643D15] bg-white shadow-sm">
                                        {p.image ? (
                                            <img src={p.image} className="absolute inset-0 w-full h-full object-cover -rotate-45 scale-[1.42]" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center -rotate-45">📦</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 z-10">
                                        <span className="text-[7px] font-bold bg-[#00643D] text-white px-1.5 py-0.5 rounded-sm">Fig.{startFigNum + i}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <PageFooter pageNum={pageNum} isLeft={isLeft} />
        </div>
    );
};

const DetailLayout = ({ category, products, startFigNum, pageNum, isLeft }) => (
    <div className="w-[480px] h-[680px] relative overflow-hidden flex flex-col bg-[#F2F5F3]">
        <PaperTexture />
        <div className="relative z-10 flex flex-col flex-1">
            <div className="relative overflow-hidden bg-[#00643D] h-[44px]">
                <div className="absolute inset-0 flex items-center justify-between px-8">
                    <h2 className="font-extrabold text-white text-xs tracking-wider uppercase">{category}</h2>
                    <span className="text-white/50 text-[9px] font-bold uppercase tracking-[0.3em]">CATALOGO</span>
                </div>
            </div>
            <div className="flex flex-col px-5 pt-3 pb-24 flex-1">
                {products.map((p, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-center border-b last:border-0 border-[#E2E8E4] py-2 max-h-[120px]">
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 flex items-center justify-center bg-[#00643D] w-10 h-[18px] rounded-sm">
                                <span className="text-white text-[8px] font-bold tracking-wider">FIG.{startFigNum + i}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-extrabold text-gray-900 text-[10.5px] leading-tight uppercase line-clamp-2">{p.name}</h3>
                                <span className="text-[7.5px] font-bold text-[#00643D] uppercase tracking-wider">COD. {p.id || 'N/A'}</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-[8px] leading-snug line-clamp-2 mt-1 ml-[52px] italic pr-2">
                            {p.description || "Scheda tecnica disponibile su richiesta."}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 ml-[52px] pr-1 pt-1 border-t border-slate-100">
                            <span className="text-slate-300 text-[7px] uppercase">Cad.</span>
                            <span className="font-black text-[14px] text-[#00643D]">{formatPrice(p.price)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <PageFooter pageNum={pageNum} isLeft={isLeft} />
    </div>
);

const StaticImagePage = ({ src }) => (
    <div className="w-[480px] h-[680px] relative overflow-hidden">
        <img src={src} className="w-full h-full object-cover" alt="PageContent" />
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function FlipbookCatalog3D({ items = [], onClose }) {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const hiddenContainerRef = useRef(null);

    // 1. Prepare Page Configs (Logical structure)
    const pageConfigs = useMemo(() => {
        const configs = [];
        const categoryMap = {};
        items.forEach(item => {
            const cat = item.category || "Prodotti";
            if (!categoryMap[cat]) categoryMap[cat] = [];
            categoryMap[cat].push(item);
        });

        // Cover
        configs.push({ type: 'static', src: '/RainesApp.svg' });
        // Blank (to make index appear on Right)
        configs.push({ type: 'empty' });
        // Index placeholder
        configs.push({ type: 'static', src: '/copertinapost.svg' });

        let figNum = 1;
        let pageNum = 4;

        Object.entries(categoryMap).forEach(([cat, list]) => {
            for (let i = 0; i < list.length; i += 4) {
                const chunk = list.slice(i, i + 4);
                // Mosaic (Left)
                configs.push({ type: 'mosaic', cat, chunk, figNum, pageNum, isLeft: true });
                pageNum++;
                // Detail (Right)
                configs.push({ type: 'detail', cat, chunk, figNum, pageNum, isLeft: false });
                pageNum++;
                figNum += chunk.length;
            }
        });

        // Back Cover
        configs.push({ type: 'static', src: '/copertinapost.svg' });

        return configs;
    }, [items]);

    // 2. Capture Effect
    useEffect(() => {
        if (pageConfigs.length === 0) return;

        const captureAll = async () => {
            setLoading(true);
            setProgress(0);

            const results = [];
            const nodes = hiddenContainerRef.current?.children;

            if (!nodes) return;

            // Wait for everything to mount
            await new Promise(r => setTimeout(r, 600));

            for (let i = 0; i < pageConfigs.length; i++) {
                const config = pageConfigs[i];
                if (config.type === 'static') {
                    results.push({ src: config.src });
                } else if (config.type === 'empty') {
                    results.push({ src: '', empty: true });
                } else {
                    const node = nodes[i];
                    if (node) {
                        try {
                            const dataUrl = await toPng(node, { pixelRatio: 2 });
                            results.push({ src: dataUrl });
                        } catch (err) {
                            console.error("Capture failed for page", i, err);
                            results.push({ src: '', empty: true });
                        }
                    }
                }
                setProgress(Math.round(((i + 1) / pageConfigs.length) * 100));
            }

            setPages(results);
            setLoading(false);
        };

        captureAll();
    }, [pageConfigs]);

    // --- RENDER ---

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] bg-zinc-900 flex flex-col items-center justify-center text-white p-10">
                <div className="relative w-24 h-24 mb-6">
                    <Loader2 className="w-full h-full animate-spin text-emerald-500 absolute" />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xs">{progress}%</div>
                </div>
                <h3 className="text-xl font-bold">Generazione Prototipo 3D</h3>
                <p className="text-white/40 text-sm mt-2 text-center max-w-xs">
                    Sto convertendo i layout dinamici in immagini ad alta risoluzione per il motore WebGL...
                </p>
                <div className="w-64 h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 overflow-hidden">
            {/* HIDDEN RENDERER */}
            <div ref={hiddenContainerRef} style={{ position: 'absolute', top: -10000, left: 0 }}>
                {pageConfigs.map((cfg, idx) => (
                    <div key={idx} style={{ width: 480, height: 680, overflow: 'hidden' }}>
                        {cfg.type === 'mosaic' && (
                            <MosaicLayout category={cfg.cat} products={cfg.chunk} startFigNum={cfg.figNum} pageNum={cfg.pageNum} isLeft={cfg.isLeft} />
                        )}
                        {cfg.type === 'detail' && (
                            <DetailLayout category={cfg.cat} products={cfg.chunk} startFigNum={cfg.figNum} pageNum={cfg.pageNum} isLeft={cfg.isLeft} />
                        )}
                        {cfg.type === 'static' && <StaticImagePage src={cfg.src} />}
                        {cfg.type === 'empty' && <div className="w-[480px] h-[680px] bg-[#F2F5F3]" />}
                    </div>
                ))}
            </div>

            <button onClick={onClose} className="absolute top-6 left-6 z-50 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-all shadow-xl">
                <X size={24} />
            </button>

            <div className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full h-full max-w-[1200px] max-h-[90vh]">
                    <Flipbook
                        pages={pages}
                        width="100%"
                        height="100%"
                        skin="dark"
                        shadows={true}
                        shadowOpacity={0.6}
                        pageHardness={0.5}
                        coverHardness={0.9}
                        pageFlipDuration={900}
                        cameraZoom={1.5}
                        lightIntensity={1.2}
                    />
                </div>
            </div>
        </div>
    );
}

export default FlipbookCatalog3D;
