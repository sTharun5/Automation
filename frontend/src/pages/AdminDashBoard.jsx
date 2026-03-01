import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileCard from "../components/ProfileCard";

import ConfirmationModal from "../components/ConfirmationModal";
import CalendarManagementModal from "../components/CalendarManagementModal";
import PlacementMapWidget from "../components/PlacementMapWidget";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false,
    remarks: "" // ✅ Added remarks state
  });





  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCalendarModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              <span>📅</span> Manage Calendar
            </button>
            <button
              onClick={() => navigate("/admin/assign-mentor")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <span>🤝</span> Manage Mentors
            </button>
          </div>
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

              {/* ✅ New Manage ODs Card */}
              <div
                onClick={() => navigate("/admin/manage-ods")}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-3xl bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl">🛑</span>
                  <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">Manage OD Requests</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Search, View and Cancel Student ODs.</p>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors" />
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

            {/* Interactive Placement Hotspot Map */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm transition-colors mt-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                🌍 Global Placement Footprint
              </h3>
              <PlacementMapWidget />
            </div>
          </aside>
        </div>

        {/* ================= MANAGE ODs ================= */}

      </main >
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
    </div >
  );
}
