import { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/bit-logo.jpg";
import bg from "../assets/campus.jpg";
import {
  Mail,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Timer,
  RefreshCcw,
  Zap,
  Lock
} from "lucide-react";

export default function Login() {
  /* const navigate = useNavigate(); */

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [step, setStep] = useState(1); // 1 = email, 2 = otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(false);
  const [pendingOtp, setPendingOtp] = useState("");

  const otpRefs = useRef([]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (step !== 2 || seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [step, seconds]);

  useEffect(() => {
    if (seconds === 0) setCanResend(true);
  }, [seconds]);

  /* ================= SEND OTP ================= */
  const sendOTP = async () => {
    if (loading) return;

    setError("");

    if (!email) {
      triggerShake("Enter your email");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/send-otp", { email });

      setStep(2);
      setOtp(Array(6).fill(""));
      setSeconds(60);
      setCanResend(false);

      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      triggerShake(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= GEOLOCATION HELPER ================= */
  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  /* ================= VERIFY OTP ================= */
  const verifyOTP = async (finalOtp) => {
    if (loading) return;

    setError("");

    if (finalOtp.length !== 6) {
      triggerShake("Enter complete 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      // Robust Brave detection + Geolocation
      const isBrave = (navigator.brave && typeof navigator.brave.isBrave === 'function' && await navigator.brave.isBrave()) || false;
      const coords = await getCoordinates();

      const res = await api.post("/auth/verify-otp", {
        email,
        otp: finalOtp,
        force: false,
        browserHint: isBrave ? "Brave" : null,
        lat: coords?.lat,
        lon: coords?.lon
      });

      handleLoginSuccess(res);

    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === "SESSION_CONFLICT") {
        // Show the conflict dialog instead of shaking
        setPendingOtp(finalOtp);
        setSessionConflict(true);
        return;
      }
      const errorMsg = err.response?.data?.message || "Invalid OTP";
      triggerShake(errorMsg);
      setOtp(Array(6).fill(""));

      if (errorMsg.includes("Maximum attempts reached")) {
        setTimeout(() => {
          setStep(1);
          setEmail("");
        }, 3000);
      } else {
        otpRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORCE LOGIN (kick other device) ================= */
  const forceLogin = async () => {
    setSessionConflict(false);
    try {
      setLoading(true);
      // Robust Brave detection + Geolocation
      const isBrave = (navigator.brave && typeof navigator.brave.isBrave === 'function' && await navigator.brave.isBrave()) || false;
      const coords = await getCoordinates();

      const res = await api.post("/auth/verify-otp", {
        email,
        otp: pendingOtp,
        force: true,
        browserHint: isBrave ? "Brave" : null,
        lat: coords?.lat,
        lon: coords?.lon
      });
      handleLoginSuccess(res);
    } catch (err) {
      triggerShake(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLE SUCCESS ================= */
  const handleLoginSuccess = (res) => {
    sessionStorage.setItem("role", res.data.role);
    sessionStorage.setItem("user", JSON.stringify(res.data.user));
    sessionStorage.setItem("token", res.data.token);
    setSuccess(true);
    setLoading(true); // Keep loader during redirect
    setTimeout(() => {
      // Force a full hardware reload instead of React Router navigation
      // to ensure all Contexts (Notification, Chat, etc.) mount with the new token.
      if (res.data.role === "STUDENT") window.location.href = "/student/dashboard";
      else if (res.data.role === "FACULTY") window.location.href = "/faculty/dashboard";
      else if (res.data.role === "ADMIN") window.location.href = "/admin/dashboard";
    }, 900);
  };

  /* ================= OTP INPUT ================= */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }

    if (index === 5 && value) {
      verifyOTP(next.join(""));
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pasted.length === 6) {
      setOtp(pasted);
      verifyOTP(pasted.join(""));
    }
  };

  /* ================= SHAKE ================= */
  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  /* ================= RESEND ================= */
  const resendOTP = async () => {
    if (!canResend || loading) return;
    sendOTP();
  };

  return (
    <>
    {/* FIXED background — covers entire screen even when keyboard opens */}
    <div
      className="fixed inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    />
    {/* Overlay */}
    <div className="fixed inset-0 bg-blue-900/70" />

    {/* Scrollable container so card is always reachable when keyboard is open */}
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">

      {/* LOADER */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
          <Loader2 className="w-14 h-14 text-white animate-spin" />
          {success && <p className="text-white font-bold animate-pulse">Redirecting...</p>}
        </div>
      )}

      {/* SESSION CONFLICT MODAL */}
      {sessionConflict && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
              <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Account Already In Use</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This account is currently logged in on another device. Would you like to log them out and continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSessionConflict(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={forceLogin}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors shadow-sm"
              >
                Yes, Log Them Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD */}
      <div
        className={`w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden ${shake ? "animate-shake" : ""}`}
      >
        {/* HEADER — compact on mobile */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 sm:py-6 text-center">
          <img src={logo} alt="BIT" className="mx-auto h-10 sm:h-14 mb-2 sm:mb-3" />
          <h1 className="text-white text-lg sm:text-xl font-bold">BIP OD Portal</h1>
          <p className="text-blue-200 text-xs sm:text-sm">Secure OTP Login</p>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 space-y-4">
          {step === 1 && (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm sm:text-base"
                />
              </div>
              <button
                onClick={sendOTP}
                className="w-full bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Zap className="w-4 h-4" /> Send OTP
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex justify-between gap-1 sm:gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="flex-1 min-w-0 h-11 sm:h-12 text-center text-lg sm:text-xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                ))}
              </div>

              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {canResend ? "Didn't get OTP?" : (
                    <span className="flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" /> Resend in {seconds}s
                    </span>
                  )}
                </span>
                <button
                  onClick={resendOTP}
                  disabled={!canResend}
                  className={`font-semibold ${canResend ? "text-blue-700 dark:text-blue-400" : "text-gray-400"}`}
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={() => verifyOTP(otp.join(""))}
                disabled={otp.join("").length !== 6}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm sm:text-base
                  ${otp.join("").length === 6
                    ? "bg-green-700 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                <ShieldCheck className="w-5 h-5" /> Verify &amp; Login
              </button>
            </>
          )}

          {error && <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>}

          {success && (
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
