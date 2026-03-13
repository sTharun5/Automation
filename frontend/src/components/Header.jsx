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
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-white/10 dark:border-slate-800/50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Left: Branding */}
            <div
              onClick={handleDashboardClick}
              className="flex items-center gap-4 min-w-0 cursor-pointer group"
            >
              <div className="relative flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl shadow-indigo-500/5 overflow-hidden transition-all duration-500 group-hover:scale-110 group-active:scale-95">
                <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
                <img src={logo} alt="BIT" className="relative h-[75%] w-[75%] object-contain" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-400">
                    Neural
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mt-1">
                  Smart OD
                </h1>
              </div>
            </div>

            {/* Right: Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                <NotificationBell />
                
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/50 mx-1"></div>

                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 dark:text-slate-400 transition-all duration-300 shadow-sm hover:shadow-indigo-500/10"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 pr-4 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                      {user.name?.split(' ')[0]}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {role === 'ADMIN' ? 'SYS_ADMIN' : role}
                    </p>
                  </div>
                  <div className={`p-1 rounded-lg bg-slate-50 dark:bg-slate-800 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>

                {open && (
                  <div className="absolute right-0 mt-4 w-72 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                    <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                            {user.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-1 tracking-widest">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <button
                        onClick={() => { setOpen(false); navigate("/settings"); }}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                          <Settings className="w-5 h-5" />
                        </div>
                        Kernel Settings
                      </button>
                      
                      {role !== "ADMIN" && (
                        <button
                          onClick={() => { setOpen(false); navigate("/help"); }}
                          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-all">
                            <HelpCircle className="w-5 h-5" />
                          </div>
                          Support Node
                        </button>
                      )}

                      <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4 my-2"></div>

                      <button
                        onClick={() => { setOpen(false); setShowLogout(true); }}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all font-black uppercase text-[10px] tracking-widest group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400 group-hover:text-rose-600 transition-all">
                          <LogOut className="w-5 h-5" />
                        </div>
                        Terminate Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-4">
              <NotificationBell />
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all shadow-sm"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.3)] animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Portal</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Navigation Unit</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* User Section */}
              <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                <div className="relative inline-block mb-4">
                  <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-2xl rotate-6">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{user.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{role}</p>
                <div className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate border border-slate-100 dark:border-slate-700">
                  {user.email}
                </div>
              </div>

              {/* Links */}
              <nav className="space-y-4">
                <QuickLink icon={<Home />} label="Control Center" onClick={handleDashboardClick} active />
                <QuickLink icon={<Bell />} label="Transmissions" onClick={() => { navigate("/notifications"); setMobileMenuOpen(false); }} />
                <QuickLink icon={<HelpCircle />} label="Tactical Support" onClick={() => { navigate("/help"); setMobileMenuOpen(false); }} />
                <QuickLink icon={<Settings />} label="Core Settings" onClick={() => { navigate("/settings"); setMobileMenuOpen(false); }} />
              </nav>

              <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

              {/* Theme Selector */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Ambient Mode</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { if(theme === 'dark') toggleTheme(); }}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'bg-indigo-600 text-white border-indigo-600 border-indigo-500 shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-transparent'}`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Day</span>
                  </button>
                  <button
                    onClick={() => { if(theme === 'light') toggleTheme(); }}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-transparent'}`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Night</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowLogout(true); }}
                className="w-full flex items-center justify-center gap-4 py-5 bg-rose-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Terminate Link
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

function QuickLink({ icon, label, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-black uppercase text-[10px] tracking-widest group active:scale-[0.98] ${
        active 
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
        active ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'
      }`}>
        {Object.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      {label}
    </button>
  );
}
