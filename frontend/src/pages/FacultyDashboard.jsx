import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileCard from "../components/ProfileCard";

export default function FacultyDashboard() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const navigate = useNavigate();
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Faculty Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full uppercase tracking-wider">
              {user?.department}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/faculty/approvals")}
                  className="w-full flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-900 dark:text-blue-100 transition-all font-semibold"
                >
                  <span>✅ Approve ODs</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => navigate("/faculty/update-placement")}
                  className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all font-semibold"
                >
                  <span>📋 Update Placement</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium">Active Mentees</p>
                <h3 className="text-4xl font-black mt-1">{mentees.length}</h3>
              </div>
              <span className="absolute -bottom-4 -right-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-700">👨‍🎓</span>
            </div>

            <ProfileCard student={user} />
          </div>

          {/* Mentees Listing */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="font-bold text-slate-900 dark:text-white">Your Mentees</h2>
                <span className="text-xs text-slate-500 uppercase font-black tracking-widest">{mentees.length} students</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px] p-6 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-20 animate-pulse text-blue-500">Loading mentees...</div>
                ) : mentees.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mentees.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => navigate(`/faculty/mentee/${student.id}`)}
                        className="group p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all bg-white dark:bg-slate-800/50 hover:shadow-md"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          {student.placement_status === "NIP" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase">NIP</span>
                          ) : (student.offers && student.offers.length > 0) || student.placement_status === "PLACED" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase">Placed</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Unplaced</span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white capitalize group-hover:text-blue-600 transition-colors">{student.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{student.rollNo}</p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">Click for details</span>
                          <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-slate-500 text-sm font-medium italic">No students assigned to you yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
