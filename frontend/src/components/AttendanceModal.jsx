import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
    Camera,
    X
} from 'lucide-react';

export default function AttendanceModal({ isOpen, onClose, studentId, onSuccess }) {
    const { showToast } = useToast();

    // Scanner Instance Refs
    const html5QrCode = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [processingScan, setProcessingScan] = useState(false);
    const [scannerError, setScannerError] = useState(null);

    // OTP State
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isProcessingOtp, setIsProcessingOtp] = useState(false);
    const [otpError, setOtpError] = useState(null);
    const inputRefs = useRef([]);

    /* ================= SCANNER LOGIC ================= */
    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setOtp(["", "", "", "", "", ""]);
            setOtpError(null);
            setProcessingScan(false);
            setIsProcessingOtp(false);
            setScannerError(null);
            setIsScanning(false);

            // Give it a tiny moment for the DOM to settle, then start
            const timer = setTimeout(() => {
                startScanner();
                inputRefs.current[0]?.focus();
            }, 300);

            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        } else {
            stopScanner();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const startScanner = async () => {
        try {
            setScannerError(null);

            // 1. Create fresh instance every time
            if (!html5QrCode.current) {
                html5QrCode.current = new Html5Qrcode("attendance-scanner-reader");
            }

            // 2. Only start if not already active
            if (html5QrCode.current.isScanning) return;

            // 3. Start scanning - this SHOULD trigger the browser's "Allow/Deny" popup
            await html5QrCode.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                onScanSuccess,
                (err) => { /* Ignore constant frame errors */ }
            );
            setIsScanning(true);
        } catch (err) {
            console.error("Scanner startup error:", err);
            setScannerError("Camera permissions are required for QR scanning.");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        try {
            if (html5QrCode.current && html5QrCode.current.isScanning) {
                await html5QrCode.current.stop();
            }
            html5QrCode.current = null;
            setIsScanning(false);
        } catch (err) {
            console.error("Failed to stop scanner", err);
        }
    };

    const onScanSuccess = async (decodedText) => {
        if (processingScan || isProcessingOtp) return;
        setProcessingScan(true);

        try {
            // Pause instead of stop to keep the camera active while verifying
            if (html5QrCode.current && html5QrCode.current.isScanning) {
                try { html5QrCode.current.pause(true); } catch (e) { }
            }

            const res = await api.post('/od/scan-internal', {
                studentId: studentId,
                qrPayload: decodedText
            });

            await stopScanner();
            showToast(res.data.message || "Attendance verified successfully!", "success");
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error("Scan processing error:", error);
            showToast(error.response?.data?.message || "Invalid or Expired QR Code.", "error");
            setProcessingScan(false);

            // Resume scanning if failed
            if (html5QrCode.current && html5QrCode.current.isScanning) {
                try { html5QrCode.current.resume(); } catch (e) { }
            }
        }
    };

    /* ================= OTP LOGIC ================= */
    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const char = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);
        setOtpError(null);

        if (char && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
            } else {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...otp];
        pastedData.split("").forEach((char, index) => {
            if (index < 6) newOtp[index] = char;
        });
        setOtp(newOtp);
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex].focus();
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length !== 6 || processingScan || isProcessingOtp) return;

        setIsProcessingOtp(true);
        setOtpError(null);

        try {
            const res = await api.post("/od/scan-internal", {
                studentId: studentId,
                otp: otpValue
            });
            await stopScanner();
            showToast(res.data.message || "Attendance authenticated!", "success");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setOtpError(err.response?.data?.message || "Invalid or expired code.");
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setIsProcessingOtp(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 w-full max-w-md shadow-2xl animate-springUp border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                {/* Close Button */}
                <button
                    onClick={() => { stopScanner(); onClose(); }}
                    className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-500 rounded-2xl transition-all z-50 group"
                >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Presence Sync</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase tracking-[0.3em]">Initialize Bio-Metric / QR Handshake</p>
                </div>

                {/* SCANNER SECTION */}
                <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-square mb-8 border-8 border-slate-50 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none group">
                    <div id="attendance-scanner-reader" className="w-full h-full object-cover"></div>

                    {/* Verifying Overlay */}
                    {(processingScan || isProcessingOtp) && (
                        <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center gap-4 backdrop-blur-xl">
                            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] animate-pulse">Decrypting...</p>
                        </div>
                    )}

                    {/* Error Overlay / Fallback */}
                    {!isScanning && !processingScan && (
                        <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center p-10 text-center gap-6">
                            <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center border-4 border-slate-700 shadow-xl group-hover:border-indigo-500 transition-colors">
                                <Camera className="w-10 h-10 text-slate-500" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm font-black text-white uppercase tracking-tight">Camera Feed Locked</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase leading-relaxed tracking-widest opacity-60">Authentication requires direct visual handshake via terminal optic sensor.</p>
                                <button
                                    onClick={(e) => { e.preventDefault(); startScanner(); }}
                                    className="mt-4 w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-500/30 active:scale-95"
                                >
                                    Enable Sensor
                                </button>
                            </div>
                        </div>
                    )}

                    {isScanning && !processingScan && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-indigo-500/20 rounded-3xl flex items-center justify-center">
                                <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_30px_rgba(99,102,241,0.8)] animate-scan opacity-60"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* DIVIDER */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">Protocol Sync</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </div>

                {/* OTP SECTION */}
                <form onSubmit={handleOtpSubmit} className="space-y-8">
                    {otpError && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 animate-shake">
                             Auth Failure: {otpError}
                        </div>
                    )}

                    <div className="flex justify-between gap-3" onPaste={handleOtpPaste}>
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                id={`otp-log-${idx}`}
                                name={`otp-log-${idx}`}
                                ref={(el) => (inputRefs.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                pattern="\d{1}"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                disabled={processingScan || isProcessingOtp}
                                className="w-full h-14 sm:h-20 text-center text-3xl font-black font-mono bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={otp.join("").length !== 6 || processingScan || isProcessingOtp}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${otp.join("").length === 6 && !processingScan && !isProcessingOtp
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        {isProcessingOtp ? "Authorizing Sync..." : "Confirm Protocol"}
                    </button>
                </form>

                <p className="mt-8 text-center text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-40">
                    Dynamic Token Refreshes Every 30.0s
                </p>
            </div>
        </div>
    );
}
