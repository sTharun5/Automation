import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/bit-logo.jpg";
import NotificationBell from "./NotificationBell";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

export default function Header() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-md transition-colors">
        <div className="flex items-center justify-between px-8 py-4">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="BIT" className="h-10" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                SMART OD PORTAL
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Bannari Amman Institute of Technology
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-5">

            <NotificationBell />

            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="text-xl text-slate-900 dark:text-white"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* PROFILE */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0)}
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {user.rollNo}
                  </p>
                </div>
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-white/10 animate-fadeInUp">

                  <div className="px-4 py-3 border-b dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {user.email}
                    </p>
                  </div>

                  <button className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700">
                    ❓ Help & Support
                  </button>

                  <button
                    onClick={() => setShowLogout(true)}
                    className="w-full px-4 py-3 text-left text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700"
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
        onConfirm={() => {
          localStorage.clear();
          navigate("/", { replace: true });
        }}
      />
    </>
  );
}



