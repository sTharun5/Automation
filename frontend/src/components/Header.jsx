import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/bit-logo.jpg";
import NotificationBell from "./NotificationBell";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

export default function Header() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const role = sessionStorage.getItem("role");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[4.5rem]">

            {/* Left: Institute branding */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                <img src={logo} alt="BIT" className="h-10 w-10 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                  Bannari Amman Institute of Technology
                </p>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5 tracking-tight">
                  SMART OD Portal
                </h1>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
              <NotificationBell />

              {/* Theme toggle — pill */}
              <div className="hidden sm:flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
                <button
                  onClick={() => theme !== "light" && toggleTheme()}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${theme === "light"
                    ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  aria-label="Light mode"
                  title="Light mode"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                </button>
                <button
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${theme === "dark"
                    ? "bg-slate-700 text-indigo-300 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  aria-label="Dark mode"
                  title="Dark mode"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                </button>
              </div>
              <button
                onClick={toggleTheme}
                className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <span className="text-lg">☀️</span> : <span className="text-lg">🌙</span>}
              </button>

              {/* Profile */}
              <div className="relative ml-2" ref={profileRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-3 rounded-lg py-2 pl-2 pr-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  aria-expanded={open}
                  aria-haspopup="true"
                >
                  <div className="h-10 w-10 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="hidden md:block text-right max-w-[160px]">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5 font-medium">
                      {role === "STUDENT" ? user.rollNo : role === "FACULTY" ? user.facultyId : "Administrator"}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden animate-fadeIn z-50">
                    <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          role === 'FACULTY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                          {role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      {role !== 'ADMIN' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          {role === 'STUDENT' ? 'Roll No: ' : 'Faculty ID: '}{role === 'STUDENT' ? user.rollNo : user.facultyId}
                        </p>
                      )}
                    </div>
                    <div className="py-1">
                      {role !== "ADMIN" && (
                        <button
                          onClick={() => { setOpen(false); navigate("/help"); }}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                        >
                          <span className="text-slate-400" aria-hidden>❓</span>
                          Help & Support
                        </button>
                      )}
                      <button
                        onClick={() => { setOpen(false); setShowLogout(true); }}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                      >
                        <span aria-hidden>🚪</span>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <ConfirmLogoutModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={() => {
          sessionStorage.clear();
          navigate("/", { replace: true });
        }}
      />
    </>
  );
}
