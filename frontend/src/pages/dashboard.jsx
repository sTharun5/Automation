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

    // ✅ Fetch Real-Time Data
    api.get("/students/dashboard")
      .then((res) => {
        setDashboardData(res.data);
      })
      .catch((err) => {
        console.error("Dashboard Fetch Error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
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

            {/* Quick Actions */}
            <section className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-9 w-1 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600" />
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <ActionCard
                  title="Apply OD"
                  description="Apply for Internship or Internal OD"
                  color="blue"
                  icon="📝"
                  buttonText="Apply Now"
                  onClick={() => navigate("/apply-od")}
                />
                <ActionCard
                  title="OD Status"
                  description="Track approval and current status"
                  color="green"
                  icon="📋"
                  buttonText="View Status"
                  onClick={() => navigate("/od-status")}
                />
                <ActionCard
                  title="OD History"
                  description="View previously approved ODs"
                  color="purple"
                  icon="📚"
                  buttonText="View History"
                  onClick={() => navigate("/od-history")}
                />
              </div>
            </section>

            {/* Guidelines */}
            <section className="animate-fadeIn bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold">
                  !
                </span>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  OD Guidelines
                </h3>
              </div>

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                {[
                  "OD is allowed only for placed students",
                  "Maximum OD duration is 60 days",
                  "Internship proof must follow the prescribed format",
                  "OTP-based secure login is mandatory",
                  "All OD actions are logged and audited",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
