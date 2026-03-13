import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileCard from "../components/ProfileCard";
import GatePassScannerModal from "../components/GatePassScannerModal";
import ActionCard from "../components/ActionCard";
import {
  QrCode,
  Calendar,
  CheckCircle,
  FileEdit,
  FileText,
  Users,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Zap,
  ShieldCheck
} from "lucide-react";

export default function FacultyDashboard() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const navigate = useNavigate();
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScannerModal, setShowScannerModal] = useState(false);

  useEffect(() => {
    const fetchMentees = async () => {
      try {
        const res = await api.get("/faculty/mentees");
        setMentees(res.data);
      } catch (err) {
        console.error("Fetch mentees error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentees();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center gap-6 transition-colors font-black uppercase tracking-widest">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-4 bg-indigo-500/10 rounded-full animate-pulse blur-sm"></div>
        </div>
        <div className="text-center space-y-2">
            <p className="text-sm">Accessing Faculty Core</p>
            <p className="text-[10px] text-slate-400 opacity-50">Syncing Mentor Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 px-4 sm:px-6 md:px-12 py-10 md:py-20 max-w-[1600px] mx-auto w-full overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-start">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-12 md:space-y-20">
            
            {/* Faculty Welcome Section */}
            <div className="relative group p-10 md:p-16 rounded-[4rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-500 hover:border-indigo-500/20">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-indigo-500/10 transition-colors animate-pulse"></div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                  <div className="relative group/avatar">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover/avatar:opacity-40 transition-opacity"></div>
                    <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-600 p-1 transform -rotate-3 group-hover/avatar:rotate-0 transition-transform duration-500 shadow-xl">
                       <div className="w-full h-full rounded-[1.8rem] bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                          <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            {user?.name?.charAt(0)}
                          </span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                        Faculty Operations
                      </h1>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-2">
                        Command Personnel · {user?.name}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-400">
                           Sector: {user?.department}
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                           <ShieldCheck className="w-3 h-3" /> Secure Link Active
                        </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 group/stat">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover/stat:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mentor Roster</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{mentees.length} Mentees</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 group/stat">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30 group-hover/stat:scale-110 transition-transform">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Proxies</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Live Monitor</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Interface */}
            <section className="space-y-10">
              <div className="flex items-center gap-4 px-4">
                <div className="h-0.5 w-12 bg-indigo-500 rounded-full"></div>
                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">
                  Interface Operations
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                <ActionCard 
                    title="Scan Pass"
                    description="Real-time spatial exit verification."
                    buttonText="Activate Scanner"
                    color="green"
                    icon={<QrCode />}
                    onClick={() => setShowScannerModal(true)}
                />
                
                <ActionCard 
                    title="Events"
                    description="Manage scheduled internal rosters."
                    buttonText="Open Ledger"
                    color="blue"
                    icon={<Calendar />}
                    onClick={() => navigate("/faculty/events")}
                />

                <ActionCard 
                    title="Verify"
                    description="Audit pending student transmissions."
                    buttonText="Initiate Audit"
                    color="indigo"
                    icon={<CheckCircle />}
                    onClick={() => navigate("/faculty/approvals")}
                />

                <ActionCard 
                    title="Matrix"
                    description="Update mentee placement status."
                    buttonText="Modify Sector"
                    color="rose"
                    icon={<FileEdit />}
                    onClick={() => navigate("/faculty/update-placement")}
                />

                <ActionCard 
                    title="Audit Hub"
                    description="Review post-activity dossiers."
                    buttonText="Sync Reports"
                    color="purple"
                    icon={<FileText />}
                    onClick={() => navigate("/faculty/reports")}
                />
              </div>
            </section>

            {/* Mentee Decoders */}
            <section className="space-y-10 pb-20">
               <div className="flex items-center gap-4 px-4">
                  <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">
                    Mentee Neural Directory
                  </h2>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden h-full flex flex-col transition-all">
                  <div className="px-10 py-8 border-b-2 border-slate-50 dark:border-slate-800 flex justify-between items-center">
                     <div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Roster</h2>
                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mt-1">Registry Synchronization</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 animate-pulse">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                        </div>
                     </div>
                  </div>

                  <div className="p-8 sm:p-10 custom-scrollbar max-h-[1000px] overflow-y-auto">
                    {mentees.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mentees.map((student) => (
                           <div
                            key={student.id}
                            onClick={() => navigate(`/faculty/mentee/${student.id}`)}
                            className="group relative p-8 bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-100 dark:border-slate-800/50 rounded-[2.5rem] hover:border-indigo-500/30 cursor-pointer transition-all hover:shadow-2xl hover:shadow-indigo-500/5 active:scale-[0.98] overflow-hidden"
                          >
                             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
                            
                            <div className="relative z-10 flex justify-between items-start mb-6">
                              <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-slate-300 dark:text-slate-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-lg transform -rotate-3 group-hover:rotate-0">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {student._count?.coordinatedEvents > 0 && (
                                  <span className="text-[8px] font-black px-3 py-1 rounded-lg bg-indigo-500 text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20">Coordinator</span>
                                )}
                                <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border-2 ${
                                    student.placement_status === "NIP" ? "bg-amber-500 text-white border-amber-500" :
                                    ((student.offers && student.offers.length > 0) || student.placement_status === "PLACED") ? "bg-emerald-500 text-white border-emerald-500" :
                                    "bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800"
                                } shadow-sm`}>
                                    {student.placement_status === "NIP" ? "NIP" : 
                                     (student.offers && student.offers.length > 0) || student.placement_status === "PLACED" ? "Placed" : "Unplaced"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="relative z-10 space-y-1">
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">{student.rollNo}</p>
                            </div>

                            <div className="relative z-10 pt-6 mt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] transform group-hover:translate-x-1 transition-transform">Access Dossier</span>
                                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center">
                        <div className="bg-slate-50 dark:bg-slate-950 w-24 h-24 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-8 animate-pulse">
                          <Users className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-40">Zero registry matches found</p>
                      </div>
                    )}
                  </div>
                </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4 space-y-12 sticky top-32">
             <div className="animate-fadeInRight">
                <ProfileCard student={user} />
             </div>

             <div className="p-10 rounded-[3.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group border-2 border-indigo-400 animate-fadeInRight animation-delay-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-1000"></div>
                
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100 opacity-80">Mentor Insights</h4>
                    </div>

                    <div className="space-y-2">
                        <div className="text-5xl font-black tracking-tighter leading-none">{mentees.length}</div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200">Total Synchronized Mentees</p>
                    </div>

                    <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest leading-relaxed">
                        Continuous monitoring active for all linked student sectors within the {user?.department} faculty node.
                    </p>

                    <button className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-95 transition-all">
                        Registry Analysis
                    </button>
                </div>
                
                <Users className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000" />
             </div>
          </aside>
        </div>
      </main>

      <Footer />

      <GatePassScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />
    </div>
  );
}
