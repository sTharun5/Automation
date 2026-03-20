import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import {
    ArrowLeft,
    Mail,
    Building2,
    Send,
    Loader2,
    Paperclip,
    LifeBuoy
} from "lucide-react";

/**
 * HelpSupport component - Integrated user assistance and ticketing system.
 * Allows students and faculty to submit support queries with optional file attachments,
 * which are then routed to administrators for resolution tracking and historical logging.
 */
export default function HelpSupport() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [form, setForm] = useState({
        subject: "",
        description: "",
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Simple check for size (e.g. 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                showToast("File too large. Max 10MB allowed.", "error");
                e.target.value = null; // Reset input
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.subject || !form.description) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("subject", form.subject);
        formData.append("description", form.description);
        if (file) {
            formData.append("file", file);
        }

        setLoading(true);
        try {
            await api.post("/support/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            showToast("✅ Query submitted successfully! Admins have been notified.", "success");
            // Reset form
            setForm({ subject: "", description: "" });
            setFile(null);
            // Optional: navigate back or stay? Stay is better for UX if they want to send another.
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to submit query.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 max-w-4xl mx-auto w-full">

                {/* Intro Section */}
                <div className="text-center mb-10 relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-bold uppercase tracking-widest text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Help & Support</h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                        Having issues with the Smart OD Portal? Submit your query below, and our admin team will get back to you shortly.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">

                        {/* Left Side: Contact Info / Visuals */}
                        <div className="bg-blue-600 dark:bg-blue-700 p-8 md:w-1/3 text-white flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-black mb-4 flex items-center gap-2 uppercase tracking-tight">
                                    <LifeBuoy className="w-6 h-6 text-blue-200" /> Support Desk
                                </h3>
                                <p className="text-blue-100 text-sm mb-6">
                                    Your query will be emailed directly to the administrators and logged in their dashboard for immediate attention.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                                            <Mail className="w-5 h-5 text-blue-100" />
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-black uppercase tracking-widest text-[10px] opacity-70">Email Support</p>
                                            <p className="font-bold">support@smartod.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                                            <Building2 className="w-5 h-5 text-blue-100" />
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-black uppercase tracking-widest text-[10px] opacity-70">Admin Office</p>
                                            <p className="font-bold">Main Block, BIT</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-xs opacity-60">
                                Smart OD Portal v1.0
                            </div>
                        </div>

                        {/* Right Side: Form */}
                        <div className="p-8 md:w-2/3 bg-white dark:bg-slate-900">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Subject <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        placeholder="Briefly describe the issue..."
                                        value={form.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        rows="5"
                                        placeholder="Please provide details about the problem you are facing..."
                                        value={form.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                                        required
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Attachments (Optional)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 transition-all text-sm font-medium">
                                            <Paperclip className="w-4 h-4" /> <span>Upload Image/Video</span>
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept="image/*,video/*"
                                            />
                                        </label>
                                        {file && (
                                            <span className="text-sm text-green-600 dark:text-green-400 truncate max-w-[200px]">
                                                {file.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Supported: JPG, PNG, MP4 (Max 10MB)</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="uppercase tracking-widest font-black text-sm">Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span className="uppercase tracking-widest font-black text-sm">Submit Query</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}
