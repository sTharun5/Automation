import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/bit-logo.jpg";
import NotificationBell from "./NotificationBell";
import ConfirmLogoutModal from "./ConfirmLogoutModal";
import {
  Sun,
  Moon,
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Home,
  Bell,
  Settings,
  Sparkles
} from "lucide-react";

export default function Header() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const role = sessionStorage.getItem("role");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const handleDashboardClick = () => {
    if (role === "STUDENT") navigate("/student/dashboard");
    else if (role === "FACULTY") navigate("/faculty/dashboard");
    else if (role === "ADMIN") navigate("/admin/dashboard");
    setMobileMenuOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Left: Branding */}
            <div
              onClick={handleDashboardClick}
              className="flex items-center gap-3 min-w-0 cursor-pointer group"
            >
              <div className="flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transform transition-all group-hover:scale-105 group-hover:shadow-indigo-500/10">
                <img src={logo} alt="BIT" className="h-[80%] w-[80%] object-contain" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hidden sm:block">
                    Portal
                  </p>
                  <Sparkles className="w-3 h-3 text-yellow-500 hidden sm:block animate-pulse" />
                </div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 dark:from-white dark:via-blue-100 dark:to-indigo-200">
                  SMART OD
                </h1>
              </div>
            </div>

            {/* Right: Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4 pl-6 border-l border-slate-200 dark:border-slate-700 ml-6">
              <NotificationBell />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-3 rounded-full md:rounded-xl py-1 md:py-2 pl-1 md:pl-2 pr-1 md:pr-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-slate-100 dark:border-slate-700 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                      {user.name?.split(' ')[0]}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight uppercase tracking-wider">
                      {role}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 hidden lg:block ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl overflow-hidden animate-slideUp z-50 ring-1 ring-black/5">
                    <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm ${role === 'ADMIN' ? 'bg-red-500 text-white shadow-red-500/20' :
                          role === 'FACULTY' ? 'bg-blue-600 text-white shadow-blue-600/20' :
                            'bg-emerald-600 text-white shadow-emerald-600/20'
                          }`}>
                          {role}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {role !== "ADMIN" && (
                        <button
                          onClick={() => { setOpen(false); navigate("/help"); }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl flex items-center gap-3 transition-all group active:scale-[0.98]"
                        >
                          <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all" />
                          Help & Support
                        </button>
                      )}
                      <button
                        onClick={() => { setOpen(false); navigate("/settings"); }} // Assumption settings exists
                        className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl flex items-center gap-3 transition-all group active:scale-[0.98]"
                      >
                        <Settings className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all" />
                        Account Settings
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-700/50 my-1 mx-2" />
                      <button
                        onClick={() => { setOpen(false); setShowLogout(true); }}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )  }
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-3">
              <NotificationBell />

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-slideInRight">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-lg text-slate-900 dark:text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* User Info */}
              <div className="flex flex-col gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{role}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">{user.email}</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                <button
                  onClick={handleDashboardClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium active:scale-95 transition-all"
                >
                  <Home className="w-5 h-5" /> Dashboard
                </button>
                {role !== "ADMIN" && (
                  <button
                    onClick={() => { navigate("/help"); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                  >
                    <HelpCircle className="w-5 h-5" /> Help & Support
                  </button>
                )}
                <button
                  onClick={() => { navigate("/notifications"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <Bell className="w-5 h-5" /> Notifications
                </button>
              </nav>

              {/* Theme Toggle Mobile */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Appearance</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                  >
                    <span className="text-lg">{theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{theme === "dark" ? "Dark" : "Light"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logout Mobile */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowLogout(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl active:scale-95 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

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
