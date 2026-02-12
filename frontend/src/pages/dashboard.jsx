import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; // ✅ Import API

import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ActionCard from "../components/ActionCard";
import ProfileCard from "../components/ProfileCard";

export default function Dashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null); // ✅ New State
  const [loading, setLoading] = useState(true);

  /* ================= LOAD AUTH ================= */
  /* ================= LOAD AUTH & DATA ================= */
  useEffect(() => {
    const token = sessionStorage.getItem("token");

    let storedUser = null;
    try {
      storedUser = JSON.parse(sessionStorage.getItem("user"));
    } catch {
      storedUser = null;
    }

    if (!token || !storedUser) {
      sessionStorage.clear();
      navigate("/", { replace: true });
      return;
    }

    setStudent(storedUser);

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/students/dashboard");
        setDashboardData(res.data);
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

            {/* Professional Quick Actions */}
            <section className="animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Apply OD */}
                <button
                  onClick={() => navigate("/apply-od")}
                  className="group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">New Application</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">Submit a request for Internship or On-Duty leave.</p>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Start Application <span aria-hidden>→</span>
                  </span>
                </button>

                {/* OD Status */}
                <button
                  onClick={() => navigate("/od-status")}
                  className="group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Track Status</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">Monitor the progress of your active requests.</p>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Live Tracker <span aria-hidden>→</span>
                  </span>
                </button>

                {/* OD History */}
                <button
                  onClick={() => navigate("/od-history")}
                  className="group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-500/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Archive & Logs</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">Access historical records of all approvals.</p>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View History <span aria-hidden>→</span>
                  </span>
                </button>
              </div>
            </section>

            {/* AI Command Center Feature */}
            <section className="animate-fadeIn mt-6 group relative overflow-hidden rounded-xl bg-slate-900 text-slate-300 border border-slate-800 p-0.5">
              <div className="relative z-10 bg-slate-950/50 rounded-[10px] p-6 md:p-8 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
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
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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

              <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden group border border-slate-800">
                <div className="relative z-10">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Support</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">Facing issues with your application? Contact your mentor or the administrator.</p>
                  <button onClick={() => navigate("/notifications")} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">View Notifications →</button>
                </div>
                <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-blue-500/10 rounded-full blur-xl group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
