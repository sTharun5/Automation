
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../context/ToastContext";
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
    Users
} from "lucide-react";

/**
 * ManageODs component - Command center for administrative OD (On-Duty) oversight.
 * Enables searching for OD records by student or company, visualizing placement statistics,
 * manually triggering ERP synchronization, and performing administrative cancellations
 * with real-time lifecycle tracking and comprehensive student profiles.
 */
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
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1 transition-colors text-sm font-bold uppercase tracking-wider">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage ODs</h1>
                        <p className="text-slate-500 dark:text-slate-400">Search and manage student On-Duty requests.</p>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm mb-8">

                    {/* Toggle */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => { setSearchType("student"); setSelectedItem(null); setODs([]); }}
                            aria-label="Search by student details"
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${searchType === "student" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                        >
                            Search by Student
                        </button>
                        <button
                            onClick={() => { setSearchType("company"); setSelectedItem(null); setODs([]); }}
                            aria-label="Search by company statistics"
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${searchType === "company" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                        >
                            Search by Company
                        </button>
                    </div>

                    {/* Input */}
                    <SearchInput
                        placeholder={searchType === "student" ? "Search Student Name or Roll No..." : "Search Company Name..."}
                        fetchSuggestions={fetchSuggestions}
                        onSearch={handleSearch}
                        onSelect={handleSelect}
                        icon={<Search className="w-5 h-5 text-slate-400" />}
                        renderSuggestion={(item) => (
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {searchType === "student" ? item.name : item.name}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    {searchType === "student" ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                    {searchType === "student"
                                        ? `${item.rollNo} • ${item.odStats?.remainingDays} Days Remaining`
                                        : `Placed: ${item.placedCount} | Active ODs: ${item.activeOdCount}`
                                    }
                                </span>
                            </div>
                        )}
                    />
                </div>

                {/* Company Stats View */}
                {viewMode === "stats" && selectedItem && searchType === "company" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-8"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    {selectedItem.name}
                                </h2>
                                <p className="text-slate-500">Company Statistics</p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handlePlacedStatsClick(selectedItem.name)}
                                    className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[120px] transition-all group"
                                >
                                    <span className="text-3xl font-black text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                        {selectedItem.placedCount}
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-2 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Placed
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleCompanyStatsClick(selectedItem.name)}
                                    className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[120px] transition-all group"
                                >
                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        {selectedItem.activeOdCount}
                                    </span>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-black mt-2 flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> In OD
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Student Profile & Stats View - COMPREHENSIVE ADMIN VIEW */}
                {viewMode === "student-stats" && selectedItem && searchType === "student" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm mb-8"
                    >
                        <div className="flex flex-col gap-6">

                            {/* Header: Name, Roll, Dept */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                                <div className="flex items-center gap-5">
                                    <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-900 shadow-lg">
                                        {selectedItem.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                            {selectedItem.name}
                                        </h2>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-bold">
                                                {selectedItem.rollNo}
                                            </span>
                                            <span>•</span>
                                            <span className="font-medium">{selectedItem.department}</span>
                                            {selectedItem.semester && (
                                                <>
                                                    <span>•</span>
                                                    <span>Sem {selectedItem.semester}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                                            <Mail className="w-3.5 h-3.5 text-slate-300" />
                                            {selectedItem.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleStudentStatusClick}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
                                    >
                                        <Activity className="w-4 h-4" /> Status
                                    </button>
                                    <button
                                        onClick={handleStudentHistoryClick}
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
                                    >
                                        <History className="w-4 h-4" /> History
                                    </button>
                                </div>
                            </div>

                            {/* Detailed Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* 1. Placement */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5" /> Placement
                                    </h3>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`h-3 w-3 rounded-full ${selectedItem.placement?.status === 'PLACED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                            selectedItem.placement?.status === 'NIP' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-slate-400'
                                            }`} />
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {selectedItem.placement?.status === 'PLACED' ? "Placed" :
                                                selectedItem.placement?.status === 'NIP' ? "Not Interested (NIP)" : "Unplaced"}
                                        </span>
                                    </div>
                                    {selectedItem.placement?.offers?.length > 0 && (
                                        <div className="space-y-2 mt-3">
                                            {selectedItem.placement.offers.map((offer, idx) => (
                                                <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{offer.companyName}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{offer.lpa} LPA</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 2. OD Stats */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <PieChart className="w-3.5 h-3.5" /> OD Limits
                                    </h3>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white">{selectedItem.odStats?.usedDays || 0}</span>
                                        <span className="text-sm font-semibold text-slate-500 mb-1">/ 60 Days Used</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(((selectedItem.odStats?.usedDays || 0) / 60) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3">
                                        {selectedItem.odStats?.remainingDays} days remaining for this tracker id.
                                    </p>
                                </div>

                                {/* 3. Mentor Info */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <GraduationCap className="w-3.5 h-3.5" /> Assigned Mentor
                                    </h3>
                                    {selectedItem.mentor ? (
                                        <>
                                            <p className="font-bold text-slate-900 dark:text-white text-lg">{selectedItem.mentor.name}</p>
                                            <p className="text-xs text-slate-500 mb-1">{selectedItem.mentor.email}</p>
                                            <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded uppercase">
                                                {selectedItem.mentor.department || "Faculty"}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-20 text-slate-400">
                                            <span>No Mentor Assigned</span>
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {listType === 'placed' ? "Placed Students" : "Results"} {selectedItem ? `for ${selectedItem.name || selectedItem.companyName}` : ""}
                            </h3>

                            {/* Filter Tabs only for OD list */}
                            {listType === 'ods' && (
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        onClick={() => setStatusFilter("active")}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${statusFilter === "active" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                            }`}
                                    >
                                        Active & Pending
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("history")}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${statusFilter === "history" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                            }`}
                                    >
                                        History / All
                                    </button>
                                </div>
                            )}

                            {searchType === 'company' && (
                                <button
                                    onClick={() => { setViewMode("stats"); setODs([]); setPlacedStudents([]); }}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Back to Stats
                                </button>
                            )}
                            {searchType === 'student' && (
                                <button
                                    onClick={() => setViewMode("student-stats")}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Back to Profile
                                </button>
                            )}
                        </div>

                        {listType === 'ods' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase font-bold text-xs tracking-wider text-slate-500">
                                        <tr>
                                            {/* Dynamic Columns */}
                                            {searchType !== 'student' && <th className="px-6 py-4">Student</th>}
                                            {searchType !== 'company' && <th className="px-6 py-4">Company</th>}
                                            <th className="px-6 py-4">Dates</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">ERP Sync</th>
                                            <th className="px-6 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredODs.map((od) => (
                                            <tr key={od.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                {searchType !== 'student' && (
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                        {od.studentName || od.student?.name} <br /> <span className="text-xs text-slate-400 font-normal">{od.studentRollNo || od.student?.rollNo}</span>
                                                    </td>
                                                )}
                                                {searchType !== 'company' && (
                                                    <td className="px-6 py-4">{od.companyName || od.company?.name || "N/A"}</td>
                                                )}
                                                <td className="px-6 py-4">
                                                    {new Date(od.startDate).toLocaleDateString()} - {new Date(od.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDerivedStatus(od) === 'COMPLETED' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                                                        (od.status === 'APPROVED' || od.status === 'MENTOR_APPROVED') ? 'bg-green-100 text-green-600' :
                                                            od.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                                'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        {getDerivedStatus(od)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {['APPROVED', 'MENTOR_APPROVED', 'COMPLETED'].includes(getDerivedStatus(od)) && (
                                                        <div className="flex items-center gap-2">
                                                            {od.erpSyncStatus === 'SYNCED' ? (
                                                                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1 rounded text-[10px] font-black tracking-widest flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> SYNCED
                                                                </span>
                                                            ) : od.erpSyncStatus === 'FAILED' ? (
                                                                <span className="text-red-600 bg-red-50 dark:bg-red-900/10 px-2.5 py-1 rounded text-[10px] font-black tracking-widest flex items-center gap-1">
                                                                    <XCircle className="w-3 h-3" aria-hidden="true" /> FAILED
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-2.5 py-1 rounded text-[10px] font-black tracking-widest flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" aria-hidden="true" /> PENDING
                                                                </span>
                                                            )}
                                                            {od.erpSyncStatus !== 'SYNCED' && (
                                                                <button 
                                                                    onClick={() => handleErpSync(od.id)} 
                                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group" 
                                                                    title="Retry ERP Sync"
                                                                    aria-label="Retry ERP Synchronization"
                                                                >
                                                                    <RefreshCcw className="w-3.5 h-3.5 text-blue-600 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getDerivedStatus(od) !== 'REJECTED' && getDerivedStatus(od) !== 'COMPLETED' ? (
                                                        <button
                                                            onClick={() => handleCancelOD(od.id)}
                                                            aria-label="Cancel this OD request"
                                                            className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">N/A</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredODs.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                    {searchType === 'company'
                                                        ? "No one is currently in OD for this company."
                                                        : "No ODs found in this category."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            // PLACED STUDENTS TABLE
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase font-bold text-xs tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4">Student</th>
                                            <th className="px-6 py-4">Roll No</th>
                                            <th className="px-6 py-4">Department</th>
                                            <th className="px-6 py-4">Placed Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {placedStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4">{student.rollNo}</td>
                                                <td className="px-6 py-4">{student.department}</td>
                                                <td className="px-6 py-4">
                                                    {new Date(student.placedDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {placedStudents.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                                    No placed students found.
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
            <ConfirmationModal
                {...confirmModal}
                inputValue={confirmModal.remarks}
                onInputChange={(val) => setConfirmModal({ ...confirmModal, remarks: val })}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div >
    );
}
