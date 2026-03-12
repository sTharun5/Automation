import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; // ✅ Import API

import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ActionCard from "../components/ActionCard";
import ProfileCard from "../components/ProfileCard";
import ODAnalytics from "../components/ODAnalytics"; // ✅ New
import ODCalendar from "../components/ODCalendar"; // ✅ New
import InternshipReportModal from "../components/InternshipReportModal";
import AttendanceModal from "../components/AttendanceModal"; // ✅ Unified Attendance
import GatePassModal from "../components/GatePassModal"; // ✅ Digital Gate Pass
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
  ExternalLink
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null); // ✅ New State
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false); // ✅ Unified Modal State
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [provisionalOds, setProvisionalOds] = useState([]);
  const [assignedEvents, setAssignedEvents] = useState([]); // ✅ Events assigned to this student

  /* ================= LOAD AUTH ================= */
  /* ================= LOAD AUTH & DATA ================= */
  useEffect(() => {
    // const role = sessionStorage.getItem("role"); // Legacy check removed
    // const storedUser = sessionStorage.getItem("user"); // Legacy check removed

    // if (!role || !storedUser) { // Legacy check removed
    //   navigate("/"); // Legacy check removed
    // } // Legacy check removed

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

        // Filter for PROVISIONAL ODs which act as the Digital Gate Pass
        const now = new Date();
        const provisional = odsRes.data.filter(od => {
          if (od.status !== "PROVISIONAL") return false;
          // Hide the gate pass if the event has already ended
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

    // Initial Fetch
    fetchDashboardData();

    // Poll every 8 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 8000);

    return () => clearInterval(interval);
  }, [navigate]);

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center gap-4 transition-colors">
        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />

      <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 md:py-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-10 md:space-y-14">
            <Hero student={student} dashboardData={dashboardData} />

            {/* Pending Reports Alert Banner */}
            {dashboardData?.odStats?.pendingReports?.length > 0 && (
              <div className="animate-fadeIn mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg">Internship Report Required</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      You have {dashboardData.odStats.pendingReports.length} completed OD(s) requiring an internship report submission. You cannot apply for new ODs until these are reviewed and approved.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-lg transition-transform hover:scale-105 shadow-md flex-shrink-0"
                >
                  Submit Report
                </button>
              </div>
            )}

            {/* Professional Quick Actions */}
            <section className="animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Digital Gate Pass (Conditionally Rendered) */}
                {provisionalOds.length > 0 && (
                  <button
                    onClick={() => setShowGatePassModal(true)}
                    className="group relative flex flex-col items-start p-5 bg-gradient-to-br from-amber-50 dark:from-amber-900/20 to-orange-50 dark:to-orange-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 text-left overflow-hidden ring-2 ring-amber-400/50 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 animate-pulse"
                  >
                    <div className="p-2.5 bg-amber-500 rounded-lg text-white mb-4 group-hover:scale-110 transition-transform shadow-md shadow-amber-500/30 relative z-10">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1 relative z-10">Show Gate Pass</h3>
                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mb-4 h-8 relative z-10">Present to your teacher to leave class for the event.</p>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:gap-2 transition-all relative z-10">
                      Open Ticket <ChevronRight className="w-3 h-3" />
                    </span>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors"></div>
                  </button>
                )}

                {/* Coordinator Portal */}
                <button
                  onClick={() => navigate("/student/events")}
                  className="group relative flex flex-col items-start p-5 bg-gradient-to-br from-indigo-50 dark:from-indigo-900/20 to-purple-50 dark:to-purple-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-left overflow-hidden ring-2 ring-indigo-400/30"
                >
                  <div className="p-2.5 bg-indigo-500 rounded-lg text-white mb-4 group-hover:scale-110 transition-transform shadow-md">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1">Coordinator Portal</h3>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mb-4 h-8">Manage rosters for your assigned events.</p>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Manage Events <ChevronRight className="w-3 h-3" />
                  </span>
                </button>

                {/* Apply OD */}
                <button
                  onClick={() => navigate("/apply-od")}
                  className="group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">New Application</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">Submit a request for Internship or On-Duty leave.</p>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Start Application <ChevronRight className="w-3 h-3" />
                  </span>
                </button>

                {/* Submit Report */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Submit Report</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">Upload internship reports for completed requests.</p>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Upload File <ChevronRight className="w-3 h-3" />
                  </span>
                </button>

                {/* Unified Attendance Logging */}
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="group relative flex flex-col items-start p-5 bg-gradient-to-br from-indigo-50 dark:from-indigo-900/20 to-purple-50 dark:to-purple-900/10 rounded-xl border border-indigo-400 dark:border-indigo-800 shadow-sm hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 text-left overflow-hidden ring-2 ring-indigo-500/20"
                >
                  <div className="p-2.5 bg-indigo-500 rounded-lg text-white mb-4 group-hover:scale-110 transition-transform shadow-md shadow-indigo-500/30">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1 relative z-10">Log Attendance</h3>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mb-4 h-8 relative z-10">Scan QR OR enter venue code to verify yourself.</p>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all relative z-10">
                    Open Attendance Console <ChevronRight className="w-3 h-3" />
                  </span>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                </button>

                {/* OD Status */}
                <button
                  onClick={() => navigate("/od-status")}
                  className="group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Track Status</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">Monitor the progress of your active requests.</p>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Live Tracker <ChevronRight className="w-3 h-3" />
                  </span>
                </button>

                {/* OD History */}
                <button
                  onClick={() => navigate("/od-history")}
                  className="group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-500/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Archive & Logs</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">Access historical records of all approvals.</p>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View History <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              </div>
            </section>

            {/* Analytics Section */}
            <ODAnalytics history={dashboardData?.history} />

            {/* AI Command Center Feature */}
            <section className="animate-fadeIn mt-6 group relative overflow-hidden rounded-xl bg-slate-900 text-slate-300 border border-slate-800 p-0.5">
              <div className="relative z-10 bg-slate-950/50 rounded-[10px] p-6 md:p-8 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
                      <Zap className="w-4 h-4" />
                      <span>Disha AI 2.0</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Automated Application Workflow</h3>
                      <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
                        Use natural language commands in the chat assistant to instantly generate OD requests.
                        Supported on all active chat sessions.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono bg-slate-900 rounded-lg p-3 border border-slate-800 w-fit">
                      <span className="text-indigo-400">$</span>
                      <span className="text-slate-300">Apply OD 10.08.2025 to 12.08.2025 for Google IT on campus</span>
                    </div>
                  </div>

                  <div className="shrink-0 relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl skew-y-3 -rotate-3 group-hover:rotate-0 group-hover:skew-y-0 transition-all duration-500">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <div className="space-y-2 text-[10px] font-mono text-slate-500 w-48">
                        <p className="flex gap-2"><span className="text-blue-400">user:</span> <span className="text-slate-300">Apply OD...</span></p>
                        <p className="flex gap-2"><span className="text-emerald-400">ai:</span> <span className="text-slate-300">Request generated. Verify?</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
            </section>

            {/* Professional Guidelines Panel */}
            <section className="animate-fadeIn mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance & Guidelines</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Eligibility", text: "Confirmed placement or valid NIP status is required." },
                  { title: "Duration Limit", text: "Maximum cumulative duration of 60 days per academic year." },
                  { title: "Documentation", text: "Offer letter and aim/objective PDF must be attached." },
                  { title: "Security", text: "All sessions are logged. OTP verification mandatory." },
                ].map((rule, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="mt-0.5 w-1 h-1 rounded-full bg-slate-400 shrink-0"></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{rule.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{rule.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4 sticky top-[5.5rem] animate-fadeIn lg:pl-4">
            <div className="space-y-8">
              <ProfileCard student={{ ...student, mentor: dashboardData?.student?.mentor }} />

              <ODCalendar history={dashboardData?.history} />

              <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden group border border-slate-800">
                <div className="relative z-10">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Support</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Facing issues with your application? Contact your mentor or the administrator directly.
                  </p>

                  {dashboardData?.student?.mentor ? (
                    <a
                      href={`mailto:${dashboardData.student.mentor.email}`}
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Contact Mentor
                    </a>
                  ) : (
                    <a
                      href="mailto:admin@college.edu"
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Contact Admin
                    </a>
                  )}
                </div>
                <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-blue-500/10 rounded-full blur-xl group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
      {dashboardData?.odStats && (
        <InternshipReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          pendingODs={dashboardData.odStats.pendingReports || []}
          onUploadSuccess={() => {
            setShowReportModal(false);
            // Refresh dashboard data
            api.get("/students/dashboard").then(res => setDashboardData(res.data)).catch(console.error);
          }}
        />
      )}

      {/* Internal QR Scanner Modal */}
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
          // Refresh dashboard data instantly when OD is approved
          api.get("/students/dashboard").then(res => setDashboardData(res.data)).catch(console.error);
        }}
      />
    </div>
  );
}
