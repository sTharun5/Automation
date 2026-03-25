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
import LoadingButton from './LoadingButton';

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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                    <div className="text-center mb-6">
                        <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Submit Internship Report</h2>
                        <p className="text-sm text-slate-500 mt-2">
                            You have completed ODs that require a report. Please upload to proceed.
                        </p>
                    </div>

                    {pendingODs.length > 0 ? (
                        <div className="space-y-4">
                            {/* OD Selection Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Select OD <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedOD}
                                    onChange={(e) => setSelectedOD(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
                                >
                                    {pendingODs.map(od => (
                                        <option key={od.id} value={od.id}>
                                            {od.trackerId} - {od.offer?.company?.name || "Internship"} ({new Date(od.endDate).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {file ? (
                                    <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
                                        <FileText className="w-5 h-5" />
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-slate-500">
                                        <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <p className="font-medium">Click to upload PDF</p>
                                        <p className="text-xs mt-1">Max size 5MB</p>
                                    </div>
                                )}
                            </div>

                            <LoadingButton
                                onClick={handleUpload}
                                isLoading={uploading}
                                loadingText="Uploading..."
                                disabled={!file || !selectedOD}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20"
                            >
                                Submit Report
                            </LoadingButton>

                            <button
                                onClick={onClose}
                                className="w-full text-slate-500 hover:text-slate-700 font-medium py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 text-center">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-2">All Caught Up!</h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    You don't have any pending internship reports to submit at this time. Great job staying on track!
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors"
                            >
                                Close Window
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
