import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function FacultyDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">Faculty Dashboard</h1>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm max-w-3xl transition-colors">
          <p className="text-lg text-slate-900 dark:text-white">
            Welcome, <span className="font-semibold">{user?.name}</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Email: {user?.email}</p>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Department: {user?.department || "—"}</p>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={() => navigate("/faculty/update-placement")}
              className="w-full text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
            >
              📋 Update Student Placement Status
            </button>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              🔍 View Students (next)
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
