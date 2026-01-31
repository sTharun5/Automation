import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ActionCard from "../components/ActionCard";

export default function Dashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      storedUser = null;
    }

    if (!token || !storedUser) {
      localStorage.clear();
      navigate("/", { replace: true });
      return;
    }

    setStudent(storedUser);
    setLoading(false);
  }, [navigate]);

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center transition-colors">
        Authenticating...
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors">

      {/* HEADER */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="flex-1 px-6 md:px-10 py-10 max-w-7xl mx-auto w-full space-y-12">

        {/* HERO */}
        <Hero student={student} />

        {/* ACTIONS */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              title="Apply OD"
              description="Apply for Internship or Internal OD"
              color="blue"
              buttonText="Apply Now"
              onClick={() => navigate("/apply-od")}
            />

            <ActionCard
              title="OD Status"
              description="Track approval and current status"
              color="green"
              buttonText="View Status"
              onClick={() => navigate("/od-status")}
            />

            <ActionCard
              title="OD History"
              description="View previously approved ODs"
              color="purple"
              buttonText="View History"
              onClick={() => navigate("/od-history")}
            />
          </div>
        </section>

        {/* GUIDELINES */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow p-6 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            OD Guidelines
          </h3>

          <ul className="list-disc pl-6 text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <li>OD is allowed only for placed students</li>
            <li>Maximum OD duration is 60 days</li>
            <li>Internship proof must follow the prescribed format</li>
            <li>OTP-based secure login is mandatory</li>
            <li>All OD actions are logged and audited</li>
          </ul>
        </section>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
