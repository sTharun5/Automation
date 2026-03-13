import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

      /* ================= STORE AUTH ================= */
      sessionStorage.setItem("role", res.data.role);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.setItem("token", res.data.token);

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
      const errorMsg = err.response?.data?.message || "Invalid OTP";
      triggerShake(errorMsg);
      setOtp(Array(6).fill(""));

      if (errorMsg.includes("Maximum attempts reached")) {
        // Kick them back to email entry step after a delay to read the message
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-600/5 rounded-full blur-[150px]"></div>

      <div className="w-full max-w-[440px] relative z-10 transition-all duration-500">
        <div className={`
          bg-white/5 backdrop-blur-3xl 
          border border-white/10 
          rounded-[2.5rem] 
          shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] 
          overflow-hidden 
          transition-all duration-700
          ${shake ? "animate-shake ring-2 ring-rose-500/50" : ""}
          ${success ? "scale-95 opacity-0 pointer-events-none" : "scale-100 opacity-100"}
        `}>
          {/* Top Banner */}
          <div className="relative h-48 bg-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
               <div className="grid grid-cols-8 gap-1 opacity-20">
                  {Array(64).fill(0).map((_, i) => (
                    <div key={i} className="h-1 bg-white/20 rounded-full"></div>
                  ))}
               </div>
            </div>
            
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500 p-2">
                <img src={logo} alt="BIT" className="w-full h-full object-contain" />
              </div>
            </div>

            <h1 className="relative text-2xl font-black text-white uppercase tracking-[0.2em]">Smart OD</h1>
            <p className="relative text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] mt-2">Neural Access Terminal</p>
          </div>

          <div className="p-8 sm:p-10 space-y-8">
            {step === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="text-center space-y-2">
                   <h2 className="text-lg font-black text-white uppercase tracking-tight">Identity Authentication</h2>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">Enter your institutional vector for synchronization</p>
                </div>

                <div className="space-y-6">
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-0 group-focus-within:opacity-25 transition duration-500"></div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="email"
                        placeholder="institutional@email.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-2xl focus:outline-none focus:ring-0 text-white font-bold placeholder:text-slate-600 focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={sendOTP}
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-2xl p-[1px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
                    <div className="relative flex items-center justify-center gap-3 bg-slate-900 px-8 py-4 rounded-[15px] group-hover:bg-transparent transition-all">
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                          <span className="text-white">Initialize Link</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                   <h2 className="text-lg font-black text-white uppercase tracking-tight">Verification Required</h2>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">Transmit the 6-digit decryption code</p>
                </div>

                <div className="space-y-8" onPaste={handleOtpPaste}>
                  <div className="flex justify-between gap-3">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                        className={`
                          w-11 h-14 sm:w-14 sm:h-16 
                          text-center text-xl font-black 
                          bg-slate-900/50 border border-white/10 
                          rounded-2xl text-white 
                          focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 
                          transition-all 
                          ${digit ? "border-indigo-500/40 bg-indigo-500/5" : ""}
                        `}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest px-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Timer className="w-3.5 h-3.5" />
                      {canResend ? "Window Closed" : `Resend in ${seconds}s`}
                    </div>
                    <button
                      onClick={resendOTP}
                      disabled={!canResend}
                      className={`transition-colors ${canResend ? "text-indigo-400 hover:text-indigo-300" : "text-slate-700 cursor-not-allowed"}`}
                    >
                      Resend Frequency
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => verifyOTP(otp.join(""))}
                      disabled={loading || otp.join("").length !== 6}
                      className={`
                        group relative w-full overflow-hidden rounded-2xl p-[1px] font-black uppercase tracking-[0.2em] transition-all
                        ${otp.join("").length === 6 ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-50 grayscale"}
                      `}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
                      <div className="relative flex items-center justify-center gap-3 bg-slate-900 px-8 py-4 rounded-[15px] group-hover:bg-transparent transition-all">
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                            <span className="text-white">Verify Pattern</span>
                          </>
                        )}
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setStep(1)}
                      className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Return to Source
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></div>
                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
              </div>
            )}
          </div>

          {/* Footer Text */}
          <div className="px-8 pb-8 text-center">
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Institutional Secure Gateway v4.0</p>
          </div>
        </div>

        {/* Success State Overlay */}
        {success && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
             <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-[60px] opacity-40 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl rotate-12 animate-bounce-slow">
                   <CheckCircle2 className="w-12 h-12" />
                </div>
             </div>
             <div className="mt-8 text-center space-y-2">
                <p className="text-xl font-black text-white uppercase tracking-[0.2em]">Authorized</p>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.4em]">Synchronizing Core Systems...</p>
             </div>
          </div>
        )}
      </div>

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(12deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
