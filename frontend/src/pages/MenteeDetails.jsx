import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

export default function MenteeDetails() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

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
            showToast("Failed to remove offer", "error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
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
    }, [studentId]);

    if (loading) return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <p className="text-red-500 font-bold text-xl">{error}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{student.name}</h1>
                        <p className="text-slate-600 dark:text-slate-400">{student.rollNo} • {student.department}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* PLACEMENT INFO */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                💼 Placement Status
                            </h2>
                            {student.placement_status === "NIP" ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                    <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Status</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">NIP</p>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Not Interested in Placement</p>
                                </div>
                            ) : (student.offers && student.offers.length > 0) || student.placement_status === "PLACED" ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Status</p>
                                        <p className="text-lg font-bold text-green-900 dark:text-green-100 uppercase">PLACED</p>
                                    </div>
                                    {student.offers && student.offers.map((offer, idx) => (
                                        <div key={offer.id} className={`${idx > 0 ? "pt-4 border-t border-slate-100 dark:border-slate-800" : ""} group relative`}>
                                            <button
                                                onClick={() => handleRemoveOffer(offer.id)}
                                                className="absolute top-0 right-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                title="Delete Offer"
                                            >
                                                🗑️
                                            </button>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Offer {student.offers.length > 1 ? idx + 1 : ""}</p>
                                            <p className="text-slate-900 dark:text-white font-semibold pr-6">{offer.company.name}</p>
                                            <p className="text-xs text-slate-500">{offer.lpa} LPA • {new Date(offer.placedDate).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                    {(!student.offers || student.offers.length === 0) && (
                                        <p className="text-[10px] text-green-600 mt-1 italic">No offer details recorded yet</p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 text-center">
                                    <p className="text-amber-800 dark:text-amber-400 font-bold italic">Yet to be placed</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contact Info</h2>
                            <div className="space-y-3">
                                <p className="text-sm">
                                    <span className="text-slate-500 block">Email</span>
                                    <span className="text-slate-900 dark:text-white">{student.email}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-slate-500 block">Semester</span>
                                    <span className="text-slate-900 dark:text-white">{student.semester}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* OD HISTORY */}
                    <div className="md:col-span-2">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                📑 OD Application History
                            </h2>

                            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                {student.ods?.length > 0 ? (
                                    student.ods.map((od) => (
                                        <div
                                            key={od.id}
                                            className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${od.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                                        od.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                                            "bg-blue-100 text-blue-700"
                                                        }`}>
                                                        {od.status.replace("_", " ")}
                                                    </span>
                                                    <h3 className="font-bold text-slate-900 dark:text-white mt-1">{od.type} OD</h3>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">#{od.trackerId}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                                <div>
                                                    <p className="text-slate-500 text-xs">Start Date</p>
                                                    <p className="font-semibold dark:text-white">{new Date(od.startDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs">Duration</p>
                                                    <p className="font-semibold dark:text-white">{od.duration} Days</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-slate-500 italic">
                                        No OD applications found for this student.
                                    </div>
                                )}
                            </div>
                        </div>
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
