import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/bit-logo.jpg";
import bg from "../assets/campus.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!email) {
      setError("Enter your college email");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("student", JSON.stringify(res.data.student));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-blue-900/70"></div>

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[440px] animate-fadeInUp overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-center">
          <img src={logo} alt="BIT" className="mx-auto h-14 mb-3" />
          <h1 className="text-white text-xl font-bold">
            Bannari Amman Institute of Technology
          </h1>
          <p className="text-blue-200 text-sm">
            Smart OD Approval Portal
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          <div>
            <label className="text-sm font-semibold text-gray-700">
              College Email
            </label>
            <input
              type="email"
              placeholder="tharun.ad22@bitsathy.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-700 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm animate-shake">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition transform hover:scale-105"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>

          <p className="text-xs text-center text-gray-500">
            Access limited to official BIT accounts only
          </p>
        </div>
      </div>
    </div>
  );
}
