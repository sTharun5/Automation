import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import {
    ArrowLeft,
    FileText,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Clock,
    User,
    AlertCircle,
    Check
} from "lucide-react";

export default function FacultyReportReview() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Modal for Approve/Reject
    const [selectedReport, setSelectedReport] = useState(null);
    const [action, setAction] = useState(""); // 'APPROVED' | 'REJECTED'
    const [remarks, setRemarks] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            // We need a new endpoint to get all pending reports for a mentor
            // For now, let's assume we filter mentees or have a specific endpoint.
            // Let's create/use a dedicated endpoint: /api/faculty/reports/pending
            const res = await api.get("/faculty/reports/pending");
            setReports(res.data);
        } catch (err) {
            console.error("Fetch reports error", err);
            // showToast("Failed to fetch reports", "error"); 
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!remarks && action === 'REJECTED') {
            showToast("Remarks are required for rejection", "warning");
            return;
        }

        setProcessing(true);
        try {
            await api.put(`/reports/${selectedReport.id}/status`, {
                status: action,
                remarks: remarks
            });
            showToast(`Report ${action === 'APPROVED' ? 'Approved' : 'Rejected'} Successfully`, "success");
            setSelectedReport(null);
            setRemarks("");
            fetchReports(); // Refresh list
        } catch (err) {
            console.error(err);
            showToast("Failed to update status", "error");
        } finally {
            setProcessing(false);
        }
    };

    const openActionModal = (report, act) => {
        setSelectedReport(report);
        setAction(act);
        setRemarks("");
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Audit Archive</h1>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">Review and validate student internship reports.</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm active:scale-95 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Accessing Crypts...</span>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 sm:p-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] flex items-center justify-center mb-6 animate-pulse">
                            <Check className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vault Cleared</h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-[0.2em] mt-3">No pending internship reports found in the system.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 p-6 sm:p-8 rounded-[2rem] shadow-sm flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 shadow-inner group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-colors">
                                            {report.student?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{report.student.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.student.rollNo}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{new Date(report.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={`${BASE_URL}/${report.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] hover:border-indigo-400 dark:hover:border-indigo-500 transition-all active:scale-95 group/btn"
                                    >
                                        <FileText className="w-4 h-4 text-indigo-500 group-hover/btn:scale-110 transition-transform" />
                                        Launch Report PDF
                                        <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
                                    </a>
                                </div>

                                <div className="flex gap-3 w-full lg:w-auto shrink-0">
                                    <button
                                        onClick={() => openActionModal(report, 'APPROVED')}
                                        className="flex-1 lg:flex-none bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 group/accept"
                                    >
                                        <CheckCircle2 className="w-4 h-4 group-hover/accept:scale-125 transition-transform" /> Approve
                                    </button>
                                    <button
                                        onClick={() => openActionModal(report, 'REJECTED')}
                                        className="flex-1 lg:flex-none bg-white dark:bg-slate-800 text-rose-600 border-2 border-rose-50 dark:border-rose-900/20 hover:bg-rose-600 hover:text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95 group/reject shadow-lg shadow-rose-500/5"
                                    >
                                        <XCircle className="w-4 h-4 group-hover/reject:rotate-90 transition-transform" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Action Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedReport(null)}></div>
                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 max-w-lg w-full shadow-2xl relative animate-slide-up border border-white/10">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-lg ${action === 'APPROVED' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                            {action === 'APPROVED' ? <CheckCircle2 className="w-8 h-8 text-white" /> : <XCircle className="w-8 h-8 text-white" />}
                        </div>
                        
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                            {action === 'APPROVED' ? "Authorize Report" : "Deny Access"}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">
                            {action === 'APPROVED'
                                ? `Initiating final authorization for dossier ${selectedReport.student.name}. This is an irreversible action.`
                                : `Declining report submission for student ${selectedReport.student.name}. Provide mandatory audit failure reasoning.`
                            }
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Auditor Notes</label>
                                <textarea
                                    placeholder={action === 'APPROVED' ? "Optional validation remarks..." : "Mandatory rejection diagnostics..."}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 min-h-[120px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-medium transition-all transition-colors resize-none"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleAction}
                                    disabled={processing}
                                    className={`flex-1 py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white transition-all active:scale-95 shadow-xl ${action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}
                                >
                                    {processing ? "Synching..." : "Confirm Action"}
                                </button>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Abort
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
