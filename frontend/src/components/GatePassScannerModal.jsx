import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';

/**
 * GatePassScannerModal component - Provides a camera interface for faculty members
 * to scan student QR codes and verify their digital gate passes in real-time.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Function to close the modal and stop camera
 */
export default function GatePassScannerModal({ isOpen, onClose }) {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCode = useRef(null);


    const stopScanner = useCallback(async () => {
        try {
            if (html5QrCode.current && html5QrCode.current.isScanning) {
                await html5QrCode.current.stop();
            }
        } catch (err) {
            console.error("Failed to stop scanner", err);
        }
    }, []);

    const onScanSuccess = useCallback(async (decodedText) => {
        if (isProcessing) return; // Prevent double scans

        try {
            setIsProcessing(true);
            await stopScanner();
            setScanning(false);
            setError(null);

            // 1. Parse Payload
            let payload;
            try {
                payload = JSON.parse(decodedText);
            } catch {
                throw new Error("Invalid QR Format. Make sure the student is showing their official Gate Pass.");
            }

            if (!payload.odId) {
                throw new Error("Missing Gate Pass Identifier.");
            }

            // 2. Hit the Backend Verification Gateway
            const response = await api.post("/od/verify-gate-pass", { odId: payload.odId });

            if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success pattern

            setScanResult({
                success: true,
                message: response.data.message,
                student: response.data.student,
                event: response.data.event
            });

        } catch (err) {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Error pattern
            setScanResult({
                success: false,
                message: err.response?.data?.message || err.message || "Failed to verify pass."
            });
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, stopScanner]);

    const startScanner = useCallback(async () => {
        try {
            if (!html5QrCode.current) {
                html5QrCode.current = new Html5Qrcode("faculty-scanner-reader");
            }
            await html5QrCode.current.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                () => { /* Ignore frame errors */ }
            );
        } catch (err) {
            console.error("Scanner Error:", err);
            setError("Please allow camera permissions to scan.");
        }
    }, [onScanSuccess]);

    useEffect(() => {
        if (isOpen) {
            setScanResult(null);
            setError(null);
            setScanning(true);
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [isOpen, startScanner]);

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        setScanning(true);
        startScanner();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-springUp">

                {/* Header */}
                <div className="bg-slate-900 p-5 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold text-lg">Scan Student Gate Pass</h3>
                        <p className="text-slate-400 font-mono text-xs mt-1">Authorize Class Exit</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        aria-label="Close scanner"
                        className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div 
                            role="alert"
                            className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-center font-medium border border-rose-200 dark:border-rose-900 mb-4"
                        >
                            {error}
                        </div>
                    )}

                    {isProcessing && (
                        <div 
                            aria-live="polite"
                            className="py-12 flex flex-col items-center justify-center space-y-4"
                        >
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium font-mono">Verifying Credentials...</p>
                        </div>
                    )}

                    {!isProcessing && scanning && !scanResult && (
                        <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square">
                            <div id="faculty-scanner-reader" className="w-full h-full" ref={scannerRef}></div>

                            {/* Scanner Overlay UI */}
                            <div className="absolute inset-0 pointer-events-none border-[40px] border-slate-900/50"></div>
                            <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg pointer-events-none z-10 scale-90"></div>
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.5)] animate-scan pointer-events-none z-20"></div>
                        </div>
                    )}

                    {!isProcessing && scanResult && (
                        <div className="py-8 text-center animate-fadeIn">
                            {scanResult.success ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-200 dark:border-emerald-800">
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Exit Authorized</h2>
                                    <p className="text-emerald-600 font-bold mb-6 bg-emerald-50 dark:bg-emerald-900/20 py-2 rounded-xl mx-4">{scanResult.message}</p>

                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left border border-slate-100 dark:border-slate-700">
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <span className="text-slate-500">Student:</span>
                                            <span className="font-bold text-slate-900 dark:text-white text-right">{scanResult.student?.name}</span>
                                            <span className="text-slate-500">Roll No:</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white text-right">{scanResult.student?.rollNo}</span>
                                            <span className="text-slate-500">Event destination:</span>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-right">{scanResult.event?.name}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-200 dark:border-rose-800">
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Scan Rejected</h2>
                                    <p className="text-rose-600 font-bold bg-rose-50 dark:bg-rose-900/20 py-3 px-4 rounded-xl mx-4 leading-snug">{scanResult.message}</p>
                                </>
                            )}

                            <button
                                onClick={resetScanner}
                                className="mt-8 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors font-mono tracking-widest uppercase text-xs"
                            >
                                Scan Another Pass
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
