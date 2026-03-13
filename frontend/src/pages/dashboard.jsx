// ... (imports remain the same as above)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ActionCard from "../components/ActionCard";
import ProfileCard from "../components/ProfileCard";
import ODAnalytics from "../components/ODAnalytics";
import ODCalendar from "../components/ODCalendar";
import InternshipReportModal from "../components/InternshipReportModal";
import AttendanceModal from "../components/AttendanceModal";
import GatePassModal from "../components/GatePassModal";
import {
  AlertTriangle,
  Ticket,
  LayoutDashboard,
  PlusCircle,
  Upload,
  QrCode,
  Activity,
  History,
  Zap,
  Info,
  Mail,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [provisionalOds, setProvisionalOds] = useState([]);
  const [assignedEvents, setAssignedEvents] = useState([]);

  useEffect(() => {
    let storedUser = null;
    let token = sessionStorage.getItem("token");
    try {
      storedUser = JSON.parse(sessionStorage.getItem("user"));
    } catch {
      storedUser = null;
    }

    if (!storedUser || !token) {
      sessionStorage.clear();
      navigate("/", { replace: true });
      return;
    }

    setStudent(storedUser);

    const fetchDashboardData = async () => {
      try {
        const [dashRes, odsRes, eventsRes] = await Promise.all([
          api.get("/students/dashboard"),
          api.get("/od/my-ods"),
          api.get("/events/internal/my-assigned")
        ]);
        setDashboardData(dashRes.data);
        setAssignedEvents(eventsRes.data);

        const now = new Date();
        const provisional = odsRes.data.filter(od => {
          if (od.status !== "PROVISIONAL") return false;
          if (od.event && od.event.endDate) {
            if (now > new Date(od.event.endDate)) return false;
          }
          return true;
        });
        setProvisionalOds(provisional);

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center gap-6 transition-colors font-black uppercase tracking-widest">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-4 bg-indigo-500/10 rounded-full animate-pulse blur-sm"></div>
        </div>
        <div className="text-center space-y-2">
            <p className="text-sm">Initiating Uplink</p>
            <p className="text-[10px] text-slate-400 opacity-50">Syncing Neural Terminal...</p>
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
          <div className="lg:col-span-8 space-y-12 md:space-y-24">
            <Hero student={student} dashboardData={dashboardData} />

            {/* Warning Protocols */}
            {dashboardData?.odStats?.pendingReports?.length > 0 && (
              <div className="relative group p-8 sm:p-12 rounded-[3.5rem] bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/40 shadow-2xl shadow-rose-500/10 overflow-hidden animate-shake">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-rose-500/10 transition-colors"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                    <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-500/20 shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                      <AlertTriangle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-rose-900 dark:text-rose-100 uppercase tracking-tighter mb-2">Warning Protocol: Report Required</h3>
                      <p className="text-[10px] sm:text-xs font-black text-rose-700/60 dark:text-rose-300/40 uppercase tracking-[0.2em] leading-relaxed max-w-xl">
                        Neural logs indicate {dashboardData.odStats.pendingReports.length} pending mission report(s). System transmission for new requests is currently locked.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="group/btn relative px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-rose-500/40 uppercase tracking-[0.3em] text-[10px] shrink-0"
                  >
                    <span className="relative z-10">Upload Intelligence</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Access Interface */}
            <section className="space-y-12">
              <div className="flex items-center gap-4 px-4">
                <div className="h-0.5 w-12 bg-indigo-500 rounded-full"></div>
                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">
                  Mission Control Decoders
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {provisionalOds.length > 0 && (
                    <ActionCard 
                        title="Gate Pass"
                        description="Spatial exit authorization ticket."
                        buttonText="Decrypt Access"
                        color="rose"
                        icon={<Ticket />}
                        onClick={() => setShowGatePassModal(true)}
                    />
                )}
                
                <ActionCard 
                    title="Coordinator"
                    description="Internal roster synchronization."
                    buttonText="Manage Vectors"
                    color="blue"
                    icon={<LayoutDashboard />}
                    onClick={() => navigate("/student/events")}
                />

                <ActionCard 
                    title="Initiate OD"
                    description="Request for on-duty deployment."
                    buttonText="Start Protocol"
                    color="indigo"
                    icon={<PlusCircle />}
                    onClick={() => navigate("/apply-od")}
                />

                <ActionCard 
                    title="Report Hub"
                    description="Mission post-activity dossiers."
                    buttonText="Sync Logs"
                    color="purple"
                    icon={<Upload />}
                    onClick={() => setShowReportModal(true)}
                />

                <ActionCard 
                    title="Attendance"
                    description="Temporal presence verification."
                    buttonText="Log Presence"
                    color="rose"
                    icon={<QrCode />}
                    onClick={() => setShowAttendanceModal(true)}
                />

                <ActionCard 
                    title="OD Tracker"
                    description="Live mission status telemetry."
                    buttonText="Live Stream"
                    color="green"
                    icon={<Activity />}
                    onClick={() => navigate("/od-status")}
                />
              </div>
            </section>

            {/* Data Stream Section */}
            <section className="space-y-12">
               <div className="flex items-center gap-4 px-4">
                  <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">
                    Telemetry Analytics Stream
                  </h2>
                </div>
                <ODAnalytics history={dashboardData?.history} />
            </section>

            {/* AI Core Section */}
            <section className="relative p-1 rounded-[4rem] group overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 shadow-2xl shadow-indigo-500/30">
                <div className="bg-slate-900 dark:bg-slate-950 rounded-[3.9rem] p-10 md:p-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mt-48 group-hover:bg-indigo-500/20 transition-all duration-700 animate-pulse"></div>
                    
                    <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-16">
                        <div className="flex-1 space-y-10 text-center xl:text-left">
                            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Neural Integration Active</span>
                            </div>
                            
                            <div className="space-y-6">
                                <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">Disha AI Core</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-xl opacity-80">
                                    Direct neural uplink for mission orchestration. Use natural language vectors to bypass manual protocols.
                                </p>
                            </div>

                            <div className="flex items-center gap-5 p-6 rounded-3xl bg-black/40 border-2 border-slate-800 shadow-inner group/terminal hover:border-indigo-500/40 transition-all w-fit mx-auto xl:mx-0">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <code className="text-xs sm:text-sm font-mono text-slate-300 font-black tracking-tight flex items-center gap-3">
                                    <span className="text-indigo-500 animate-pulse">$</span> apply_od_protocol --reason="Research" --range="10.02-12.02"
                                </code>
                            </div>
                        </div>

                        <div className="relative transform hover:scale-105 transition-transform duration-700 group/mockup">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full"></div>
                            <div className="relative bg-slate-900 border-x-4 border-y-8 border-slate-800 p-8 rounded-[3rem] shadow-2xl space-y-6 w-72 sm:w-80 overflow-hidden ring-1 ring-slate-700/50">
                                <div className="h-1.5 w-12 bg-slate-800 rounded-full mx-auto mb-4"></div>
                                {[
                                    { user: "Apply OD for tomorrow", color: "blue" },
                                    { user: "Analyzing Temporal Window...", color: "indigo", system: true },
                                    { user: "Protocol Generated: #882-X", color: "emerald", system: true }
                                ].map((msg, i) => (
                                    <div key={i} className={`p-4 rounded-2xl ${msg.system ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 ml-4' : 'bg-slate-800 text-slate-300 mr-4'} text-[10px] font-black uppercase tracking-tight leading-none`}>
                                        {msg.user}
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-slate-800 flex justify-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 p-0.5 animate-bounce">
                                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Compliance Protocols */}
            <section className="space-y-12">
               <div className="flex items-center gap-4 px-4">
                  <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">
                    Compliance Directives
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { title: "Mission Critical", text: "Confirmed placement status required for sector clearance." },
                        { title: "Temporal Window", text: "Sixty-day maximum cumulative duration per academic cycle." },
                        { title: "Dossier Integrity", text: "High-resolution PDF documentation mandatory for sync." },
                        { title: "Network Access", text: "Sessions are encrypted. Dual-layer auth required for root." }
                    ].map((rule, i) => (
                        <div key={i} className="group/rule p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 hover:border-indigo-500/20 transition-all flex items-start gap-6">
                            <div className="w-3 h-3 rounded-full mt-1.5 bg-slate-200 dark:bg-slate-800 group-hover/rule:bg-indigo-500 transition-colors ring-4 ring-transparent group-hover/rule:ring-indigo-500/10"></div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">{rule.title}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed opacity-70 group-hover/rule:opacity-100 transition-opacity">{rule.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4 space-y-12 sticky top-32">
            <div className="animate-fadeInRight">
              <ProfileCard student={{ ...student, mentor: dashboardData?.student?.mentor }} />
            </div>

            <div className="animate-fadeInRight animation-delay-300">
              <ODCalendar history={dashboardData?.history} />
            </div>

            {/* Support Uplink */}
            <div className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group border border-slate-800 animate-fadeInRight animation-delay-500">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                        <Mail className="w-5 h-5" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Support Uplink</h4>
                </div>
                
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed opacity-80">
                  Critical system errors? Access direct secure channel to authorized personnel.
                </p>

                {dashboardData?.student?.mentor ? (
                  <a
                    href={`mailto:${dashboardData.student.mentor.email}`}
                    className="group/link flex items-center justify-between p-5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all transform active:scale-95"
                  >
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Mentor Relay</span>
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-200">Contact {dashboardData.student.mentor.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <a
                    href="mailto:admin@college.edu"
                    className="group/link flex items-center justify-between p-5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all transform active:scale-95"
                  >
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Admin Central</span>
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-200">Secure Direct Access</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] group-hover:bg-indigo-600/10 transition-colors"></div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
      
      {/* Modals remain functionally identical */}
      {dashboardData?.odStats && (
        <InternshipReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          pendingODs={dashboardData.odStats.pendingReports || []}
          onUploadSuccess={() => {
            setShowReportModal(false);
            api.get("/students/dashboard").then(res => setDashboardData(res.data)).catch(console.error);
          }}
        />
      )}

      <GatePassModal
        isOpen={showGatePassModal}
        onClose={() => setShowGatePassModal(false)}
        provisionalOds={provisionalOds}
      />

      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        studentId={student?.id}
        onSuccess={() => {
          api.get("/students/dashboard").then(res => setDashboardData(res.data)).catch(console.error);
        }}
      />
    </div>
  );
}
