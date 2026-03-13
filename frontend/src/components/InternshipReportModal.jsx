import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
    FileText,
    CheckCircle,
    UploadCloud
} from 'lucide-react';

export default function InternshipReportModal({ isOpen, onClose, pendingODs = [], onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [selectedOD, setSelectedOD] = useState(pendingODs.length > 0 ? pendingODs[0].id : "");
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();

    // Reset selected OD when pendingODs changes
    React.useEffect(() => {
        if (pendingODs.length > 0) {
            setSelectedOD(pendingODs[0].id);
        }
    }, [pendingODs]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type !== 'application/pdf') {
            showToast("Only PDF files are allowed", "error");
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            showToast("Please select a file", "error");
            return;
        }
        if (!selectedOD) {
            showToast("Please select an OD to report for", "error");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('reportFile', file);
        formData.append('odId', selectedOD); // ✅ Send OD ID

        try {
            await api.post('/reports/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast("Report uploaded successfully!", "success");
            onUploadSuccess();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Failed to upload report";
            showToast(msg, "error");
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="text-center mb-8 relative z-10">
                        <div className="mx-auto bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100 dark:border-indigo-800">
                            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mission Report</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                             Upload post-dispatch documentation
                        </p>
                    </div>

                    {pendingODs.length > 0 ? (
                        <div className="space-y-6 relative z-10">
                            {/* OD Selection Dropdown */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Target Objective <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedOD}
                                    onChange={(e) => setSelectedOD(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer outline-none"
                                >
                                    {pendingODs.map(od => (
                                        <option key={od.id} value={od.id}>
                                            {od.trackerId} - {od.offer?.company?.name || "Internship"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="group relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 text-center bg-slate-50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer overflow-hidden">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {file ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 text-emerald-600">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-[9px] text-emerald-500 font-black uppercase mt-1">Ready for Sync</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-400">
                                        <UploadCloud className="w-10 h-10 mx-auto mb-4 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:scale-110" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Deploy PDF Document</p>
                                        <p className="text-[8px] mt-2 opacity-60">Payload Limit: 5MB</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !file || !selectedOD}
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                                >
                                    {uploading ? "Syncing Documentation..." : "Initialize Upload"}
                                </button>

                                <button
                                    onClick={onClose}
                                    className="w-full text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest py-2 transition-colors"
                                >
                                    Abort Session
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 text-center relative z-10">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[2rem] p-10 shadow-sm">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg mb-2">Logs Cleared</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest leading-relaxed">
                                    All post-dispatch reports have been serialized. No pending uploads found.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl transition-all active:scale-95"
                            >
                                Close Console
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
