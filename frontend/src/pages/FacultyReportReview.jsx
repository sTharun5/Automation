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
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Review Internship Reports</h1>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">All Caught Up!</h3>
                        <p className="text-slate-500 mt-1 font-medium">No pending internship reports to review.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{report.student.name}</h3>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono px-2 py-1 rounded">{report.student.rollNo}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Submitted on {new Date(report.createdAt).toLocaleDateString()}</p>

                                    <a
                                        href={`${BASE_URL}/${report.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 transition-colors group"
                                    >
                                        <FileText className="w-4 h-4" /> View Report PDF <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => openActionModal(report, 'APPROVED')}
                                        className="flex-1 md:flex-none bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-shadow shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => openActionModal(report, 'REJECTED')}
                                        className="flex-1 md:flex-none bg-white dark:bg-slate-800 text-red-600 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Action Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">
                            {action === 'APPROVED' ? "Approve Report" : "Reject Report"}
                        </h2>
                        <p className="text-slate-500 mb-4">
                            {action === 'APPROVED'
                                ? `Are you sure you want to approve the report for ${selectedReport.student.name}? This will allow them to apply for new ODs.`
                                : `Please provide a reason for rejecting the report for ${selectedReport.student.name}.`
                            }
                        </p>

                        <textarea
                            placeholder={action === 'APPROVED' ? "Optional remarks..." : "Reason for rejection (Required)..."}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
                            rows="3"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleAction}
                                disabled={processing}
                                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {processing ? "Processing..." : "Confirm"}
                            </button>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
