import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function ScannerModal({ isOpen, onClose, studentId, onSuccess }) {
    const { showToast } = useToast();
    const scannerRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            stopScanner();
            return;
        }

        // Delay starting to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const startScanner = async () => {
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader");
            }

            await scannerRef.current.start(
                { facingMode: "environment" }, // Prioritize back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                onScanSuccess,
                onScanFailure
            );
            setIsScanning(true);
        } catch (err) {
            console.error("Scanner init error:", err);
            showToast("Failed to start camera. Please ensure permissions are granted.", "error");
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        // Prevent multiple fires during processing
        if (processing) return;

        // Show processing state immediately
        setProcessing(true);

        try {
            // FIRE AND FORGET: pause the camera so it stops scanning but doesn't crash React unmount
            if (scannerRef.current) {
                try {
                    scannerRef.current.pause(true);
                } catch (e) { } // Ignoring pause errors safely
            }

            const payload = {
                studentId: studentId,
                qrPayload: decodedText
            };

            const res = await api.post('/od/scan-internal', payload);

            // CLEAN TARGET: If success, we kill the camera fully and close
            try { await stopScanner(); } catch (e) { }

            showToast(res.data.message || "Attendance verified successfully!", "success");

            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error("Scan processing error:", error);
            showToast(error.response?.data?.message || "Invalid or Expired QR Code.", "error");

            // Allow them to try again after failure
            setProcessing(false);

            // Resume scanning cleanly
            if (scannerRef.current) {
                try {
                    scannerRef.current.resume();
                } catch (e) {
                    // Fallback to start if resume fails
                    startScanner();
                }
            }
        }
    };

    const onScanFailure = (error) => {
        // html5-qrcode fires this continuously when no QR is found. We safely ignore it.
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleIn border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scan Event QR</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">Instantly log your internal OD</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square mb-6">
                    <div id="reader" className="w-full h-full object-cover"></div>

                    {/* Processing Overlay over the camera */}
                    {processing ? (
                        <div className="absolute inset-0 z-10 bg-slate-900/90 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                            <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-white animate-pulse">Verifying Cryptographic Token...</p>
                        </div>
                    ) : (
                        /* Scanner HUD Overlay */
                        <div className="absolute inset-0 pointer-events-none border-[12px] border-black/40">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-indigo-500/50 rounded-xl flex items-center justify-center">
                                <div className="w-full h-0.5 bg-indigo-500/50 shadow-[0_0_8px_hsl(240_100%_70%)] animate-scan"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Point your camera at the live projection screen.
                    </p>
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 py-1.5 px-3 rounded-lg inline-block">
                        Codes expire every 30 seconds
                    </p>
                </div>
            </div>
        </div>
    );
}
