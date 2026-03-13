import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code"; // Ensure react-qr-code is installed!
import SearchableSelect from "./SearchableSelect";
import {
    Ticket,
    Inbox,
    X,
    FileText
} from "lucide-react";

export default function GatePassModal({ isOpen, onClose, provisionalOds }) {
    const [selectedOd, setSelectedOd] = useState(null);

    useEffect(() => {
        // Auto-select the first PROVISIONAL OD if available
        if (provisionalOds && provisionalOds.length > 0) {
            setSelectedOd(provisionalOds[0]);
        }
    }, [provisionalOds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 sm:p-6">
            <div
                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-springUp border border-slate-200 dark:border-slate-800 relative group"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                {/* Header Ribbon */}
                <div className="bg-slate-900 dark:bg-slate-800 p-8 text-center relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 bg-slate-800 dark:bg-slate-700 hover:bg-rose-500 text-white rounded-2xl p-2.5 transition-all z-10 group/close"
                    >
                        <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform" />
                    </button>

                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30 border border-indigo-500 group-hover:scale-105 transition-transform duration-500">
                        <Ticket className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Dispatch Pass</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2 opacity-80">Subject Teacher Credentials Required</p>
                </div>

                {/* Content Body */}
                <div className="p-8 flex flex-col items-center justify-center relative z-10">
                    {provisionalOds.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700 shadow-inner">
                                <Inbox className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">No Active Credentials Found</p>
                        </div>
                    ) : (
                        <>
                            {/* Event Selector (If multiple PROVISIONAL passes exist) */}
                            {provisionalOds.length > 1 && (
                                <div className="w-full mb-8">
                                    <SearchableSelect
                                        label="Select Mission Dispatch"
                                        placeholder="Target Sector..."
                                        value={String(selectedOd?.id || "")}
                                        onChange={(val) => {
                                            const od = provisionalOds.find(o => String(o.id) === val);
                                            setSelectedOd(od);
                                        }}
                                        options={provisionalOds.map(od => ({
                                            value: String(od.id),
                                            label: od.event?.name || "Dispatch ID",
                                            sublabel: od.trackerId || "Target Access",
                                            icon: <Ticket className="w-4 h-4 text-indigo-500" />
                                        }))}
                                    />
                                </div>
                            )}

                            {/* The Static Gate Pass QR Code */}
                            {selectedOd && (
                                <div className="flex flex-col items-center w-full">
                                    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800 group-hover:bg-slate-50 transition-colors duration-500">
                                        <div className="relative">
                                            <QRCode
                                                value={JSON.stringify({ odId: selectedOd.id })}
                                                size={180}
                                                level="H"
                                                className="rounded-xl opacity-90"
                                            />
                                            <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-xl pointer-events-none"></div>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center w-full space-y-3">
                                        <div className="inline-block px-4 py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 border border-amber-400">
                                            PROVISIONAL ACCESS
                                        </div>
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">
                                            {selectedOd.event?.name || "INTERNAL DISPATCH"}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 py-3 px-6 rounded-2xl border border-slate-100 dark:border-slate-700 mx-auto w-full">
                                            <span>Tracker:</span>
                                            <strong className="text-indigo-600 dark:text-indigo-400">{selectedOd.trackerId}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Warning */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-8 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase leading-relaxed tracking-widest">
                        Terminal authorization only. Final attendance must be validated at the target sector entry.
                    </p>
                </div>
            </div>
        </div>
    );
}
