import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import {
    ArrowLeft,
    Briefcase,
    Trash2,
    Phone,
    FileText,
    Building2,
    GraduationCap,
    CheckCircle2,
    Clock,
    XCircle,
    Mail,
    UserPlus,
    UserMinus,
    AlertCircle,
    Calendar
} from "lucide-react";

export default function MenteeDetails() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();
    const currentUser = JSON.parse(sessionStorage.getItem("user"));

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false
    });

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/faculty/mentee/${studentId}`);
            setStudent(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch student details");
        } finally {
            setLoading(false);
        }
    };

    const confirmRemoveOffer = async (offerId) => {
        try {
            await api.delete(`/students/offer/${offerId}`);
            showToast("Offer removed successfully", "success");
            fetchDetails(); // Refresh
        } catch (err) {
            console.error(err);
            showToast("Failed to remove offer", "error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleRevokeCoordinator = async (eventId) => {
        if (!window.confirm("Are you sure you want to revoke this student's coordinator access?")) return;

        const reason = window.prompt("Reason for revocation (Required):");
        if (reason === null) return; // User cancelled prompt
        if (!reason.trim()) return showToast("Reason is required to revoke coordinator access", "error");

        try {
            await api.put(`/events/${eventId}/revoke-coordinator`, { reason });
            showToast("Student Coordinator access revoked successfully.", "success");
            fetchDetails(); // Refresh
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to revoke coordinator", "error");
        }
    };

    const handleRemoveOffer = (offerId) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Offer",
            message: "Are you sure you want to remove this offer? This action cannot be undone.",
            onConfirm: () => confirmRemoveOffer(offerId),
            isDanger: true,
            confirmText: "Yes, Remove"
        });
    };

    useEffect(() => {
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    if (loading) return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
                    <XCircle className="w-10 h-10 text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Subject Termination Error</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-xs leading-relaxed mb-8">{error}</p>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-8 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg"
                >
                    Recycle Session
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white dark:bg-slate-900 h-12 w-12 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center group shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{student.name}</h1>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-[0.2em] truncate">{student.rollNo} • {student.department}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* PLACEMENT INFO */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
                            
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 relative z-10">
                                <Briefcase className="w-4 h-4 text-blue-500" /> Career Matrix
                            </h2>
                            
                            <div className="relative z-10">
                                {student.placement_status === "NIP" ? (
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Sector</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">NIP</p>
                                        <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tight">Neutral Priority Interest</p>
                                    </div>
                                ) : ((student.offers && student.offers.length > 0) || student.placement_status === "PLACED") ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800/50">
                                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Status Protocol</p>
                                            <p className="text-lg font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">SUCCESS: PLACED</p>
                                        </div>
                                        {student.offers && student.offers.map((offer, idx) => (
                                            <div key={offer.id} className={`${idx > 0 ? "pt-5 border-t border-slate-100 dark:border-slate-800" : ""} group/offer relative`}>
                                                <button
                                                    onClick={() => handleRemoveOffer(offer.id)}
                                                    className="absolute top-0 right-0 text-rose-500 opacity-0 group-hover/offer:opacity-100 transition-all p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"
                                                    title="Decommission Offer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Deployment {student.offers.length > 1 ? idx + 1 : ""}</p>
                                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight pr-8">{offer.company.name}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">{offer.lpa} LPA</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(offer.placedDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border-2 border-amber-100 dark:border-amber-800/50 text-center">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
                                        </div>
                                        <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Awaiting Induction</p>
                                        <p className="text-[10px] text-amber-600/60 mt-1 font-bold uppercase tracking-tight">In Active Selection Pool</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-indigo-500" /> Comm Links
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Neural ID</label>
                                    <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 group cursor-pointer hover:text-indigo-500 transition-colors">
                                        <Mail className="w-3.5 h-3.5 opacity-50" /> {student.email}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Semester Phase</label>
                                    <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">Cycle {student.semester}</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Guardian Uplink</label>
                                    {student.parentPhone ? (
                                        <a href={`tel:${student.parentPhone}`} className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors flex items-center gap-2 group">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            {student.parentPhone}
                                        </a>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic font-medium">Uplink Unestablished</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OD HISTORY */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-950 p-6 sm:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-indigo-500/5 h-fit relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                            <h2 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight relative z-10">
                                <FileText className="w-5 h-5 text-indigo-500" /> Dispatch Archives
                            </h2>

                            <div className="space-y-4 relative z-10 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                                {student.ods?.length > 0 ? (
                                    student.ods.map((od) => (
                                        <div
                                            key={od.id}
                                            className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all hover:bg-white dark:hover:bg-slate-900 group/card active:scale-[0.99]"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                                                <div className="min-w-0">
                                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${(od.status === "APPROVED" || od.status === "MENTOR_APPROVED") && new Date(od.endDate).setHours(16, 20, 0, 0) < new Date().getTime() ? "bg-slate-200 text-slate-700" :
                                                        (od.status === "APPROVED" || od.status === "MENTOR_APPROVED") ? "bg-emerald-100 text-emerald-700" :
                                                            od.status === "REJECTED" ? "bg-rose-100 text-rose-700" :
                                                                "bg-amber-100 text-amber-700"
                                                        }`}>
                                                        {((od.status === "APPROVED" || od.status === "MENTOR_APPROVED") && new Date(od.endDate).setHours(16, 20, 0, 0) < new Date().getTime() ? "COMPLETED" : od.status).replace("_", " ")}
                                                    </span>
                                                    <h3 className="font-black text-slate-900 dark:text-white mt-3 uppercase tracking-tight truncate group-hover/card:text-indigo-600 transition-colors">
                                                        {od.type === 'INTERNAL' ? (od.event?.name || "Internal System Event") : (od.offer?.company?.name || "Corporate OD Deployment")}
                                                    </h3>
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">#{od.trackerId}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 text-sm mt-4">
                                                <div className="space-y-1">
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Temporal Ingress</p>
                                                    <p className="font-black dark:text-white uppercase tracking-tight text-xs">{new Date(od.startDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{od.type === 'INTERNAL' ? "Audit Value" : "Dilation Phase"}</p>
                                                    <p className="font-black text-indigo-500 uppercase tracking-tight text-xs flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 opacity-60" />
                                                        {od.type === 'INTERNAL' ? (() => {
                                                            const hrs = od.event?.allocatedHours || 0;
                                                            const h = Math.floor(hrs);
                                                            const m = Math.round((hrs % 1) * 60);
                                                            return m > 0 ? `${h}h ${m}m` : `${h} Cycles`;
                                                        })() : `${od.duration} Quantum Days`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-24 text-center">
                                         <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8 text-slate-200 dark:text-slate-800" />
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic leading-relaxed max-w-xs mx-auto">Neural records unpopulated for current subject signature.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* COORDINATED EVENTS */}
                        {student.coordinatedEvents?.length > 0 && (
                            <div className="bg-white dark:bg-slate-950 p-6 sm:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-slide-up">
                                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                                    <Building2 className="w-5 h-5 text-emerald-500" /> Sector Coordinations
                                </h2>
                                <div className="space-y-4">
                                    {student.coordinatedEvents.map((event) => {
                                        const isStaffCoordinator = currentUser && currentUser.id == event.staffCoordinatorId;
                                        return (
                                            <div key={event.id} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm leading-tight group-hover:text-emerald-500 transition-colors">{event.name}</h3>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">
                                                                {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest mt-4 inline-block ${event.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                            {event.status} Protocol
                                                        </span>
                                                    </div>
                                                    {isStaffCoordinator && (
                                                        <button
                                                            onClick={() => handleRevokeCoordinator(event.id)}
                                                            className="w-full sm:w-auto px-5 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-rose-500/5"
                                                        >
                                                            <UserMinus className="w-4 h-4" /> Revoke Auth
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
            <Footer />
        </div>
    );
}
