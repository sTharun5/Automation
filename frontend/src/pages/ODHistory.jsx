import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import usePolling from "../hooks/usePolling";
import {
    ArrowLeft,
    Folder,
    CheckCircle,
    Clock,
    ChevronRight
} from "lucide-react";

/**
 * ODHistory component - Personal archival system for students.
 * Provides a categorized view of past On-Duty applications with status filtering,
 * cumulative statistics for utilized days, and access to detailed activity records
 * for academic and institutional verification.
 */
export default function ODHistory() {
    const [ods, setOds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get("/od/my-ods");
            setOds(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Auto-refresh every 30 s so newly approved/rejected ODs appear automatically
    usePolling(fetchHistory, 30000);

    const isPastApproved = (od) => {
        return (od.status === "APPROVED" || od.status === "MENTOR_APPROVED") && new Date(od.endDate).setHours(16, 20, 0, 0) < new Date().getTime();
    };

    const getDerivedStatus = (od) => {
        if (isPastApproved(od)) return "COMPLETED";
        return od.status;
    };

    const filteredODs = filter === "ALL"
        ? ods
        : ods.filter(od => getDerivedStatus(od) === filter);

    // Stats Calculation
    const totalODs = ods.length;
    const approvedODs = ods.filter(od => od.status === "APPROVED" || od.status === "MENTOR_APPROVED").length;
    const totalDays = ods.filter(od => od.status === "APPROVED" || od.status === "MENTOR_APPROVED").reduce((acc, curr) => acc + curr.duration, 0);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">

                {/* Header & Stats */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            to="/student/dashboard"
                            className="inline-flex items-center justify-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">OD History Archive</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Official record of all your professional on-duty activities.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            label="Total Applications"
                            value={totalODs}
                            icon={<Folder className="w-6 h-6" />}
                            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        />
                        <StatCard
                            label="Approved ODs"
                            value={approvedODs}
                            icon={<CheckCircle className="w-6 h-6" />}
                            color="text-green-600 bg-green-50 dark:bg-green-900/20"
                        />
                        <StatCard
                            label="Days Utilized"
                            value={`${totalDays} Days`}
                            icon={<Clock className="w-6 h-6" />}
                            color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter OD records by status">
                    {["ALL", "APPROVED", "COMPLETED", "REJECTED", "PENDING"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            aria-pressed={filter === s}
                            aria-label={`Show ${s.toLowerCase().replace("_", " ")} records`}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${filter === s
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                                : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                }`}
                        >
                            {s.replace("_", " ")}
                        </button>
                    ))}
                </div>

                {/* Table View */}
                {loading ? (
                    <div className="text-center py-20 text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse" role="status">Retrieving Archive...</div>
                ) : filteredODs.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400" aria-label="OD Application History">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Tracker ID</th>
                                        <th className="px-6 py-4">Verification Entity</th>
                                        <th className="px-6 py-4">Temporal Range</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Activity Ref</th>
                                        <th className="px-6 py-4">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredODs.map((od) => (
                                        <tr key={od.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white" aria-label={`Tracker Identification: #${od.trackerId}`}>#{od.trackerId}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white capitalize">{(od.type || "OD").toLowerCase()} Activity</div>
                                                <div className="text-[11px] font-medium text-slate-400 group-hover:text-blue-500 transition-colors truncate max-w-[150px]">
                                                    {od.type === 'INTERNAL' ? (od.event?.name || "Internal Event") : (od.offer?.company?.name || "Corporate Partner")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-[11px] font-medium">
                                                    <span className="text-slate-700 dark:text-slate-300">{new Date(od.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span className="text-slate-400 flex items-center gap-1"><ArrowLeft className="w-2.5 h-2.5 rotate-180" /> {new Date(od.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={getDerivedStatus(od)} />
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[10px]">
                                                {od.activityId ? (
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                                                        {od.activityId}
                                                    </span>
                                                ) : <span className="text-slate-300 dark:text-slate-700">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    to={`/student/od/${od.id}`}
                                                    aria-label={`View full details for OD record #${od.trackerId}`}
                                                    className="inline-flex items-center gap-1 font-black text-blue-600 hover:text-blue-500 text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform"
                                                >
                                                    Inspect <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-slate-500">No records found for this filter.</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    let style = "bg-slate-100 text-slate-600 border-slate-200";
    if (status === "APPROVED" || status === "MENTOR_APPROVED") style = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900";
    if (status === "COMPLETED") style = "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    if (status === "REJECTED") style = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900";
    if (["PENDING", "DOCS_VERIFIED"].includes(status)) style = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900";

    return (
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${style}`}>
            {(status || "").replace(/_/g, " ")}
        </span>
    );
}
