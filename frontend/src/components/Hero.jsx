import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext"; // ✅ Import Hook
import {
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Plus,
  Sparkles,
  FileText,
  ChevronRight,
  Clock,
  Calendar,
  X
} from "lucide-react";

export default function Hero({ student, dashboardData }) {
  const navigate = useNavigate();
  const { openChat } = useChat(); // ✅ Use Hook
  const name = student?.name?.split(" ")[0] || "Student";
  const [showApplyModal, setShowApplyModal] = useState(false);

  if (!student) return null;

  return (
    <section className="animate-fadeIn space-y-12">
      <div className="relative p-8 sm:p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-indigo-500/10 transition-colors animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
               <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">Session Active: L3_ENCRYPT</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9]">
                Vector <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">{name}</span>
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed opacity-70">
                Strategic oversight of institutional mobility and synchronization protocols.
              </p>
            </div>

            {/* Mentor Info */}
            <div className="inline-flex items-center gap-6 p-2 pr-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Command Mentor</span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[180px]">
                  {dashboardData?.student?.mentor?.name || "Unassigned"}
                </span>
              </div>
              {dashboardData?.student?.mentor && (
                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
              )}
              {dashboardData?.student?.mentor && (
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vector ID</span>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">
                    {dashboardData.student.mentor.email.split('@')[0]}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 relative group/mockup">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-all"></div>
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-[3rem] bg-gradient-to-br from-slate-900 to-black border-4 border-slate-800 p-8 flex flex-col justify-between shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-700">
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl">
                     <Activity className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Security State</p>
                    <p className="text-xs font-black text-white uppercase tracking-tight">Hardened</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">OD_SYNC</h3>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">LIVE</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 w-[75%]"></div>
                  </div>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">ID-PROTOCOL-ALPHA-V.4.2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          icon={<BarChart3 />} 
          label="Placement Status" 
          value={dashboardData?.placement?.status === "NIP" ? "NON_INT" : dashboardData?.placement?.totalOffers || "0"} 
          subLabel={dashboardData?.placement?.status === "NIP" ? "PROTOCOL: EXEMPT" : "ACTIVE OFFERS"} 
          color="blue"
        />
        <StatCard 
          icon={<Sparkles />} 
          label="Operational State" 
          value={dashboardData?.odStats?.activeOD ? "DEPLOYED" : "RESERVE"} 
          subLabel={dashboardData?.odStats?.activeOD ? dashboardData.odStats.activeOD.type : "AWAITING MISSION"} 
          color="indigo"
        />
        <StatCard 
          icon={<Clock />} 
          label="Temporal Credit" 
          value={dashboardData?.odStats?.usedDays || "0"} 
          subLabel="CYCLES EXPENDED" 
          color="purple"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-10 pt-4">
        <button
          onClick={() => setShowApplyModal(true)}
          className="group relative w-full sm:w-auto overflow-hidden rounded-[2.5rem] p-[2px] font-[1000] uppercase tracking-[0.3em] text-[10px] italic transition-all active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 animate-shimmer"></div>
          <div className="relative flex items-center justify-center gap-4 bg-slate-900 px-14 py-7 rounded-[2.4rem] text-white">
            Access Command Interface <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          </div>
        </button>
        
        <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
           <div className="h-0.5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
           Neural Uplink Active
           <div className="h-0.5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
        </div>
      </div>

      {/* Apply Mode Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowApplyModal(false)}></div>
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Directives</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Interface Module</p>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <button
                onClick={() => { setShowApplyModal(false); openChat(); }}
                className="w-full flex items-center gap-6 p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-600 hover:border-indigo-600 group transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-tight group-hover:text-white">Neural Assistant</h4>
                  <p className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-500 uppercase tracking-widest mt-1 group-hover:text-indigo-200">Voice & Text Directive Control</p>
                </div>
                <div className="ml-auto w-10 h-10 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-400 group-hover:text-white group-hover:border-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>

              <button
                onClick={() => { setShowApplyModal(false); navigate("/apply-od"); }}
                className="w-full flex items-center gap-6 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-900 group transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-slate-600" />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-white">Manual Terminal</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-400">Step-by-Step Parameter Input</p>
                </div>
                <div className="ml-auto w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ icon, label, value, subLabel, color }) {
  const colors = {
    blue: "from-blue-600 to-indigo-600 text-blue-600 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800",
    emerald: "from-emerald-600 to-teal-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800",
    violet: "from-violet-600 to-purple-600 text-violet-600 bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800"
  };

  return (
    <div className={`relative p-8 rounded-[3rem] border-2 bg-white dark:bg-slate-950 ${colors[color].split(' ').slice(4).join(' ')} shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 group overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-10`}></div>
      
      <div className="relative z-10 space-y-6">
        <div className={`w-14 h-14 rounded-2xl ${colors[color].split(' ').slice(1,4).join(' ')} flex items-center justify-center text-current shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          {Object.cloneElement(icon, { className: "w-7 h-7" })}
        </div>
        
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{label}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{value}</h3>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${colors[color].split(' ')[2]}`}>{subLabel}</p>
        </div>
      </div>
    </div>
  );
}
