import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ODStatus() {
    const [activeODs, setActiveODs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchODs = async () => {
            try {
                const res = await api.get("/od/my-ods");
                const ods = Array.isArray(res.data) ? res.data : [];
                const active = ods.filter(od =>
                    od.status && (
                        ["PENDING", "MENTOR_APPROVED", "DOCS_VERIFIED"].includes(od.status) ||
                        (od.status === "APPROVED" && od.endDate && new Date(od.endDate) > new Date())
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
        fetchODs();
        const interval = setInterval(fetchODs, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/student/dashboard"
                            className="inline-flex items-center justify-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors"
                        >
                            ←
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Live OD Tracker</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time status of your active applications</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Status...</p>
                    </div>
                ) : activeODs.length > 0 ? (
                    <div className="space-y-6">
                        {activeODs.map((od) => (
                            <div key={od.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">{(od.type || "OD").toLowerCase()} OD</span>
                                            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                                #{od.trackerId}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {od.offer?.company?.name || "Company OD"} • {od.duration} Days
                                        </p>
                                    </div>
                                    <Link
                                        to={`/student/od/${od.id}`}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        View Details →
                                    </Link>
                                </div>

                                {/* Step Tracker */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-widest ${od.status === 'REJECTED' ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {od.status === 'REJECTED' ? 'Application Rejected' : getProgressLabel(od.status)}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400">
                                            {calculateProgress(od.status)}%
                                        </span>
                                    </div>
                                    <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${od.status === 'REJECTED' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                            style={{ width: `${calculateProgress(od.status)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <Step label="Applied" status={getStepStatus(od.status, 0)} />
                                        <Step label="AI Verified" status={getStepStatus(od.status, 1)} />
                                        <Step label="Mentor" status={getStepStatus(od.status, 2)} />
                                        <Step label="Approved" status={getStepStatus(od.status, 3)} />
                                    </div>
                                </div>

                                {/* Current Status Message */}
                                <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${od.status === 'REJECTED'
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                                    }`}>
                                    <div className="text-xl">
                                        {od.status === 'REJECTED' ? '❌' : 'ℹ️'}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm mb-1 ${od.status === 'REJECTED' ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                            Status: {(od.status || "Unknown").replace(/_/g, " ")}
                                        </h4>
                                        <p className={`text-xs ${od.status === 'REJECTED' ? 'text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {getStatusMessage(od.status)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All Caught Up!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">You have no pending applications directly requiring your attention.</p>
                        <Link
                            to="/od-history"
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            View History Archive
                        </Link>
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
    if (status === "REJECTED") return 0; // Or 100% red? Usually 0 or stopped.
    if (status === "APPROVED") return 100;
    if (status === "MENTOR_APPROVED") return 75;
    if (status === "DOCS_VERIFIED") return 50;
    if (status === "PENDING") return 25; // Applied
    return 10;
}

function getProgressLabel(status) {
    if (status === "APPROVED") return "Completed";
    if (status === "MENTOR_APPROVED") return "Final Review";
    if (status === "DOCS_VERIFIED") return "Mentor Review";
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
        icon = "✓";
    } else if (status === "current") {
        circleClass = "bg-blue-600 border-blue-600 text-white animate-pulse shadow-lg shadow-blue-500/30";
        textClass = "text-blue-600 dark:text-blue-400";
        icon = "●";
    } else if (status === "rejected") {
        circleClass = "bg-red-500 border-red-500 text-white";
        textClass = "text-red-600 dark:text-red-400";
        icon = "✕";
    } else if (status === "waiting") {
        // waiting for this step to start
        circleClass = "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700";
        textClass = "text-slate-400 dark:text-slate-500";
        icon = "○";
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
    // 2: Mentor
    // 3: Approved

    const stages = ["PENDING", "DOCS_VERIFIED", "MENTOR_APPROVED", "APPROVED"];
    const currentIndex = stages.indexOf(currentStatus);

    if (currentIndex === -1) return "pending"; // Unknown state

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
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
