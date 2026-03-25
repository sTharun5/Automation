import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import LocationAutocomplete from "../components/LocationAutocomplete";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import usePolling from "../hooks/usePolling";
import LoadingButton from "../components/LoadingButton";
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
    Building
} from "lucide-react";

/**
 * ManageCompanies component - Administrative dashboard for managing corporate partners.
 * Enables the addition of new companies, approval/revocation of OD eligibility,
 * and editing of company metadata with real-time location autocomplete and industrial partnership tracking.
 */
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

    const fetchCompanies = useCallback(async () => {
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
    }, [showToast]);

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchCompanies]);

    // Auto-refresh every 30 s
    usePolling(fetchCompanies, 30000);

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
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Companies</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Approve companies for OD requests</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" /> Back
                    </button>
                </div>

                {/* Add Company Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 mb-8 transition-colors">
                    <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> Add New Company
                    </h3>
                    <form onSubmit={handleAddCompany} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Enter company name (e.g. Google, Microsoft)"
                                aria-label="Company Name"
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                required
                            />
                            <LocationAutocomplete
                                value={newCompanyLocation}
                                onChange={setNewCompanyLocation}
                                placeholder="City / Location (e.g. Bangalore)"
                            />
                        </div>
                        <LoadingButton
                            type="submit"
                            isLoading={adding}
                            loadingText="Adding..."
                            aria-label={adding ? "Adding company..." : "Add new company"}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" aria-hidden="true" /> Add Company
                        </LoadingButton>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="w-full md:w-1/2">
                            <SearchInput
                                placeholder="Search Companies..."
                                fetchSuggestions={fetchCompanySuggestions}
                                onSelect={handleSelectCompany}
                                renderSuggestion={(c) => (
                                    <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                                )}
                            />
                        </div>
                        <button
                            onClick={fetchCompanies}
                            className="text-blue-600 hover:underline text-sm font-semibold"
                        >
                            Show All
                        </button>
                    </div>

                    <div className="overflow-x-auto text-sm">
                        <table className="w-full text-left" aria-label="Corporate partner directory">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 font-black">Company Name</th>
                                    <th className="px-6 py-4 font-black">Location</th>
                                    <th className="px-6 py-4 font-black text-center">Eligibility</th>
                                    <th className="px-6 py-4 font-black text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-blue-500 animate-pulse font-bold uppercase tracking-widest text-[10px]">Loading industrial database...</td>
                                    </tr>
                                ) : companies.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-slate-500 italic">No partnerships found matching your criteria.</td>
                                    </tr>
                                ) : (
                                    companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white capitalize truncate max-w-[200px]">
                                                {company.name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                                                {company.location ? (
                                                    <span className="flex items-center gap-1.5 uppercase tracking-tight">
                                                        <MapPin className="w-3 h-3 text-slate-400" /> {company.location}
                                                    </span>
                                                ) : <span className="italic opacity-50 text-[10px]">Not Specified</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all ${company.isApproved
                                                    ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
                                                    : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50"
                                                    }`}>
                                                    {company.isApproved ? "Approved" : "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleApproval(company.id, company.isApproved)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border shadow-sm ${company.isApproved
                                                            ? "bg-white dark:bg-slate-900 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-900/20"
                                                            : "bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-blue-500/20"
                                                            }`}
                                                        aria-label={company.isApproved ? `Revoke approval for ${company.name}` : `Approve ${company.name}`}
                                                    >
                                                        {company.isApproved ? "Revoke" : "Approve"}
                                                    </button>
                                                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                                                    <button
                                                        onClick={() => handleEditClick(company)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                        aria-label={`Edit company ${company.name}`}
                                                        title="Edit Company"
                                                    >
                                                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCompany(company.id, company.name)}
                                                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        aria-label={`Delete company ${company.name}`}
                                                        title="Delete Company"
                                                    >
                                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
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

            {/* Edit Company Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setShowEditModal(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold border-l-4 border-indigo-500 pl-3">Edit Company</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCompany} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={editForm.name}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location / City</label>
                                    <LocationAutocomplete
                                        value={editForm.location}
                                        onChange={(val) => setEditForm(prev => ({ ...prev, location: val }))}
                                        placeholder="City / Location (e.g. Bangalore)"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <LoadingButton
                                    type="submit"
                                    isLoading={updating}
                                    loadingText="Saving..."
                                    className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-500/30"
                                >
                                    Save Changes
                                </LoadingButton>
                            </div>
                        </form>
                    </div>
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
