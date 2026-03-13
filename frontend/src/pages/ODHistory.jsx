import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
    ArrowLeft,
    Folder,
    CheckCircle,
    Clock,
    ChevronRight,
    FileText
} from "lucide-react";

export default function ODHistory() {
    const [ods, setOds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get("/od/my-ods");
            setOds(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">

                {/* Header & Stats Section */}
                <div className="mb-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-5">
                            <Link
                                to="/student/dashboard"
                                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Archive Vault</h1>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Personnel Operation Logs & History</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                        <StatCard
                            label="Total Logs"
                            value={totalODs}
                            icon={<FileText className="w-6 h-6" />}
                            color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                        />
                        <StatCard
                            label="Successful Syncs"
                            value={approvedODs}
                            icon={<CheckCircle className="w-6 h-6" />}
                            color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                        />
                        <StatCard
                            label="Cycles Utilized"
                            value={totalDays}
                            suffix="Days"
                            icon={<Clock className="w-6 h-6" />}
                            color="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                        />
                    </div>
                </div>

                {/* Filters Section */}
                <div className="flex flex-wrap items-center gap-3 mb-8 px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Filter Matrix:</span>
                    {["ALL", "APPROVED", "COMPLETED", "REJECTED", "PENDING"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none"
                                : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30"
                                }`}
                        >
                            {s.replace("_", " ")}
                        </button>
                    ))}
                </div>

                {/* Data View */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem]">
                        <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Accessing Encrypted Records...</p>
                    </div>
                ) : filteredODs.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden pb-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node ID</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Classification</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timeframe</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Satellite Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredODs.map((od) => (
                                        <tr key={od.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                            <td className="px-8 py-6">
                                                <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">#{od.trackerId}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {(od.type || "OD").toLowerCase()} PROTOCOL
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                                                        {od.type === 'INTERNAL' ? (od.event?.name || "Internal Event") : (od.offer?.company?.name || "Company OD")}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                                                            {new Date(od.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-5">
                                                        To {new Date(od.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <StatusBadge status={getDerivedStatus(od)} />
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link
                                                    to={`/student/od/${od.id}`}
                                                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all group/btn"
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Inspect</span>
                                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-slate-500/5 rounded-full blur-[100px] -ml-32 -mt-32"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Null Sector Detected</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No logs found matching the current filter parameters.</p>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

function StatCard({ label, value, icon, color, suffix }) {
    return (
        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all hover:scale-[1.02] hover:border-indigo-500/30 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] translate-x-10 translate-y-10"></div>
            <div className="flex flex-col gap-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-current/10 ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 px-1">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{value}</span>
                        {suffix && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{suffix}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    let style = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    if (status === "APPROVED" || status === "MENTOR_APPROVED") style = "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 shadow-lg shadow-emerald-500/10";
    if (status === "COMPLETED") style = "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-lg shadow-slate-900/10 dark:shadow-none";
    if (status === "REJECTED") style = "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50 shadow-lg shadow-rose-500/10";
    if (["PENDING", "DOCS_VERIFIED"].includes(status)) style = "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50 shadow-lg shadow-amber-500/10";

    return (
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${style}`}>
            {(status || "INITIATED").replace(/_/g, " ")}
        </span>
    );
}
