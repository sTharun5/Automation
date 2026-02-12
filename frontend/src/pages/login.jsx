import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/bit-logo.jpg";
import bg from "../assets/campus.jpg";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [step, setStep] = useState(1); // 1 = email, 2 = otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

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

      const res = await api.post("/auth/verify-otp", {
        email,
        otp: finalOtp
      });
      console.log("LOGIN RESPONSE:", res.data);
      console.log("ROLE RECEIVED:", res.data.role);

      /* ================= STORE AUTH ================= */
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("role", res.data.role);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccess(true);

      /* ================= ROLE BASED REDIRECT ================= */
      setTimeout(() => {
        if (res.data.role === "STUDENT") {
          navigate("/student/dashboard", { replace: true });
        } else if (res.data.role === "FACULTY") {
          navigate("/faculty/dashboard", { replace: true });
        } else if (res.data.role === "ADMIN") {
          navigate("/admin/dashboard", { replace: true });
        }
      }, 900);

    } catch (err) {
      triggerShake(err.response?.data?.message || "Invalid OTP");
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
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
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-blue-900/70"></div>

      {/* LOADER */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div
        className={`relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden ${shake ? "animate-shake" : ""
          }`}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-center">
          <img src={logo} alt="BIT" className="mx-auto h-14 mb-3" />
          <h1 className="text-white text-xl font-bold">BIP OD Portal</h1>
          <p className="text-blue-200 text-sm">Secure OTP Login</p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          {step === 1 && (
            <>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                onClick={sendOTP}
                className="w-full bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
              >
                Send OTP
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
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                ))}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {canResend ? "Didn't get OTP?" : `Resend in ${seconds}s`}
                </span>
                <button
                  onClick={resendOTP}
                  disabled={!canResend}
                  className={`font-semibold ${canResend ? "text-blue-700 dark:text-blue-400" : "text-gray-400"
                    }`}
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={() => verifyOTP(otp.join(""))}
                disabled={otp.join("").length !== 6}
                className={`w-full mt-4 py-3 rounded-lg font-semibold
                  ${otp.join("").length === 6
                    ? "bg-green-700 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Verify & Login
              </button>
            </>
          )}

          {error && <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>}

          {success && (
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl">
                ✓
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
