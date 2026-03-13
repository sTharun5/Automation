import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import {
    ArrowLeft,
    ChevronRight,
    CheckCircle,
    Info,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle
} from "lucide-react";

export default function ODStatus() {
    const [activeODs, setActiveODs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchODs = async () => {
            try {
                const res = await api.get("/od/my-ods");
                const ods = Array.isArray(res.data) ? res.data : [];
                const active = ods.filter(od =>
                    od.status && (
                        ["PENDING", "MENTOR_APPROVED", "DOCS_VERIFIED"].includes(od.status) ||
                        (od.status === "APPROVED" && od.endDate && new Date(od.endDate).setHours(16, 20, 0, 0) > new Date().getTime())
                    )
                );
                setActiveODs(active);
            } catch (err) {
                console.error("Failed to fetch ODs", err);
            } finally {
                setLoading(false);
            }
        };

        fetchODs();
        const interval = setInterval(fetchODs, 10000); // 10s is better for resource management
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 sm:mb-12">
                    <div className="flex items-center gap-5">
                        <Link
                            to="/student/dashboard"
                            className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Active Transmit</h1>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-[0.3em]">Real-time Telemetry & Status Node</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <div className="w-16 h-16 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Establishing Secure Sync...</p>
                    </div>
                ) : activeODs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8">
                        {activeODs.map((od) => (
                            <div key={od.id} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden p-6 sm:p-10 transition-all hover:border-indigo-500/30 relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/10 transition-all"></div>
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 mb-10 relative z-10">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {(od.type || "OD").toLowerCase()} Protocol
                                            </span>
                                            <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-100 dark:border-indigo-800/50 tracking-widest">
                                                #{od.trackerId}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Clock className="w-2.5 h-2.5" />
                                                </div>
                                                <span>
                                                    {od.type === 'INTERNAL' 
                                                        ? `${od.event?.name || "Internal Event"}`
                                                        : (od.offer?.company?.name || "Corporate Vector")}
                                                </span>
                                            </div>
                                            <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full hidden sm:block"></div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <FileText className="w-2.5 h-2.5" />
                                                </div>
                                                <span>
                                                    {od.type === 'INTERNAL' 
                                                        ? (() => {
                                                            const hrs = od.event?.allocatedHours || od.allocatedHours || 0;
                                                            const h = Math.floor(hrs);
                                                            const m = Math.round((hrs % 1) * 60);
                                                            return m > 0 ? `${h}h ${m}m` : `${h}h Cycle`;
                                                          })()
                                                        : `${od.duration} Day Window`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/student/od/${od.id}`}
                                        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-[1.05] active:scale-[0.98]"
                                    >
                                        Inspect Matrix <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                {/* Premium Step Tracker */}
                                <div className="space-y-6 relative z-10">
                                    <div className="flex justify-between items-end mb-2 px-1">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${od.status === 'REJECTED' ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                            {od.status === 'REJECTED' ? 'Critical Failure' : getProgressLabel(od.status)}
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-slate-400">
                                            {calculateProgress(od.status)}% DATA SYNC
                                        </span>
                                    </div>
                                    <div className="relative h-4 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-1">
                                        <div
                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${od.status === 'REJECTED' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 shadow-indigo-500/20'}`}
                                            style={{ width: `${calculateProgress(od.status)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 w-full px-2 pt-2">
                                        <Step label="Initialized" status={getStepStatus(od.status, 0)} />
                                        <Step label="AI Verified" status={getStepStatus(od.status, 1)} />
                                        <Step label="Authorized" status={getStepStatus(od.status, 2)} />
                                    </div>
                                </div>

                                {/* Status Intelligence Message */}
                                <div className={`mt-12 p-6 rounded-[2rem] border transition-all ${od.status === 'REJECTED'
                                    ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'
                                    : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-50 dark:border-indigo-900/20'
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl ${od.status === 'REJECTED' ? 'bg-rose-100/50 dark:bg-rose-900/30 text-rose-500' : 'bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-500'}`}>
                                            {od.status === 'REJECTED' ? <XCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-black text-[10px] uppercase tracking-widest mb-2 ${od.status === 'REJECTED' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                                Satellite Intelligence: {(od.status || "IDLE").replace(/_/g, " ")}
                                            </h4>
                                            <p className={`text-xs font-bold leading-relaxed ${od.status === 'REJECTED' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {getStatusMessage(od.status)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative">
                        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/2 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/10 rotate-3">
                                <CheckCircle2 className="w-12 h-12 text-indigo-600" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">System Nominal</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 max-w-sm mx-auto leading-relaxed">No pending transmissions detected in your local sector. You are all caught up.</p>
                            <Link
                                to="/od-history"
                                className="group inline-flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-2xl shadow-slate-200/50 dark:shadow-none"
                            >
                                Access History <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

// --- Dynamic Helper Functions ---

function calculateProgress(status) {
    if (!status) return 0;
    if (status === "REJECTED") return 0;
    if (status === "APPROVED" || status === "MENTOR_APPROVED") return 100;
    if (status === "DOCS_VERIFIED") return 50; // Halfway
    if (status === "PENDING") return 10; // Started
    return 0;
}

function getProgressLabel(status) {
    if (status === "APPROVED" || status === "MENTOR_APPROVED") return "Approved";
    if (status === "DOCS_VERIFIED") return "Pending Approval";
    if (status === "PENDING") return "AI Verification";
    return "Processing";
}

function Step({ label, status }) {
    // status: 'pending', 'current', 'completed', 'rejected'
    let circleClass = "bg-slate-100 border-slate-200 text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600";
    let icon = "";
    let textClass = "text-slate-300 dark:text-slate-600";

    if (status === "completed") {
        circleClass = "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30";
        textClass = "text-green-600 dark:text-green-400";
        icon = <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />;
    } else if (status === "current") {
        circleClass = "bg-blue-600 border-blue-600 text-white animate-pulse shadow-lg shadow-blue-500/30";
        textClass = "text-blue-600 dark:text-blue-400";
        icon = <Clock className="w-4 h-4 md:w-5 md:h-5" />;
    } else if (status === "rejected") {
        circleClass = "bg-red-500 border-red-500 text-white";
        textClass = "text-red-600 dark:text-red-400";
        icon = <XCircle className="w-4 h-4 md:w-5 md:h-5" />;
    } else if (status === "waiting") {
        // waiting for this step to start
        circleClass = "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700";
        textClass = "text-slate-400 dark:text-slate-500";
        icon = <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />;
    }

    return (
        <div className="flex flex-col items-center gap-2 z-10 w-16 md:w-20">
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-[3px] flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${circleClass}`}>
                {icon}
            </div>
            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-center ${textClass}`}>
                {label}
            </span>
        </div>
    );
}

function getStepStatus(currentStatus, stepIndex) {
    if (currentStatus === "REJECTED") return "rejected";

    // 0: Applied
    // 1: AI Verified
    // 2: Approved (Final)

    const stages = ["PENDING", "DOCS_VERIFIED", "APPROVED"];

    // Treat MENTOR_APPROVED as APPROVED
    let currentIndex = stages.indexOf(currentStatus);
    if (currentStatus === "MENTOR_APPROVED") {
        currentIndex = stages.indexOf("APPROVED");
    }

    if (currentIndex === -1) return "pending";

    if (stepIndex <= currentIndex) return "completed";
    if (stepIndex === currentIndex + 1) return "current";
    return "waiting";
}

function getStatusMessage(status) {
    switch (status) {
        case "PENDING": return "Validating your documents with AI...";
        case "DOCS_VERIFIED": return "Identity verified. Waiting for Mentor approval.";
        case "MENTOR_APPROVED": return "Mentor approved! Final administrative check in progress.";
        case "APPROVED": return "Application Approved! Download your OD pass.";
        case "REJECTED": return "Application Declined. Please check your email for details.";
        default: return "Processing application details...";
    }
}
