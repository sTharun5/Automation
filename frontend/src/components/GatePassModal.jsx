import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code"; // Ensure react-qr-code is installed!

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-springUp border border-slate-200 dark:border-slate-800"
            >
                {/* Header Ribbon */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-[0_4px_20px_rgb(0,0,0,0.1)] border border-white/20">
                        <span className="text-3xl">🎫</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Digital Gate Pass</h2>
                    <p className="text-sm text-indigo-100 font-medium opacity-90">Show this to your Subject Teacher</p>
                </div>

                {/* Content Body */}
                <div className="p-6 md:p-8 flex flex-col items-center justify-center">
                    {provisionalOds.length === 0 ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl opacity-50">📭</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No active Gate Passes found.</p>
                        </div>
                    ) : (
                        <>
                            {/* Event Selector (If multiple PROVISIONAL passes exist) */}
                            {provisionalOds.length > 1 && (
                                <div className="w-full mb-6">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Event Pass</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                        value={selectedOd?.id || ""}
                                        onChange={(e) => {
                                            const od = provisionalOds.find(o => o.id === parseInt(e.target.value));
                                            setSelectedOd(od);
                                        }}
                                    >
                                        {provisionalOds.map(od => (
                                            <option key={od.id} value={od.id}>{od.event?.name || "Internal Event"}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* The Static Gate Pass QR Code */}
                            {selectedOd && (
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                        <QRCode
                                            value={JSON.stringify({ odId: selectedOd.id })}
                                            size={180}
                                            level="H"
                                            className="rounded"
                                        />
                                    </div>

                                    <div className="mt-6 text-center w-full">
                                        <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-amber-200 dark:border-amber-800/50 mb-2">
                                            Provisional Status
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                            {selectedOd.event?.name || "Internal Event"}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-700 mx-auto w-fit">
                                            <span>Tracker ID:</span>
                                            <strong className="text-indigo-600 dark:text-indigo-400">{selectedOd.trackerId}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Warning */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        This pass only authorizes exit from class. Final attendance must be scanned at the venue door.
                    </p>
                </div>
            </div>
        </div>
    );
}
