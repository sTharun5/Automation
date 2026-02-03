import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";

export default function FacultyApproval() {
    const navigate = useNavigate();
    const [ods, setOds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOd, setSelectedOd] = useState(null);
    const [remarks, setRemarks] = useState("");
    const { showToast } = useToast();

    useEffect(() => {
        fetchPendingODs();
    }, []);

    const fetchPendingODs = async () => {
        try {
            const res = await api.get("/od/mentor/pending");
            setOds(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/od/update-status/${id}`, { status, remarks });
            setSelectedOd(null);
            setRemarks("");
            fetchPendingODs();
            showToast("Status updated successfully", "success");
        } catch (err) {
            showToast("Failed to update status", "error");
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
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        <span>←</span> Back
                    </button>
                </div>

                {ods.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="text-4xl mb-4">✨</div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All caught up!</h3>
                        <p className="text-slate-600 dark:text-slate-400">No pending OD requests at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List */}
                        <div className="lg:col-span-1 space-y-4">
                            {ods.map((od) => (
                                <div
                                    key={od.id}
                                    onClick={() => setSelectedOd(od)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOd?.id === od.id
                                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                        : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-blue-300 shadow-sm"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{od.trackerId}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            {od.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{od.student?.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{od.student?.rollNo} • {od.duration} days</p>
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
                                                <span>🔍</span> AI Verification Results
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {Object.entries(selectedOd.verificationDetails || {}).map(([key, val]) => (
                                                    <div key={key} className="text-center">
                                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">{key}</p>
                                                        <span className={`text-xs px-2 py-1 rounded-md font-bold ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {val ? 'MAPPED' : 'FAILED'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
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
                                                    href={`http://localhost:3000/${selectedOd.proofFile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300"
                                                >
                                                    <span>📄</span> Aim & Objective
                                                </a>
                                                <a
                                                    href={`http://localhost:3000/${selectedOd.offerFile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300"
                                                >
                                                    <span>📜</span> Offer Letter
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
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedOd.id, "REJECTED")}
                                                    className="flex-1 py-3 px-6 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all"
                                                >
                                                    Reject Request
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedOd.id, "MENTOR_APPROVED")}
                                                    className="flex-1 py-3 px-6 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all"
                                                >
                                                    Approve Training
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed flex flex-col items-center justify-center p-12 text-center text-slate-500">
                                    <div className="text-6xl mb-4">👈</div>
                                    <h3 className="text-lg font-bold">Select a request</h3>
                                    <p>Choose an OD application from the list to review the details and verify documents.</p>
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
