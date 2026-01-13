import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/bit-logo.jpg";
import bg from "../assets/campus.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = email, 2 = otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError("");
    if (!otp) {
      setError("Enter OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/verify-otp", {
        email,
        otp
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("student", JSON.stringify(res.data.student));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-blue-900/70"></div>

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden animate-fadeInUp">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-center">
          <img src={logo} alt="BIT" className="mx-auto h-14 mb-3" />
          <h1 className="text-white text-xl font-bold">
            BIP OD Portal
          </h1>
          <p className="text-blue-200 text-sm">
            Secure OTP Login
          </p>
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
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6 digit OTP"
                  className="w-full mt-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none tracking-widest text-center"
                />
              </div>

              <button
                onClick={verifyOTP}
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition transform hover:scale-105"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </>
          )}

          {error && (
            <p className="text-red-600 text-sm animate-shake text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
