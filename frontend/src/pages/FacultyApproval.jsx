import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import usePolling from "../hooks/usePolling";
import LoadingButton from "../components/LoadingButton";
import {
    ArrowLeft,
    Sparkles,
    Search,
    FileText,
    ArrowLeftCircle,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Clock,
    User,
    Calendar,
    ExternalLink
} from "lucide-react";

/**
 * FacultyApproval component - Review portal for mentors to audit student OD requests.
 * Displays a searchable list of pending applications with AI-assisted verification 
 * metrics and direct document access for informed approval/rejection.
 */
export default function FacultyApproval() {
    const navigate = useNavigate();
    const [ods, setOds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOd, setSelectedOd] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [processing, setProcessing] = useState(null); // null | 'APPROVE' | 'REJECT'
    const { showToast } = useToast();

    const fetchPendingODs = useCallback(async () => {
        try {
            const res = await api.get("/od/mentor/pending");
            setOds(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingODs();
    }, [fetchPendingODs]);

    // Auto-refresh every 30 s so new student submissions appear without reload
    usePolling(fetchPendingODs, 30000);

    const handleUpdateStatus = async (id, status) => {
        if (processing) return;
        const action = status === "REJECTED" ? "REJECT" : "APPROVE";
        try {
            setProcessing(action);
            await api.put(`/od/update-status/${id}`, { status, remarks });
            setSelectedOd(null);
            setRemarks("");
            fetchPendingODs();
            showToast(`OD ${status.toLowerCase()} successfully`, "success");
        } catch (err) {
            console.error(err);
            showToast("Failed to update status", "error");
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">OD Approvals</h1>
                        <p className="text-slate-600 dark:text-slate-400">Review and approve OD requests from your mentored students.</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors font-medium border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>

                {ods.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-20 text-center border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-emerald-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">All caught up!</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">No pending OD requests at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List */}
                         <div className="lg:col-span-1 space-y-4">
                             {ods.map((od) => (
                                 <div
                                     key={od.id}
                                     onClick={() => setSelectedOd(od)}
                                     role="button"
                                     aria-pressed={selectedOd?.id === od.id}
                                     aria-label={`Review OD request from ${od.student?.name} (${od.trackerId})`}
                                     className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOd?.id === od.id
                                         ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                         : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-blue-300 shadow-sm"
                                         }`}
                                 >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{od.trackerId}</span>
                                        <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" /> {od.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-slate-400" /> {od.student?.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3" /> {od.student?.rollNo} • {od.duration} days
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Detail View */}
                        <div className="lg:col-span-2">
                            {selectedOd ? (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
                                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">Review OD - {selectedOd.trackerId}</h3>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                            Activity ID: <span className="font-mono text-blue-600 dark:text-blue-400">{selectedOd.activityId}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* OCR Results Badge */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                                            <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4" /> AI Verification Results
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {Object.entries(selectedOd.verificationDetails || {})
                                                    .filter(([key]) => !['ocrFailed', 'fallbackReasons', 'docType', 'searched', 'dates'].includes(key))
                                                    .map(([key, val]) => {
                                                        const isMapped = val && typeof val === 'object' ? val.found : !!val;
                                                        return (
                                                            <div key={key} className="text-center">
                                                                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">{key === 'rollNo' ? 'Roll No' : key}</p>
                                                                <span className={`text-xs px-2 py-1 rounded-md font-bold ${isMapped ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {isMapped ? 'MAPPED' : 'FAILED'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                            {selectedOd.verificationDetails?.ocrFailed && (
                                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">AI Verification Issues Flagged:</p>
                                                    <ul className="list-disc list-inside text-[11px] text-red-600 dark:text-red-300 ml-4">
                                                        {(selectedOd.verificationDetails.fallbackReasons || []).map((reason, idx) => (
                                                            <li key={idx}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* Student Info */}
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Student Name</label>
                                                <p className="font-medium text-slate-900 dark:text-white">{selectedOd.student?.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Period</label>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {new Date(selectedOd.startDate).toLocaleDateString()} - {new Date(selectedOd.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Documents */}
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block mb-2">Attached Documents</label>
                                            <div className="flex gap-4">
                                                <a
                                                    href={`${BASE_URL}/${selectedOd.proofFile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-blue-500" />
                                                        <span className="font-bold">Aim & Objective</span>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                                <a
                                                    href={`${BASE_URL}/${selectedOd.offerFile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-indigo-500" />
                                                        <span className="font-bold">Offer Letter</span>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                                            <textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Add remarks for approval/rejection..."
                                                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                            <div className="flex gap-4">
                                                <LoadingButton
                                                    onClick={() => handleUpdateStatus(selectedOd.id, "REJECTED")}
                                                    isLoading={processing === "REJECT"}
                                                    loadingText="Rejecting..."
                                                    className="flex-1 py-4 px-6 rounded-xl border-2 border-red-100 dark:border-red-900/30 text-red-600 font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10"
                                                >
                                                    <XCircle className="w-5 h-5" /> Reject Request
                                                </LoadingButton>
                                                <LoadingButton
                                                    onClick={() => handleUpdateStatus(selectedOd.id, "MENTOR_APPROVED")}
                                                    isLoading={processing === "APPROVE"}
                                                    loadingText="Approving..."
                                                    className="flex-1 py-4 px-6 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" /> Approve Training
                                                </LoadingButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed flex flex-col items-center justify-center p-12 text-center text-slate-500 shadow-sm min-h-[400px]">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                        <ArrowLeftCircle className="w-10 h-10 text-slate-300 animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Select a request</h3>
                                    <p className="max-w-xs mt-2 font-medium">Choose an OD application from the list to review the details and verify documents.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
