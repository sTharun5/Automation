import { Github, Twitter, Linkedin, Mail, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 pt-16 pb-8 transition-colors overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Smart OD</span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight opacity-70">
              Next-generation institutional mobility and authorization protocol for the modern academic landscape.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-sm">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Infrastructure */}
          <div className="text-center md:text-left">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-1">Infrastructure</h4>
            <ul className="space-y-4">
              {["Control Dashboard", "Neural Verification", "Dossier Archives", "System Health"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs font-black text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div className="text-center md:text-left">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-1">Compliance</h4>
            <ul className="space-y-4">
              {["Data Privacy Node", "Protocol Manual", "Terms of Link", "Security Audit"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs font-black text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center md:text-left">
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Core Systems Online</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-normal mb-4 tracking-tight">
              Bannari Amman Institute of Technology Global Uplink v4.2.0-stable
            </p>
            <button className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 transition-all shadow-sm">
              View Node Status
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} BIT SYSTEMS INC. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-8">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck className="w-3 h-3 text-indigo-500" />
               SECURE L3 ENCRYPTION
            </span>
            <div className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800"></div>
               <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
