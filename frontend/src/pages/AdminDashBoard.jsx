import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileCard from "../components/ProfileCard";

import ConfirmationModal from "../components/ConfirmationModal";
import CalendarManagementModal from "../components/CalendarManagementModal";
import PlacementMapWidget from "../components/PlacementMapWidget";
import {
  Calendar,
  Users,
  BarChart3,
  Loader2,
  GraduationCap,
  Building2,
  ShieldAlert,
  CalendarCheck,
  Globe,
  ChevronRight,
  Activity
} from "lucide-react";

import useGreeting from "../hooks/useGreeting";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const greeting = useGreeting();
  const name = user?.name?.split(" ")[0] || "Admin";

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await api.get("/admin/export-ods", {
        responseType: 'blob' // Important for downloading files
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'smart-od-records.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Failed to export Excel", error);
      alert("Failed to export OD records.");
    } finally {
      setExporting(false);
    }
  };

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
      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-6 md:py-8 max-w-6xl mx-auto w-full overflow-x-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{greeting}, {name}!</h1>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <button
              onClick={() => setShowCalendarModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              <Calendar className="w-4 h-4 sm:w-5 h-5" /> <span className="whitespace-nowrap">Calendar</span>
            </button>
            <button
              onClick={() => navigate("/admin/assign-mentor")}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <Users className="w-4 h-4 sm:w-5 h-5" /> <span className="whitespace-nowrap">Mentors</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg text-white ${exporting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}
            >
              {exporting ? <Loader2 className="w-4 h-4 sm:w-5 h-5 animate-spin" /> : <BarChart3 className="w-4 h-4 sm:w-5 h-5" />} <span className="whitespace-nowrap">{exporting ? 'Exporting...' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors">
              <p className="text-lg text-slate-900 dark:text-white">
                Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.name}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">Welcome to your Administrator Control Center</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => navigate("/admin/faculty")}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <div className="bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">Manage OD Requests</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Search, View and Cancel Student ODs.</p>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors" />
              </div>

              {/* ✅ New Internal Events Manager Card */}
              <div
                onClick={() => navigate("/admin/internal-events")}
                className="group bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden text-white"
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold mb-1 relative z-10">Internal Events</h3>
                <p className="text-sm text-indigo-100 relative z-10">Create auto-approved internal events and project Live QRs.</p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
              </div>

              {/* ✅ New Login History Card */}
              <div
                onClick={() => navigate("/admin/login-history")}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-600 dark:text-slate-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">Login History</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Monitor user login activity and device information.</p>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-slate-500/5 rounded-full blur-xl group-hover:bg-slate-500/10 transition-colors" />
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
                <Globe className="w-5 h-5" /> Global Placement Footprint
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
