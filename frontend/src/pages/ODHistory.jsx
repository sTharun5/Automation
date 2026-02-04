import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

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

    const filteredODs = filter === "ALL"
        ? ods
        : ods.filter(od => od.status === filter);

    // Stats Calculation
    const totalODs = ods.length;
    const approvedODs = ods.filter(od => od.status === "APPROVED").length;
    const totalDays = ods.filter(od => od.status === "APPROVED").reduce((acc, curr) => acc + curr.duration, 0);

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
                            ←
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
                            icon="📂"
                            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        />
                        <StatCard
                            label="Approved ODs"
                            value={approvedODs}
                            icon="✅"
                            color="text-green-600 bg-green-50 dark:bg-green-900/20"
                        />
                        <StatCard
                            label="Days Utilized"
                            value={`${totalDays} Days`}
                            icon="⏳"
                            color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {["ALL", "APPROVED", "REJECTED", "PENDING"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
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
                    <div className="text-center py-20 text-slate-500">Loading records...</div>
                ) : filteredODs.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Tracker ID</th>
                                        <th className="px-6 py-4">Title / Company</th>
                                        <th className="px-6 py-4">Dates</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Activity ID</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredODs.map((od) => (
                                        <tr key={od.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">#{od.trackerId}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white capitalize">{(od.type || "OD").toLowerCase()} OD</div>
                                                <div className="text-xs">{od.offer?.company?.name || "Company OD"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-xs">
                                                    <span>{new Date(od.startDate).toLocaleDateString()}</span>
                                                    <span className="text-slate-400">to {new Date(od.endDate).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={od.status} />
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {od.activityId ? (
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                        {od.activityId}
                                                    </span>
                                                ) : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    to={`/student/od/${od.id}`}
                                                    className="font-bold text-blue-600 hover:text-blue-500 text-xs"
                                                >
                                                    View →
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
    if (status === "APPROVED") style = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900";
    if (status === "REJECTED") style = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900";
    if (["PENDING", "MENTOR_APPROVED", "DOCS_VERIFIED"].includes(status)) style = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900";

    return (
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${style}`}>
            {(status || "").replace(/_/g, " ")}
        </span>
    );
}
