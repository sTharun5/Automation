import { useEffect, useState } from "react";
import api from "../api/axios";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import LocationAutocomplete from "../components/LocationAutocomplete";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Plus,
    Building2,
    MapPin,
    Search,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    RotateCcw,
    X,
    Building,
    ShieldAlert
} from "lucide-react";

export default function ManageCompanies() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCompanyName, setNewCompanyName] = useState("");
    const [newCompanyLocation, setNewCompanyLocation] = useState("");
    const [adding, setAdding] = useState(false);
    const { showToast } = useToast();

    // Edit Modal State
    const [editingCompany, setEditingCompany] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", location: "" });
    const [updating, setUpdating] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false
    });

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/companies");
            setCompanies(res.data);
        } catch (err) {
            console.error("LOAD COMPANIES ERROR:", err);
            showToast(err.response?.data?.message || "Failed to load companies", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanySuggestions = async (query) => {
        if (!query) return [];
        return companies.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
    };

    const handleSelectCompany = (c) => {
        setCompanies([c]);
    };

    const handleToggleApproval = async (id, currentStatus) => {
        try {
            await api.post("/admin/toggle-company-approval", {
                id,
                isApproved: !currentStatus
            });
            fetchCompanies(); // Refresh list
            showToast("Company status updated", "success");
        } catch (err) {
            console.error(err);
            showToast("Failed to update status", "error");
        }
    };

    const confirmDeleteCompany = async (id) => {
        try {
            await api.delete(`/admin/companies/${id}`);
            fetchCompanies();
            showToast("Company deleted successfully", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to delete company", "error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleDeleteCompany = (id, name) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Company",
            message: `Are you sure you want to delete ${name}? This will remove all associated offers.`,
            onConfirm: () => confirmDeleteCompany(id),
            isDanger: true,
            confirmText: "Yes, Delete"
        });
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        if (!newCompanyName.trim()) return;

        try {
            setAdding(true);
            await api.post("/admin/companies", {
                name: newCompanyName.trim(),
                location: newCompanyLocation.trim() || null
            });
            setNewCompanyName("");
            setNewCompanyLocation("");
            fetchCompanies();
            showToast("Company added successfully", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add company", "error");
        } finally {
            setAdding(false);
        }
    };

    const handleEditClick = (company) => {
        setEditingCompany(company);
        setEditForm({ name: company.name, location: company.location || "" });
        setShowEditModal(true);
    };

    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) return;

        try {
            setUpdating(true);
            await api.put(`/admin/companies/${editingCompany.id}`, {
                name: editForm.name.trim(),
                location: editForm.location.trim() || null
            });
            setShowEditModal(false);
            setEditingCompany(null);
            fetchCompanies();
            showToast("Company updated successfully", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update company", "error");
        } finally {
            setUpdating(false);
        }
    };

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
                                Sector <span className="text-indigo-500">Authorization</span>
                            </h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-tight max-w-xl">
                                Core domain management. Approve and verify external sector relays for inter-network On-Duty synchronization.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Add Sector Form */}
                <div className="relative group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 md:p-16 rounded-[4rem] shadow-2xl shadow-slate-200/50 dark:shadow-none mb-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-indigo-500/10"></div>
                    
                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                <Plus className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Register Sector</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Initiate New External Hub</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddCompany} className="flex flex-col xl:flex-row gap-6">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sector Identifier</label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                            <Building2 className="w-5 h-5 text-indigo-500 transition-transform group-focus-within/input:scale-110" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter Sector Name [e.g. Google Alpha]"
                                            value={newCompanyName}
                                            onChange={(e) => setNewCompanyName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl pl-14 pr-6 py-5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Co-Location Matrix</label>
                                    <LocationAutocomplete
                                        value={newCompanyLocation}
                                        onChange={setNewCompanyLocation}
                                        placeholder="Identify Geographical Coordinates..."
                                        containerClassName="relative group/input"
                                        inputClassName="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl py-5 pr-6 pl-14 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight"
                                        icon={<MapPin className="w-5 h-5 text-indigo-500 absolute left-5 top-1/2 -translate-y-1/2 z-10" />}
                                    />
                                </div>
                            </div>

                            <div className="xl:pt-8">
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="w-full xl:w-auto px-12 py-5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-4 group/btn overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                                    <span className="relative z-10 flex items-center gap-4">
                                        {adding ? (
                                            <>
                                                <RotateCcw className="w-5 h-5 animate-spin" /> Authorization Pending...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" /> Authorize Sector
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>


                <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden mb-20">
                    <div className="p-10 border-b-2 border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-8 bg-slate-50/50 dark:bg-slate-950/50">
                        <div className="space-y-2 text-center xl:text-left">
                            <h3 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Sector Registry</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Relay Hub Database</p>
                        </div>
 
                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-1/2">
                            <div className="relative w-full group/input">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-indigo-500" />
                                </div>
                                <SearchInput
                                    placeholder="COMMAND: Filter Registry..."
                                    fetchSuggestions={fetchCompanySuggestions}
                                    onSelect={handleSelectCompany}
                                    containerClassName="w-full bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus-within:border-indigo-500 outline-none transition-all font-bold tracking-tight text-sm"
                                    renderSuggestion={(c) => (
                                        <div className="flex items-center gap-4 p-3 hover:bg-indigo-500/5 transition-colors">
                                            <Building2 className="w-5 h-5 text-indigo-500" />
                                            <span className="font-bold text-slate-900 dark:text-white uppercase italic text-sm">{c.name}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <button
                                onClick={fetchCompanies}
                                className="px-8 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all whitespace-nowrap"
                            >
                                Query All
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b-2 border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sector Node</th>
                                    <th className="hidden xl:table-cell px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matrix Location</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Directives</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RotateCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Accessing Mainframe...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : companies.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <ShieldAlert className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Zero External Hubs Detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    companies.map((company) => (
                                        <tr key={company.id} className="group hover:bg-indigo-500/[0.02] transition-colors">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                                        <Building className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-[1000] text-slate-900 dark:text-white uppercase italic group-hover:text-indigo-500 transition-colors">
                                                            {company.name}
                                                        </span>
                                                        <span className="xl:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                            {company.location || "Sector Co-ordinates Unknown"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden xl:table-cell px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-slate-300" />
                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                                        {company.location || <span className="italic opacity-40">Unidentified Zone</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                                    company.isApproved
                                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                }`}>
                                                    {company.isApproved ? "Verified" : "Sync Pending"}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleToggleApproval(company.id, company.isApproved)}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                            company.isApproved
                                                            ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white"
                                                            : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white"
                                                        }`}
                                                    >
                                                        {company.isApproved ? "Revoke" : "Authorize"}
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleEditClick(company)}
                                                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all border border-transparent hover:border-indigo-500/20"
                                                        title="Modify Sector"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
 
                                                    <button
                                                        onClick={() => handleDeleteCompany(company.id, company.name)}
                                                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                                                        title="Neutralize Sector"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Edit Company Modal - NEURAL TERMINAL STYLE */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
                        onClick={() => setShowEditModal(false)}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="relative bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-2 border-slate-100 dark:border-slate-800"
                    >
                        {/* Modal Decorative Header */}
                        <div className="h-2 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600"></div>
                        
                        <div className="p-10 md:p-12 space-y-10">
                            <div className="flex justify-between items-center">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Reconfigure Sector</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Modify External Data Streams</p>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateCompany} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Authorized Identifier</label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                                <Building2 className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl pl-14 pr-6 py-5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight"
                                                value={editForm.name}
                                                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Co-Location Nexus</label>
                                        <LocationAutocomplete
                                            value={editForm.location}
                                            onChange={(val) => setEditForm(prev => ({ ...prev, location: val }))}
                                            placeholder="Update Geographical Signature..."
                                            containerClassName="relative group/input"
                                            inputClassName="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl py-5 pr-6 pl-14 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight"
                                            icon={<MapPin className="w-5 h-5 text-indigo-500 absolute left-5 top-1/2 -translate-y-1/2 z-10" />}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-8 py-5 font-black text-[10px] text-slate-500 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                                    >
                                        Abort Reconfig
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="flex-[2] px-8 py-5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
                                    >
                                        {updating ? (
                                            <><RotateCcw className="w-4 h-4 animate-spin" /> Patching Registry...</>
                                        ) : (
                                            "Confirm Overwrite"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}

            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
            <Footer />
        </div>
    );
}
