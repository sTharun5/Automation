
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../context/ToastContext";
import Footer from "../components/Footer";
import {
    ArrowLeft,
    Search,
    User,
    Building2,
    Activity,
    History,
    Mail,
    GraduationCap,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCcw,
    ChevronRight,
    PieChart,
    Users,
    ShieldAlert,
    Terminal
} from "lucide-react";

export default function ManageODs() {
    const navigate = useNavigate();
    const [searchType, setSearchType] = useState("student"); // 'student' | 'company'
    const [selectedItem, setSelectedItem] = useState(null);
    const [ods, setODs] = useState([]);
    const [placedStudents, setPlacedStudents] = useState([]); // New state for placed list
    const [viewMode, setViewMode] = useState("list"); // 'list' | 'stats'
    const [listType, setListType] = useState('ods'); // 'ods' | 'placed'
    const [statusFilter, setStatusFilter] = useState("active"); // 'active' | 'history'
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false,
        remarks: ""
    });

    // Fetch Suggestions
    const fetchSuggestions = async (query) => {
        if (searchType === "student") {
            const res = await api.get(`/students/search?q=${encodeURIComponent(query)}`);
            return res.data; // Expecting [{id, name, rollNo, ...}]
        } else {
            const res = await api.get(`/od/admin/company-stats?query=${encodeURIComponent(query)}`);
            return res.data; // Expecting [{id, name, placedCount, activeOdCount}]
        }
    };


    const handleSearch = async (query) => {
        if (!query) return;
        setLoading(true);
        try {
            const results = await fetchSuggestions(query);
            if (results && results.length > 0) {
                // Automatically select the first result
                handleSelect(results[0]);
            } else {
                showToast("No results found", "error");
            }
        } catch (error) {
            console.error("Search Submit Error:", error);
            showToast("Failed to search. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (item) => {
        setSelectedItem(item);
        setODs([]); // Clear previous results
        setLoading(true);
        try {
            if (searchType === "student") {
                // Fetch FULL student details (Dashboard view for Admin)
                const res = await api.get(`/students/${item.id}/full-details`);

                // Set Selected Item to the FULL student profile from response
                setSelectedItem({
                    ...res.data.student,
                    placement: res.data.placement,
                    odStats: res.data.odStats
                });

                setODs(res.data.history); // ✅ Store history in ODs state
                setViewMode("student-stats");
                setListType('ods');
            } else {
                // Company Selected -> Show Stats View
                setViewMode("stats");
                setODs([]); // Clear any previous list
                setPlacedStudents([]);
                setListType('ods');
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch details", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePlacedStatsClick = async (companyName) => {
        setLoading(true);
        try {
            const res = await api.get(`/od/admin/company-placed`, {
                params: { company: companyName }
            });
            setPlacedStudents(res.data);
            setListType('placed');
            setViewMode('list');
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch placed students", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyStatsClick = async (companyName) => {
        setLoading(true);
        try {
            const res = await api.get(`/od/admin/all`, {
                params: { company: companyName }
            });
            setODs(res.data);
            setListType('ods');
            setStatusFilter('active');
            setViewMode('list');
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch company ODs", "error");
        } finally {
            setLoading(false);
        }
    };

    /* ================= STUDENT ACTIONS ================= */
    const handleStudentHistoryClick = () => {
        setStatusFilter('history');
        setViewMode('list');
    };

    const handleStudentStatusClick = () => {
        setStatusFilter('active'); // This triggers the getFilteredODs to show only active
        setViewMode('list');
    };

    // ... existing code ...

    /* ================= RENDER ================= */

    // ... inside return ...



    /* ================= CANCEL OD ================= */
    const confirmCancelOD = async (odId, remarks) => {
        try {
            await api.put(`/od/update-status/${odId}`, {
                status: "REJECTED",
                remarks: remarks
            });
            showToast("OD Cancelled Successfully", "success");

            // Update local state directly to instantly reflect cancellation
            setODs(prevODs => prevODs.map(od =>
                od.id === odId
                    ? { ...od, status: "REJECTED" }
                    : od
            ));
        } catch (err) {
            console.error(err);
            showToast("Failed to cancel OD", "error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false, remarks: "" });
        }
    };

    const handleCancelOD = (odId) => {
        setConfirmModal({
            isOpen: true,
            title: "Cancel OD",
            message: "Are you sure you want to cancel this OD? You can add optional remarks for the student.",
            onConfirm: (remarks) => confirmCancelOD(odId, remarks),
            isDanger: true,
            confirmText: "Yes, Cancel",
            showInput: true,
            inputPlaceholder: "Reason for cancellation (Optional)...",
            remarks: ""
        });
    };

    /* ================= MANUAL ERP SYNC ================= */
    const handleErpSync = async (odId) => {
        try {
            const res = await api.post(`/od/${odId}/sync-erp`);
            if (res.data.erpSyncStatus === 'FAILED') {
                showToast(res.data.message || "Failed to trigger ERP Sync", "error");
            } else {
                showToast(res.data.message || "ERP Sync Triggered", "success");
            }

            // Update local state directly to ensure immediate UI feedback
            setODs(prevODs => prevODs.map(od =>
                od.id === odId
                    ? { ...od, erpSyncStatus: res.data.erpSyncStatus }
                    : od
            ));
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to trigger ERP Sync", "error");
        }
    };

    /* ================= FILTER LOGIC ================= */
    const getFilteredODs = () => {
        if (statusFilter === 'history') return ods;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return ods.filter(od => {
            const isRejected = od.status === 'REJECTED';
            const isExpired = new Date(od.endDate).setHours(16, 20, 0, 0) < new Date().getTime() && (od.status === 'APPROVED' || od.status === 'MENTOR_APPROVED');
            // Show if NOT rejected AND NOT expired (so pending, approved future, etc.)
            return !isRejected && !isExpired;
        });
    }

    const isPastApproved = (od) => {
        return (od.status === "APPROVED" || od.status === "MENTOR_APPROVED") && new Date(od.endDate).setHours(16, 20, 0, 0) < new Date().getTime();
    };

    const getDerivedStatus = (od) => {
        if (isPastApproved(od)) return "COMPLETED";
        return od.status;
    };

    const filteredODs = getFilteredODs();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors selection:bg-indigo-500 selection:text-white overflow-x-hidden">
            <Header />
            
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 md:py-20 max-w-[1400px] mx-auto w-full">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-4">
                    <div className="space-y-4">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="group flex items-center gap-3 text-slate-400 hover:text-indigo-500 transition-all text-[10px] font-black uppercase tracking-[0.3em]"
                        >
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-indigo-500/10 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            Return to Command
                        </button>
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                OD Protocol <span className="text-indigo-500">Audit</span>
                            </h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-tight max-w-xl">
                                Inter-sector synchronization hub. Monitor, audit, and neutralize entity On-Duty streams across the neural network.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Intelligence Section */}
                <div className="relative group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 md:p-16 rounded-[4rem] shadow-2xl shadow-slate-200/50 dark:shadow-none mb-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-indigo-500/10"></div>
                    
                    <div className="relative z-10 space-y-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                    <Search className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Intelligence Search</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Search Vector</p>
                                </div>
                            </div>

                            {/* Tactical Toggle */}
                            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={() => { setSearchType("student"); setSelectedItem(null); setODs([]); }}
                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 ${
                                        searchType === "student" 
                                        ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-xl shadow-indigo-500/10" 
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <User className="w-4 h-4" /> Student Node
                                </button>
                                <button
                                    onClick={() => { setSearchType("company"); setSelectedItem(null); setODs([]); }}
                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 ${
                                        searchType === "company" 
                                        ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-xl shadow-indigo-500/10" 
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <Building2 className="w-4 h-4" /> Company Relay
                                </button>
                            </div>
                        </div>

                        {/* Neural Input */}
                        <div className="relative group/input">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-3xl opacity-0 group-focus-within/input:opacity-20 transition-opacity blur-xl"></div>
                            <SearchInput
                                placeholder={searchType === "student" ? "COMMAND: Identify Student Node [Name/Roll]..." : "COMMAND: Identify Company Relay [Name]..."}
                                fetchSuggestions={fetchSuggestions}
                                onSearch={handleSearch}
                                onSelect={handleSelect}
                                icon={<Terminal className="w-6 h-6 text-indigo-500" />}
                                containerClassName="bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 p-2 rounded-[2.5rem] focus-within:border-indigo-500 transition-all duration-500"
                                renderSuggestion={(item) => (
                                    <div className="flex items-center gap-6 p-4 hover:bg-indigo-500/5 transition-colors">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                            {searchType === "student" ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                                {item.name}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                                                {searchType === "student"
                                                    ? <><span className="text-indigo-500 font-mono">{item.rollNo}</span> · {item.odStats?.remainingDays} Days Alpha</>
                                                    : <>Placements: <span className="text-emerald-500 font-mono italic">{item.placedCount}</span> · Active OD: <span className="text-blue-500 font-mono italic">{item.activeOdCount}</span></>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>


                {/* Company Stats View */}
                {viewMode === "stats" && selectedItem && searchType === "company" && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-16 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-indigo-500/10"></div>
                        
                        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-12">
                            <div className="text-center xl:text-left space-y-4">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                                    <Building2 className="w-4 h-4" /> Company Profile
                                </div>
                                <h2 className="text-4xl md:text-5xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                                    {selectedItem.name}
                                </h2>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Operational Metrics Alpha</p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-6 w-full xl:w-auto">
                                <button
                                    onClick={() => handlePlacedStatsClick(selectedItem.name)}
                                    className="group/stat relative flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] hover:border-emerald-500 transition-all duration-500 text-left"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Placements</p>
                                        <Users className="w-5 h-5 text-emerald-500 opacity-40 group-hover/stat:rotate-12 transition-transform" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">{selectedItem.placedCount}</span>
                                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Entities</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover/stat:opacity-100 transition-opacity">
                                        View Directory <ChevronRight className="w-3 h-3" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleCompanyStatsClick(selectedItem.name)}
                                    className="group/stat relative flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] hover:border-blue-500 transition-all duration-500 text-left"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active OD Stream</p>
                                        <Activity className="w-5 h-5 text-blue-500 opacity-40 group-hover/stat:rotate-12 transition-transform" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">{selectedItem.activeOdCount}</span>
                                        <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover/stat:opacity-100 transition-opacity">
                                        Audit Interface <ChevronRight className="w-3 h-3" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Student Profile & Stats View */}
                {viewMode === "student-stats" && selectedItem && searchType === "student" && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-16 relative overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col gap-12">
                            {/* Profile Header */}
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 pb-10 border-b-2 border-slate-50 dark:border-slate-800">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                                    <div className="relative shrink-0">
                                        <div className="absolute -inset-2 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 p-1 transform -rotate-6 transition-all duration-700 shadow-2xl shadow-indigo-500/30">
                                            <div className="w-full h-full rounded-[2.3rem] bg-white dark:bg-slate-900 flex items-center justify-center text-3xl sm:text-5xl font-[1000] text-indigo-500 dark:text-white uppercase italic">
                                                {selectedItem.name?.charAt(0)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-4xl sm:text-5xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                                                {selectedItem.name}
                                            </h2>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-mono">
                                                    {selectedItem.rollNo}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{selectedItem.department}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-3 text-slate-400">
                                            <Mail className="w-4 h-4 text-slate-300" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{selectedItem.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-4 w-full xl:w-auto">
                                    <button
                                        onClick={handleStudentStatusClick}
                                        className="flex-1 sm:flex-none px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                                    >
                                        <Activity className="w-4 h-4" /> Live Status
                                    </button>
                                    <button
                                        onClick={handleStudentHistoryClick}
                                        className="flex-1 sm:flex-none px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                                    >
                                        <History className="w-4 h-4" /> Archive History
                                    </button>
                                </div>
                            </div>

                            {/* Tactical Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Placement Widget */}
                                <div className="group/widget p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all duration-500">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic flex items-center gap-3">
                                            <Building2 className="w-4 h-4 text-emerald-500" /> Placement Sync
                                        </h3>
                                        <div className={`w-3 h-3 rounded-full ${selectedItem.placement?.status === 'PLACED' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                            {selectedItem.placement?.status === 'PLACED' ? "Verified" : "Sync Pending"}
                                        </p>
                                        {selectedItem.placement?.offers?.map((offer, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                                <span className="text-[11px] font-[1000] text-slate-700 dark:text-slate-300 uppercase italic truncate">{offer.companyName}</span>
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest whitespace-nowrap">{offer.lpa} LPA</span>
                                            </div>
                                        )) || <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">No active offers detected.</p>}
                                    </div>
                                </div>

                                {/* OD Metrics */}
                                <div className="group/widget p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all duration-500">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic flex items-center gap-3">
                                            <PieChart className="w-4 h-4 text-blue-500" /> Neural Load
                                        </h3>
                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">{selectedItem.odStats?.remainingDays} Left</span>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">{selectedItem.odStats?.usedDays || 0}</span>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">/ 60 Days</span>
                                        </div>
                                        <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="absolute h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" 
                                                style={{ width: `${Math.min(((selectedItem.odStats?.usedDays || 0) / 60) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Sector authorization remains valid.</p>
                                    </div>
                                </div>

                                {/* Mentor Liaison */}
                                <div className="group/widget p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all duration-500">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic flex items-center gap-3">
                                            <Users className="w-4 h-4 text-purple-500" /> Liaison Alpha
                                        </h3>
                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                    </div>
                                    {selectedItem.mentor ? (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">{selectedItem.mentor.name}</p>
                                                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-1">{selectedItem.mentor.department || "CORE LIAISON"}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{selectedItem.mentor.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-24 text-slate-400 space-y-3">
                                            <ShieldAlert className="w-6 h-6 opacity-40" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic opacity-60">No Liaison Assigned</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}


                {/* Results Table (List View OR Placed View) */}
                {viewMode === "list" && (ods.length > 0 || placedStudents.length > 0 || selectedItem) ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden mb-20"
                    >
                        <div className="p-10 border-b-2 border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-8 bg-slate-50/50 dark:bg-slate-950/50">
                            <div className="space-y-2 text-center xl:text-left">
                                <h3 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {listType === 'placed' ? "Placed Entity Registry" : "Audit Stream Results"}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {selectedItem ? `Sector: ${selectedItem.name || selectedItem.companyName}` : "Global Domain Results"}
                                </p>
                            </div>
 
                            <div className="flex flex-wrap items-center justify-center gap-6">
                                {/* Filter Tabs only for OD list */}
                                {listType === 'ods' && (
                                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl border border-slate-300 dark:border-slate-700">
                                        <button
                                            onClick={() => setStatusFilter("active")}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                                                statusFilter === "active" 
                                                ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-xl" 
                                                : "text-slate-500 hover:text-slate-700"
                                            }`}
                                        >
                                            Live Stream
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter("history")}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                                                statusFilter === "history" 
                                                ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-xl" 
                                                : "text-slate-500 hover:text-slate-700"
                                            }`}
                                        >
                                            Archives
                                        </button>
                                    </div>
                                )}
 
                                {searchType === 'company' && (
                                    <button
                                        onClick={() => { setViewMode("stats"); setODs([]); setPlacedStudents([]); }}
                                        className="px-6 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
                                    >
                                        Return to Core
                                    </button>
                                )}
                                {searchType === 'student' && (
                                    <button
                                        onClick={() => setViewMode("student-stats")}
                                        className="px-6 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
                                    >
                                        Return to Profile
                                    </button>
                                )}
                            </div>
                        </div>
 
                        {listType === 'ods' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-950 border-b-2 border-slate-100 dark:border-slate-800">
                                        <tr>
                                            {searchType !== 'student' && <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Node</th>}
                                            {searchType !== 'company' && <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sector Hub</th>}
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Temporal Range</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Status</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Sync</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {filteredODs.map((od) => (
                                            <tr key={od.id} className="group hover:bg-indigo-500/[0.02] transition-colors">
                                                {searchType !== 'student' && (
                                                    <td className="px-10 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-[1000] text-slate-900 dark:text-white uppercase italic group-hover:text-indigo-500 transition-colors">
                                                                {od.studentName || od.student?.name}
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                                {od.studentRollNo || od.student?.rollNo}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                {searchType !== 'company' && (
                                                    <td className="px-10 py-6">
                                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                                            {od.companyName || od.company?.name || "Global Core"}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-3 text-[11px] font-[1000] text-slate-500 dark:text-slate-400 uppercase italic">
                                                        <span className="text-indigo-500">{new Date(od.startDate).toLocaleDateString()}</span>
                                                        <ChevronRight className="w-3 h-3 opacity-30" />
                                                        <span className="text-rose-500">{new Date(od.endDate).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                                        getDerivedStatus(od) === 'COMPLETED' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                                        (od.status === 'APPROVED' || od.status === 'MENTOR_APPROVED') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                        od.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}>
                                                        {getDerivedStatus(od)}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    {['APPROVED', 'MENTOR_APPROVED', 'COMPLETED'].includes(getDerivedStatus(od)) && (
                                                        <div className="flex items-center gap-4">
                                                            {od.erpSyncStatus === 'SYNCED' ? (
                                                                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span className="text-[9px] font-black tracking-widest">SYNCED</span>
                                                                </div>
                                                            ) : od.erpSyncStatus === 'FAILED' ? (
                                                                <div className="flex items-center gap-2 text-rose-500 bg-rose-500/5 px-3 py-1.5 rounded-xl border border-rose-500/10">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    <span className="text-[9px] font-black tracking-widest">FAILED</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span className="text-[9px] font-black tracking-widest">PENDING</span>
                                                                </div>
                                                            )}
                                                            {od.erpSyncStatus !== 'SYNCED' && (
                                                                <button 
                                                                    onClick={() => handleErpSync(od.id)} 
                                                                    className="p-2 hover:bg-indigo-500 hover:text-white text-indigo-500 rounded-xl transition-all border border-indigo-500/10 group/sync" 
                                                                    title="Force Neural Sync"
                                                                >
                                                                    <RefreshCcw className="w-4 h-4 group-hover/sync:rotate-180 transition-transform duration-700" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-10 py-6">
                                                    {getDerivedStatus(od) !== 'REJECTED' && getDerivedStatus(od) !== 'COMPLETED' ? (
                                                        <button
                                                            onClick={() => handleCancelOD(od.id)}
                                                            className="px-6 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Neutralize
                                                        </button>
                                                    ) : (
                                                        <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full ml-6 opacity-30"></div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredODs.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-10 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <ShieldAlert className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
                                                            {searchType === 'company'
                                                                ? "No active neural streams detected for this sector."
                                                                : "Zero entity results found for current filter criteria."}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            // PLACED STUDENTS TABLE
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-950 border-b-2 border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Name</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Roll Designation</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sector Node</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sync Initiation Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {placedStudents.map((student) => (
                                            <tr key={student.id} className="group hover:bg-emerald-500/[0.02] transition-colors">
                                                <td className="px-10 py-6">
                                                    <span className="text-sm font-[1000] text-slate-900 dark:text-white uppercase italic group-hover:text-emerald-500 transition-colors">
                                                        {student.name}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="text-xs font-black text-indigo-500 font-mono tracking-widest">{student.rollNo}</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{student.department}</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="text-[11px] font-[1000] text-slate-500 dark:text-slate-400 uppercase italic">
                                                        {new Date(student.placedDate).toLocaleDateString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {placedStudents.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-10 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <ShieldAlert className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Zero placed entities detected in this sector.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                ) : null}


            </main>
            <Footer />
            <ConfirmationModal
                {...confirmModal}
                inputValue={confirmModal.remarks}
                onInputChange={(val) => setConfirmModal({ ...confirmModal, remarks: val })}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div >
    );
}
