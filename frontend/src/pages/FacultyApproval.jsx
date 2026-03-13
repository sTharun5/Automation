import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
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
            console.error(err);
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">OD Verifications</h1>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">Audit and validate student off-duty requests.</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm active:scale-95 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                </div>

                {ods.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 sm:p-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] flex items-center justify-center mb-6 animate-bounce-slow">
                            <Sparkles className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Queue Decimated</h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-[0.2em] mt-3">All requests have been successfully audited.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List */}
                        <div className="lg:col-span-1 space-y-4 max-h-[70vh] lg:max-h-none overflow-y-auto pr-2 custom-scrollbar">
                            {ods.map((od) => (
                                <div
                                    key={od.id}
                                    onClick={() => setSelectedOd(od)}
                                    className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all active:scale-[0.98] ${selectedOd?.id === od.id
                                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 shadow-lg shadow-indigo-500/5"
                                        : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:border-indigo-300 shadow-sm"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${selectedOd?.id === od.id ? 'text-indigo-600' : 'text-slate-400'}`}>Request ID</span>
                                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{od.trackerId}</span>
                                        </div>
                                        <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1.5 ${selectedOd?.id === od.id ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                            <Clock className="w-3 h-3" /> {od.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black transition-colors ${selectedOd?.id === od.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            {od.student?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-slate-900 dark:text-white truncate text-xs sm:text-sm uppercase tracking-tight">{od.student?.name}</h4>
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate uppercase tracking-widest">{od.student?.rollNo}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Detail View */}
                        <div className="lg:col-span-2">
                            {selectedOd ? (
                                <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-slide-up sticky top-8">
                                    <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                        <div className="min-w-0">
                                            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">Review Dossier</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest truncate">{selectedOd.trackerId}</p>
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-black text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm shrink-0 uppercase tracking-widest">
                                            Activity: <span className="text-indigo-600 dark:text-indigo-400">{selectedOd.activityId}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                        {/* AI Verification Results */}
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
                                            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" /> AI Diagnostic Analysis
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10">
                                                {Object.entries(selectedOd.verificationDetails || {}).map(([key, val]) => (
                                                    <div key={key} className="bg-white dark:bg-slate-800/50 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                                        <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest mb-2">{key}</p>
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${val ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'}`}>
                                                            {val ? 'MAPPED' : 'FAILED'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Student Info */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Primary Subject</label>
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm sm:text-base leading-tight">{selectedOd.student?.name}</p>
                                                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{selectedOd.student?.rollNo} • {selectedOd.student?.department}</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Time Dimension</label>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                                    <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight uppercase">
                                                        {new Date(selectedOd.startDate).toLocaleDateString()} — {new Date(selectedOd.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{selectedOd.duration} Lunar Cycles Duration</p>
                                            </div>
                                        </div>

                                        {/* Documents */}
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Verification Attachments</label>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <a
                                                    href={`${BASE_URL}/${selectedOd.proofFile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-between group active:scale-[0.98] shadow-sm"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-tight block">Aim & Objective</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Primary Documentation</span>
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                </a>
                                                <a
                                                    href={`${BASE_URL}/${selectedOd.offerFile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-between group active:scale-[0.98] shadow-sm"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-tight block">Offer Letter</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Validation Key</span>
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                                                </a>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Auditor Remarks</label>
                                                <textarea
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                    placeholder="Input validation notes or rejection reasoning..."
                                                    className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none text-sm font-medium resize-none min-h-[120px]"
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedOd.id, "REJECTED")}
                                                    className="flex-1 py-4 px-8 rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-rose-500/5"
                                                >
                                                    <XCircle className="w-5 h-5" /> Deny Access
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedOd.id, "MENTOR_APPROVED")}
                                                    className="flex-2 sm:flex-[1.5] py-4 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                                >
                                                    <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> Confirm Verification
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-slate-50 dark:bg-slate-950 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center min-h-[400px] group transition-all hover:bg-white dark:hover:bg-slate-900">
                                    <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                        <ArrowLeftCircle className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Selection Required</h3>
                                    <p className="max-w-xs mt-3 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Choose an available OD application dossier from the registry to initiate verification.</p>
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
