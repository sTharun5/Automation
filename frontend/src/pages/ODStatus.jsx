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
        const interval = setInterval(fetchODs, 10000);
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
                                <div className="relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                    <div className="relative flex justify-between">
                                        <Step label="Applied" status="completed" />
                                        <Step label="Docs" status={getStepStatus(od.status, 1)} />
                                        <Step label="Mentor" status={getStepStatus(od.status, 2)} />
                                        <Step label="Active" status={getStepStatus(od.status, 3)} />
                                    </div>
                                </div>

                                {/* Current Status Message */}
                                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                                    <div className="text-xl">ℹ️</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Status: {(od.status || "Unknown").replace(/_/g, " ")}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
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

function Step({ label, status }) {
    // status: 'pending', 'active', 'completed', 'rejected'
    let circleClass = "bg-slate-100 border-slate-200 text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600";
    let icon = "";

    if (status === "completed") {
        circleClass = "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30";
        icon = "✓";
    } else if (status === "active") {
        circleClass = "bg-blue-600 border-blue-600 text-white animate-pulse shadow-lg shadow-blue-500/30";
        icon = "●";
    } else if (status === "rejected") {
        circleClass = "bg-red-500 border-red-500 text-white";
        icon = "✕";
    }

    return (
        <div className="flex flex-col items-center gap-2 z-10 w-20">
            <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${circleClass}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${status === 'pending' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'}`}>
                {label}
            </span>
        </div>
    );
}

function getStepStatus(currentStatus, stepIndex) {
    if (currentStatus === "REJECTED") return "rejected";

    // Step 1: Docs Verification (Auto/AI)
    if (stepIndex === 1) {
        if (currentStatus === "PENDING") return "active";
        return "completed"; // DOCS_VERIFIED, MENTOR_APPROVED, APPROVED
    }
    // Step 2: Mentor Approval
    if (stepIndex === 2) {
        if (currentStatus === "PENDING") return "pending"; // Wait for docs
        if (currentStatus === "DOCS_VERIFIED") return "active"; // Waiting for mentor
        return "completed"; // MENTOR_APPROVED, APPROVED
    }
    // Step 3: Final/Active
    if (stepIndex === 3) {
        if (currentStatus === "APPROVED" || currentStatus === "MENTOR_APPROVED") return "completed";
        if (currentStatus === "DOCS_VERIFIED") return "active"; // Waiting for mentor
        return "pending";
    }
    return "pending";
}

function getStatusMessage(status) {
    switch (status) {
        case "PENDING": return "Validating your documents with AI...";
        case "DOCS_VERIFIED": return "Docs Verified! Waiting for Mentor approval.";
        case "MENTOR_APPROVED": return "Mentor Approved! Your OD has officially started.";
        case "APPROVED": return "All set! Your OD is officially active.";
        default: return "Check details for more information.";
    }
}
