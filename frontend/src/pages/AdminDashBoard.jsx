import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileCard from "../components/ProfileCard";
import ActionCard from "../components/ActionCard";
import ConfirmationModal from "../components/ConfirmationModal";
import CalendarManagementModal from "../components/CalendarManagementModal";
import PlacementMapWidget from "../components/PlacementMapWidget";
import {
  Calendar,
  Users,
  BarChart3,
  Loader2,
  GraduationCap,
  Building2,
  ShieldAlert,
  CalendarCheck,
  Globe,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Activity,
  Terminal,
  Settings
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await api.get("/admin/export-ods", {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'smart-od-records.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Failed to export Excel", error);
    } finally {
      setExporting(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false,
    remarks: ""
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Header />

      <main className="flex-1 px-4 sm:px-6 md:px-12 py-12 md:py-24 max-w-[1700px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 items-start">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-16 md:space-y-32">
            
            {/* System Command Center Welcome */}
            <div className="relative group p-12 md:p-20 rounded-[4rem] bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-indigo-500/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[150px] -mr-48 -mt-48 animate-pulse group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] -ml-32 -mb-32"></div>

                <div className="relative z-10 space-y-12">
                    <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-10">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
                            <div className="relative shrink-0">
                                <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-28 h-28 rounded-[2.8rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 p-1 transform -rotate-12 group-hover:rotate-0 transition-all duration-700 shadow-2xl shadow-indigo-500/40">
                                    <div className="w-full h-full rounded-[2.5rem] bg-slate-900 flex items-center justify-center">
                                        <ShieldCheck className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-[1000] text-white uppercase tracking-tighter leading-none italic">
                                    System Command
                                </h1>
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <p className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                                        <Terminal className="w-3 h-3" /> Root Domain
                                    </p>
                                    <span className="w-1 h-1 rounded-full bg-slate-700 hidden md:block"></span>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Operator: <span className="text-white">{user?.name}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
                            <button
                                onClick={() => setShowCalendarModal(true)}
                                className="group px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] transition-all flex items-center gap-4 backdrop-blur-xl"
                            >
                                <Calendar className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" /> 
                                Sector Calendar
                            </button>
                            <button
                                onClick={handleExportExcel}
                                disabled={exporting}
                                className="px-10 py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 shadow-2xl hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                            >
                                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                                {exporting ? 'Syncing Archives...' : 'Export Archives'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t-2 border-white/5">
                        {[
                            { label: "Sync Status", value: "Optimal", color: "emerald", icon: <Zap /> },
                            { label: "Neural Load", value: "2.4ms", color: "indigo", icon: <Activity /> },
                            { label: "Security", value: "Level-1", color: "rose", icon: <ShieldCheck /> }
                        ].map((stat, i) => (
                            <div key={i} className="group/stat flex items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all duration-500">
                                <div className={`w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 text-${stat.color}-400 flex items-center justify-center group-hover/stat:rotate-12 transition-all duration-500 shadow-inner`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                                    <p className="text-lg font-[1000] text-white uppercase tracking-tight italic">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Core Domain Operations */}
            <section className="space-y-16">
               <div className="flex items-center gap-6 px-4">
                  <div className="h-0.5 w-16 bg-indigo-500 rounded-full"></div>
                  <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] italic">
                    Core Domain Matrix
                  </h2>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    {[
                        { title: "Faculty Core", desc: "Manage personnel and academic liaisons.", btn: "Personnel Registry", color: "indigo", icon: <GraduationCap className="w-8 h-8" />, path: "/admin/faculty" },
                        { title: "Student Node", desc: "Monitor all synchronized student entities.", btn: "Entity Directory", color: "blue", icon: <Users className="w-8 h-8" />, path: "/admin/students" },
                        { title: "Company Relay", desc: "Verify industrial sector authorization.", btn: "Auth Protocol", color: "amber", icon: <Building2 className="w-8 h-8" />, path: "/admin/companies" },
                        { title: "OD Protocol", desc: "Audit and neutralize student OD streams.", btn: "Audit Interface", color: "rose", icon: <ShieldAlert className="w-8 h-8" />, path: "/admin/manage-ods" }
                    ].map((card, i) => (
                        <button 
                            key={i}
                            onClick={() => navigate(card.path)}
                            className="group relative p-10 rounded-[3.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-500 text-left overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all"></div>
                            <div className="relative z-10 space-y-8">
                                <div className={`w-16 h-16 rounded-2xl bg-${card.color}-500/10 dark:bg-white/5 border border-${card.color}-500/20 flex items-center justify-center text-${card.color}-500 dark:text-white group-hover:rotate-12 transition-all duration-500`}>
                                    {card.icon}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">{card.title}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.desc}</p>
                                </div>
                                <div className="pt-4 flex items-center justify-between">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-${card.color}-500 bg-${card.color}-500/10 px-4 py-2 rounded-xl`}>{card.btn}</span>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
 
            {/* Advanced Systems Section */}
            <section className="space-y-16 pb-20">
               <div className="flex items-center gap-6 px-4">
                  <div className="h-0.5 w-16 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] italic">
                    Advanced Neural Systems
                  </h2>
                </div>
 
                <div className="grid grid-cols-1 gap-12">
                     <div
                        onClick={() => navigate("/admin/internal-events")}
                        className="group relative p-12 lg:p-20 rounded-[4.5rem] bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-indigo-500/20 overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-700"
                    >
                        {/* Glow effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="space-y-10 text-center md:text-left">
                                <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Priority Relay Alpha</span>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-5xl md:text-6xl font-[1000] text-white uppercase tracking-tighter leading-none italic">Internal Events Hub</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-xl">
                                        Orchestrate auto-approved institutional events and broadcast live spatial verification codes with integrated attendance tracking.
                                    </p>
                                </div>
 
                                <div className="flex items-center justify-center md:justify-start gap-3 text-indigo-400">
                                    <CalendarCheck className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">Live Broadcast Active</span>
                                </div>
                            </div>
 
                            <div className="relative transform group-hover:scale-110 transition-transform duration-700 p-10 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">
                                <ChevronRight className="w-16 h-16 text-white opacity-40 group-hover:opacity-100 group-hover:translate-x-3 transition-all" />
                            </div>
                        </div>
                    </div>
 
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-12 md:p-20 rounded-[4.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-500/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-indigo-500/10"></div>
                        
                        <div className="relative z-10 space-y-16">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.8rem] bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Globe className="w-10 h-10" />
                                        </div>
                                        Placement Analytics
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-20">Global Synchronization Status</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 self-start md:self-center">
                                    <Settings className="w-6 h-6 text-slate-400 animate-spin-slow" />
                                </div>
                            </div>
                            
                            <div className="rounded-[3.5rem] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-2xl group/map">
                                <PlacementMapWidget />
                            </div>
 
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { label: "Total Placed", value: "842", sub: "Verified Entities", icon: <Users className="w-4 h-4" /> },
                                    { label: "Active Sector", value: "Tech Hub", sub: "Dominant Vector", icon: <Zap className="w-4 h-4" /> },
                                    { label: "Neural Match", value: "98.2%", sub: "Accuracy Index", icon: <Activity className="w-4 h-4" /> }
                                ].map((stat, i) => (
                                    <div key={i} className="group/grid p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all duration-500">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                            <div className="text-indigo-500 opacity-40 group-hover/grid:rotate-12 transition-transform">
                                                {stat.icon}
                                            </div>
                                        </div>
                                        <p className="text-4xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">{stat.value}</p>
                                        <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-2/3 group-hover:w-full transition-all duration-1000"></div>
                                        </div>
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-4 italic">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4 space-y-12 lg:sticky lg:top-32">
             <div className="animate-in slide-in-from-right-10 duration-700">
                <ProfileCard student={user} />
             </div>
 
             <div className="p-12 rounded-[4rem] bg-slate-900 border-2 border-slate-800 text-white shadow-2xl shadow-indigo-500/10 animate-in slide-in-from-right-10 delay-300 duration-1000 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/15 transition-all"></div>
                
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h4 className="text-[10px] font-[1000] uppercase tracking-[0.5em] text-slate-500 italic">System Health</h4>
                </div>
                
                <div className="space-y-8 relative z-10">
                    {[
                        { name: "Node Primary", status: "Active", delay: "0", color: "emerald" },
                        { name: "DB Clusters", status: "Synced", delay: "150", color: "emerald" },
                        { name: "Auth Sockets", status: "Secured", delay: "300", color: "blue" },
                        { name: "Notification Relay", status: "Active", delay: "450", color: "indigo" }
                    ].map((svc, i) => (
                        <div key={i} className="flex items-center justify-between group/svc" style={{ animationDelay: `${svc.delay}ms` }}>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight group-hover/svc:text-white transition-colors">{svc.name}</span>
                                <div className="h-0.5 w-0 group-hover:w-full bg-indigo-500 transition-all duration-500"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[8px] font-black uppercase tracking-widest text-${svc.color}-500 opacity-80 group-hover:opacity-100 transition-opacity`}>{svc.status}</span>
                                <div className={`h-2 w-2 rounded-full bg-${svc.color}-500 shadow-[0_0_10px_rgba(var(--tw-color-${svc.color}-500),0.5)] animate-pulse`} />
                            </div>
                        </div>
                    ))}
                </div>
 
                <div className="mt-12 pt-10 border-t border-white/5">
                    <button
                        onClick={() => navigate("/admin/assign-mentor")}
                        className="group/btn w-full p-8 rounded-[2.5rem] bg-white text-slate-950 hover:bg-indigo-500 hover:text-white transition-all duration-500 shadow-2xl relative overflow-hidden"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Liaison Protocol</p>
                                <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mt-1">Assign Mentors</p>
                            </div>
                            <Users className="w-6 h-6 transform group-hover/btn:scale-125 transition-all duration-500" />
                        </div>
                    </button>
                </div>
             </div>
          </aside>

        </div>
      </main>

      <ConfirmationModal
        {...confirmModal}
        inputValue={confirmModal.remarks}
        onInputChange={(val) => setConfirmModal({ ...confirmModal, remarks: val })}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
      <CalendarManagementModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
      <Footer />
    </div>
  );
}
