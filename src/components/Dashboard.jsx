import React from 'react';
import useStore from '../lib/store';
import { Save, Share2, Printer, RefreshCw } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { KitPDF } from './KitPDF';

export function Dashboard() {
    const totalPrice = useStore((state) => state.totalPrice);
    const kitItems = useStore((state) => state.kitItems);

    return (
        <div className="h-full bg-surface/30 backdrop-blur-xl border-l border-glassBorder flex flex-col p-6">
            <div className="mb-8">
                <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-2">Total Value</h3>
                <div className="text-5xl font-bold text-white tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    €{totalPrice.toFixed(2)}
                </div>
                <div className="text-sm text-secondary mt-2 font-mono">
                    {kitItems.length} items in kit
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
                    <h4 className="font-semibold text-primary mb-1">Status: Active</h4>
                    <p className="text-xs text-secondary">Last sync: Just now</p>
                </div>

                <div className="h-px bg-glassBorder my-6" />

                <button className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 group">
                    <Save size={20} />
                    <span>Lock & Sync</span>
                </button>

                <button
                    onClick={async () => {
                        const blob = await pdf(<KitPDF items={kitItems} total={totalPrice} />).toBlob();
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                    }}
                    className="w-full py-4 px-6 bg-surface hover:bg-surface/80 text-white border border-glassBorder rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Printer size={20} />
                    <span>Broadcast PDF</span>
                </button>
            </div>

            <div className="mt-auto pt-6 border-t border-glassBorder">
                <div className="flex items-center gap-3 text-xs text-secondary">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Connecting to Ghost Inventory...
                </div>
            </div>
        </div>
    );
}
