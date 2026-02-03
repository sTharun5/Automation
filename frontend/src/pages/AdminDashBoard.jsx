import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileCard from "../components/ProfileCard";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { showToast } = useToast();

  // Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false
  });

  // ✅ OD Management State
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]); // Search results
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentODs, setStudentODs] = useState([]);
  const [loadingODs, setLoadingODs] = useState(false);

  /* ================= SEARCH STUDENT ================= */
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await api.get(`/students/search?q=${searchQuery}`);
      setStudents(res.data);
      setSelectedStudent(null);
    } catch (err) {
      showToast("Search failed", "error");
    }
  };

  /* ================= SELECT STUDENT ================= */
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingODs(true);
    try {
      const res = await api.get(`/od/admin/student/${student.id}`);
      setStudentODs(res.data);
    } catch (err) {
      showToast("Failed to load ODs", "error");
    } finally {
      setLoadingODs(false);
    }
  };

  /* ================= CANCEL OD ================= */
  const confirmCancelOD = async (odId) => {
    try {
      await api.put(`/od/update-status/${odId}`, { status: "REJECTED" });
      showToast("OD Cancelled Successfully", "success");
      // Refresh list
      handleSelectStudent(selectedStudent);
    } catch (err) {
      showToast("Failed to cancel OD", "error");
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const handleCancelOD = (odId) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel OD",
      message: "Are you sure you want to cancel this OD?",
      onConfirm: () => confirmCancelOD(odId),
      isDanger: true,
      confirmText: "Yes, Cancel"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <button
            onClick={() => navigate("/admin/assign-mentor")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <span>🤝</span> Manage Mentors
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors">
              <p className="text-lg text-slate-900 dark:text-white">
                Welcome, <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.name || "Admin"}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">System Administrator Access</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => navigate("/admin/faculty")}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-3xl bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl">👨‍🏫</span>
                  <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">Manage Faculty</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Add, Remove and View Faculty Members.</p>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
              </div>
              <div
                onClick={() => navigate("/admin/students")}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-3xl bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl">🎓</span>
                  <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">Manage Students</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Examine all students and their assigned mentors.</p>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
              </div>
              <div
                onClick={() => navigate("/admin/companies")}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-3xl bg-amber-50 dark:bg-amber-900/30 p-2 rounded-xl">🏢</span>
                  <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">Manage Companies</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Approve or reject companies for OD requests.</p>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <ProfileCard student={user} />
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Quick Stats</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">System Status</span>
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">Database</span>
                  <span className="text-xs font-bold text-blue-400">Connected</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ================= MANAGE ODs ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm transition-colors mt-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">🛑 Manage Student ODs</h2>

          {/* Search */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by Roll No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-medium"
            >
              Search
            </button>
          </div>

          {/* Student List */}
          {students.length > 0 && !selectedStudent && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-slate-500">Select Student:</h3>
              {students.map(s => (
                <div key={s.id} onClick={() => handleSelectStudent(s)} className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                  <span>{s.name} ({s.rollNo})</span>
                  <span className="text-sm text-slate-500">{s.department}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected Student ODs */}
          {selectedStudent && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">ODs for {selectedStudent.name}</h3>
                <button onClick={() => setSelectedStudent(null)} className="text-sm text-blue-600 hover:underline">Change Student</button>
              </div>

              {loadingODs ? <p>Loading ODs...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-medium">
                      <tr>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Dates</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {studentODs.length === 0 ? (
                        <tr><td colSpan="4" className="px-4 py-3 text-center">No ODs found</td></tr>
                      ) : studentODs.map(od => (
                        <tr key={od.id}>
                          <td className="px-4 py-3">{od.type}</td>
                          <td className="px-4 py-3">{new Date(od.startDate).toLocaleDateString()} - {new Date(od.endDate).toLocaleDateString()} ({od.duration} days)</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${od.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              od.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                              {od.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">{od.activityId}</span>
                          </td>
                          <td className="px-4 py-3">
                            {od.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleCancelOD(od.id)}
                                className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <ConfirmationModal
        {...confirmModal}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
      <Footer />
    </div>
  );
}
