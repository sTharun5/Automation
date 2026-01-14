import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/bit-logo.jpg";
import bg from "../assets/campus.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [step, setStep] = useState(1); // 1=email, 2=otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef([]);
  const navigate = useNavigate();

  /* ================= SEND OTP ================= */
  const sendOTP = async () => {
    setError("");
    if (!email) {
      setError("Enter your college email");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/send-otp", { email });
      setStep(2);
      setSeconds(60);
      setCanResend(false);
      setOtp(Array(6).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOTP = async () => {
    setError("");
    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) {
      triggerShake("Enter complete 6 digit OTP");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/verify-otp", { email, otp: finalOtp });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      triggerShake(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TIMER ================= */
  useEffect(() => {
    if (step !== 2 || seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, seconds]);

  useEffect(() => {
    if (seconds === 0) setCanResend(true);
  }, [seconds]);

  /* ================= OTP HANDLERS ================= */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1].focus();
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
      otpRefs.current[5].focus();
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
    if (!canResend) return;
    await sendOTP();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-blue-900/70"></div>

      <div
        className={`relative z-10 bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden animate-fadeInUp ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-center">
          <img src={logo} alt="BIT" className="mx-auto h-14 mb-3" />
          <h1 className="text-white text-xl font-bold">BIP OD Portal</h1>
          <p className="text-blue-200 text-sm">Secure OTP Login</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  College Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tharun.ad22@bitsathy.ac.in"
                  className="w-full mt-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-700 focus:outline-none"
                />
              </div>
              <button
                onClick={sendOTP}
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition transform hover:scale-105"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <label className="text-sm font-semibold text-gray-700">
                Enter OTP
              </label>

              <div className="flex justify-between gap-2 mt-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">
                  {canResend ? "Didn't get OTP?" : `Resend in ${seconds}s`}
                </span>
                <button
                  onClick={resendOTP}
                  disabled={!canResend}
                  className={`font-semibold ${
                    canResend ? "text-blue-700 hover:underline" : "text-gray-400"
                  }`}
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={verifyOTP}
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition transform hover:scale-105 mt-4"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </>
          )}

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          {success && (
            <div className="flex justify-center mt-2">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center animate-pop">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .animate-shake{animation:shake .45s}
        @keyframes pop {
          0%{transform:scale(.6);opacity:0}
          100%{transform:scale(1);opacity:1}
        }
        .animate-pop{animation:pop .4s ease-out}
      `}</style>
    </div>
  );
}
