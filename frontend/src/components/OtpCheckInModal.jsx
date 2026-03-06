import React, { useState, useRef, useEffect } from "react";
import api from "../api/axios";

export default function OtpCheckInModal({ isOpen, onClose }) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setOtp(["", "", "", "", "", ""]);
            setResult(null);
            setIsProcessing(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        // Allow only one character per box
        const char = value.slice(-1);

        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);

        // Auto-advance
        if (char && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                // Step back if current is empty
                inputRefs.current[index - 1].focus();
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
            } else {
                // Clear current
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...otp];
        pastedData.split("").forEach((char, index) => {
            if (index < 6) newOtp[index] = char;
        });
        setOtp(newOtp);

        // Focus last filled
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex].focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpValue = otp.join("");

        if (otpValue.length !== 6) return;

        setIsProcessing(true);
        setResult(null);

        try {
            const res = await api.post("/od/scan-internal", {
                // We don't have eventId visually on the student side before scanning
                // But the backend `scanInternalOD` handles OTP by sweeping active events
                // So we pass the OTP directly.
                otp: otpValue
            });

            setResult({ success: true, message: res.data.message });

            // Auto-close on success after short delay
            setTimeout(() => {
                onClose();
                window.location.reload(); // Refresh dashboard to show APPROVED
            }, 2000);

        } catch (err) {
            setResult({
                success: false,
                message: err.response?.data?.message || "Invalid or expired code."
            });
            // Clear OTP on fail for retry
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-[2px] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-springUp relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors z-10"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="p-8 pb-4 text-center">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-200 dark:border-indigo-800/50 shadow-inner">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight mb-1">Enter Venue Code</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Type the 6-digit code shown on the screen.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4">
                    {result && (
                        <div className={`mb-6 p-4 rounded-xl text-center text-sm font-bold animate-fadeIn ${result.success
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                                : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                            }`}>
                            {result.message}
                        </div>
                    )}

                    <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => (inputRefs.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="\d{1}"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                disabled={isProcessing}
                                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-black font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 transition-all shadow-sm"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={otp.join("").length !== 6 || isProcessing}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-md ${otp.join("").length === 6 && !isProcessing
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none"
                            }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            "Authorize Attendance"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
