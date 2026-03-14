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
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success vibration
            showToast(res.data.message || "Attendance verified successfully!", "success");
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error("Scan processing error:", error);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Error vibration
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
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success vibration
            showToast(res.data.message || "Attendance authenticated!", "success");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Error vibration
            setOtpError(err.response?.data?.message || "Invalid or expired code.");
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setIsProcessingOtp(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-springUp border border-slate-200 dark:border-slate-800 relative">

                {/* Close Button */}
                <button
                    onClick={() => { stopScanner(); onClose(); }}
                    className="absolute top-6 right-6 p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Log Attendance</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-widest">Digital OD Authentication</p>
                </div>

                {/* SCANNER SECTION */}
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-square mb-6 border-4 border-slate-100 dark:border-slate-800 shadow-inner group">
                    <div id="attendance-scanner-reader" className="w-full h-full object-cover"></div>

                    {/* Verifying Overlay */}
                    {(processingScan || isProcessingOtp) && (
                        <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-xs font-black text-white uppercase tracking-widest">Verifying...</p>
                        </div>
                    )}

                    {/* Error Overlay / Fallback */}
                    {!isScanning && !processingScan && (
                        <div className="absolute inset-0 z-10 bg-slate-800 flex flex-col items-center justify-center p-8 text-center gap-4">
                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-700">
                                <Camera className="w-10 h-10 text-slate-400" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-white">Camera Permission Needed</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Please allow camera access to log your attendance via QR code. Look for the prompt at the top of your screen.</p>
                                <button
                                    onClick={(e) => { e.preventDefault(); startScanner(); }}
                                    className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                >
                                    Allow Camera Access
                                </button>
                            </div>
                        </div>
                    )}

                    {isScanning && !processingScan && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-indigo-500/40 rounded-2xl flex items-center justify-center">
                                <div className="w-full h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-scan"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* DIVIDER */}
                <div className="flex items-center gap-4 mb-8">
                    <hr className="flex-1 border-slate-100 dark:border-slate-800" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scan OR Enter Code</span>
                    <hr className="flex-1 border-slate-100 dark:border-slate-800" />
                </div>

                {/* OTP SECTION */}
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                    {otpError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl text-center text-xs font-bold text-red-600 dark:text-red-400 animate-shake">
                            {otpError}
                        </div>
                    )}

                    <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
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
                                className="w-full h-14 md:h-16 text-center text-2xl font-black font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={otp.join("").length !== 6 || processingScan || isProcessingOtp}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${otp.join("").length === 6 && !processingScan && !isProcessingOtp
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        {isProcessingOtp ? "Authorizing..." : "Authorize with OTP"}
                    </button>
                </form>

                <p className="mt-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Temporal Security Active • Code refreshes every 30s
                </p>
            </div>
        </div>
    );
}
