import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ODHistory() {
    const navigate = useNavigate();
    const [ods, setOds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get("/students/dashboard"); // Reusing this as it has ODS
            setOds(res.data.ods || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredODs = filter === "ALL"
        ? ods
        : ods.filter(od => od.status === filter);

    const getStatusStyle = (status) => {
        switch (status) {
            case "APPROVED": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
            case "REJECTED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
            case "PENDING": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
            case "MENTOR_APPROVED": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            case "DOCS_VERIFIED": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/student/dashboard")}
                            className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">OD Application History</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Track your professional on-duty records</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        {["ALL", "PENDING", "MENTOR_APPROVED", "APPROVED", "REJECTED"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === s
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                {s.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching History...</p>
                    </div>
                ) : filteredODs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredODs.map((od) => (
                            <div
                                key={od.id}
                                onClick={() => navigate(`/student/od/${od.id}`)}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Status Stripe */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${od.status === 'APPROVED' ? 'bg-green-500' : od.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'}`} />

                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyle(od.status)}`}>
                                        {od.status.replace("_", " ")}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">#{od.trackerId}</p>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 capitalize">{od.type.toLowerCase()} OD</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium italic">Applied on {new Date(od.createdAt).toLocaleDateString()}</p>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Duration</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{od.duration} Days</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Activity ID</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{od.activityId || "TBA"}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                        View Details <span>→</span>
                                    </span>
                                    <div className="flex -space-x-1">
                                        <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                        <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-20 text-center shadow-sm">
                        <div className="max-w-xs mx-auto">
                            <div className="bg-slate-50 dark:bg-slate-800/50 h-20 w-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📚</div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Records Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">You haven't submitted any OD applications for the selected filter.</p>
                            <button
                                onClick={() => navigate("/apply-od")}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                Start New Application
                            </button>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
