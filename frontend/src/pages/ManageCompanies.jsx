import { useEffect, useState } from "react";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

export default function ManageCompanies() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [newCompanyName, setNewCompanyName] = useState("");
    const [adding, setAdding] = useState(false);
    const { showToast } = useToast();

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

    const handleToggleApproval = async (id, currentStatus) => {
        try {
            await api.post("/admin/toggle-company-approval", {
                id,
                isApproved: !currentStatus
            });
            fetchCompanies(); // Refresh list
            showToast("Company status updated", "success");
        } catch (err) {
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
            await api.post("/admin/companies", { name: newCompanyName.trim() });
            setNewCompanyName("");
            fetchCompanies();
            showToast("Company added successfully", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add company", "error");
        } finally {
            setAdding(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

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
                        ← Back
                    </button>
                </div>

                {/* Add Company Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 mb-8 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add New Company</h3>
                    <form onSubmit={handleAddCompany} className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Enter company name (e.g. Google, Microsoft)"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            required
                        />
                        <button
                            type="submit"
                            disabled={adding}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
                        >
                            {adding ? "Adding..." : "Add Company"}
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <input
                            type="text"
                            placeholder="Search companies..."
                            className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Company Name</th>
                                    <th className="px-6 py-4 font-semibold">Created At</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-slate-500">Loading...</td>
                                    </tr>
                                ) : filteredCompanies.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-slate-500">No companies found</td>
                                    </tr>
                                ) : (
                                    filteredCompanies.map((company) => (
                                        <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                {company.name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                                {new Date(company.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.isApproved
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                                    }`}>
                                                    {company.isApproved ? "Approved" : "Pending Approval"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleToggleApproval(company.id, company.isApproved)}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${company.isApproved
                                                            ? "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                                            : "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                            }`}
                                                    >
                                                        {company.isApproved ? "Revoke Approval" : "Approve"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCompany(company.id, company.name)}
                                                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                        title="Delete Company"
                                                    >
                                                        🗑️
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
            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
            <Footer />
        </div>
    );
}
