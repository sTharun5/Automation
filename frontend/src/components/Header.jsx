import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/bit-logo.jpg";
import NotificationBell from "./NotificationBell";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

export default function Header() {
  const student = JSON.parse(localStorage.getItem("user")); // ✅ FIX
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const openHelp = () => {
    alert(
      `SMART OD HELP\n
• Login using college email OTP
• OD only for placed students
• Internship OD max 60 days
• Upload correct proof
• Contact coordinator for support`
    );
  };

  if (!student) return null; // 🛡️ safety

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900 shadow-md">
        <div className="flex items-center justify-between px-8 py-4">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="BIT" className="h-10" />
            <div>
              <h1 className="text-lg font-bold text-white">
                SMART OD PORTAL
              </h1>
              <p className="text-xs text-slate-300">
                Bannari Amman Institute of Technology
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-5">

            <NotificationBell />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-xl text-white hover:scale-110 transition"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {student.name.charAt(0)}
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">
                    {student.name}
                  </p>
                  <p className="text-xs text-slate-300">
                    {student.rollNo}
                  </p>
                </div>
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-60 bg-slate-800 rounded-xl shadow-xl border border-white/10 animate-fadeIn">

                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-semibold text-white">
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-300">
                      {student.rollNo}
                    </p>
                  </div>

                  <button
                    onClick={openHelp}
                    className="w-full px-4 py-3 text-left text-white hover:bg-slate-700"
                  >
                    ❓ Help & Support
                  </button>

                  <div className="h-px bg-slate-700 mx-4" />

                  <button
                    onClick={() => setShowLogout(true)}
                    className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 hover:text-red-400"
                  >
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ConfirmLogoutModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
