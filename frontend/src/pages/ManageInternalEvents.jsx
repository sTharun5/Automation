import { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export default function ManageInternalEvents() {
    const { showToast } = useToast();
    const { darkMode } = useTheme();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        allocatedHours: 2
    });

    // Projection State
    const [projectingEvent, setProjectingEvent] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [qrExpiresIn, setQrExpiresIn] = useState(0);
    const projectionInterval = useRef(null);

    // Attendance State
    const [attendanceData, setAttendanceData] = useState(null);
    const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

    // Deletion Modal State
    const [isDeletingId, setIsDeletingId] = useState(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // Auto-calculate OD hours based on start and end dates
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end > start) {
                const diffMs = end.getTime() - start.getTime();
                let diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

                // Optional cap: if an event spans multiple days, cap at 8 hours per day
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                if (diffHours > diffDays * 8) {
                    diffHours = diffDays * 8;
                }

                setFormData(prev => prev.allocatedHours !== diffHours ? { ...prev, allocatedHours: diffHours } : prev);
            }
        }
    }, [formData.startDate, formData.endDate]);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/active');
            setEvents(res.data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load active events", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events/internal', formData);
            showToast("Internal event created successfully!", "success");
            setIsCreating(false);
            fetchEvents();
            setFormData({ name: '', startDate: '', endDate: '', allocatedHours: 2 });
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to create event", "error");
        }
    };

    const confirmDelete = (eventId) => {
        setIsDeletingId(eventId);
    };

    const executeDelete = async () => {
        if (!isDeletingId) return;

        // Optimistic update: instantly hide the event for an ultra-fast feeling
        setEvents(prev => prev.filter(e => e.id !== isDeletingId));

        try {
            const res = await api.delete(`/events/internal/${isDeletingId}`);
            showToast(res.data?.message || "Event & ODs deleted successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete event", "error");
            fetchEvents(); // rollback optimistic update on failure
        } finally {
            setIsDeletingId(null);
        }
    };

    const confirmDeleteAll = () => {
        if (events.length === 0) {
            showToast("No active events to delete.", "info");
            return;
        }
        setIsDeletingAll(true);
    };

    const executeDeleteAll = async () => {
        // Optimistic update
        const previousEvents = [...events];
        setEvents([]);

        try {
            const res = await api.delete('/events/internal/all');
            showToast(res.data?.message || "All events deleted successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete events", "error");
            setEvents(previousEvents); // Rollback
            fetchEvents();
        } finally {
            setIsDeletingAll(false);
        }
    };

    // --- QR Projection Logic ---
    const startProjection = async (event) => {
        setProjectingEvent(event);
        await fetchLiveQR(event.id);

        // Setup polling every 10 seconds to ensure QR is always fresh before TOTP expires
        projectionInterval.current = setInterval(() => {
            fetchLiveQR(event.id);
        }, 10000);
    };

    const stopProjection = () => {
        setProjectingEvent(null);
        setQrData(null);
        if (projectionInterval.current) {
            clearInterval(projectionInterval.current);
        }
    };

    const fetchLiveQR = async (eventId) => {
        try {
            const res = await api.get(`/events/${eventId}/live-qr`);
            setQrData(res.data.qrData);
            setQrExpiresIn(res.data.expiresIn);
        } catch (error) {
            console.error("QR Fetch Error:", error);
            showToast("Failed to refresh live QR", "error");
            stopProjection();
        }
    };

    // --- Attendance Fetching ---
    const fetchAttendance = async (event) => {
        setIsFetchingAttendance(true);
        showToast("Fetching attendance records...", "info");
        try {
            const res = await api.get(`/events/internal/${event.id}/attendance`);
            setAttendanceData(res.data);
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to fetch event attendance", "error");
        } finally {
            setIsFetchingAttendance(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            <Header title="Manage Internal Events" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Active Internal Events</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Create secure, dynamic QR codes for campus event attendance.</p>
                    </div>
                    <div className="flex gap-3">
                        {events.length > 0 && (
                            <button
                                onClick={confirmDeleteAll}
                                className="px-5 py-2.5 bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold uppercase tracking-wider rounded-xl transition-all"
                            >
                                Delete All
                            </button>
                        )}
                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-500/20"
                        >
                            {isCreating ? 'Cancel Creation' : '+ New Event'}
                        </button>
                    </div>
                </div>

                {/* Creation Form */}
                {isCreating && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm animate-slideDown">
                        <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-6">Event Details</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Event Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., Tech Symposium 2026"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Allocated OD Hours</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="40"
                                    value={formData.allocatedHours}
                                    onChange={(e) => setFormData({ ...formData, allocatedHours: e.target.value })}
                                    className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button type="submit" className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-transform">
                                    Finalize Event
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Active Events List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Events...</div>
                    ) : events.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <span className="text-4xl block mb-3">📭</span>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">No active events</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">Active</span>
                                    <span className="text-xs font-bold text-slate-400">{event.eventId}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 leading-tight">{event.name}</h3>
                                <div className="space-y-1 mb-6 flex-1">
                                    <p className="text-xs text-slate-500 font-medium">Starts: <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(event.startDate).toLocaleString()}</span></p>
                                    <p className="text-xs text-slate-500 font-medium">Ends: <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(event.endDate).toLocaleString()}</span></p>
                                    <p className="text-xs text-slate-500 font-medium">Value: <span className="font-bold text-indigo-500">{event.allocatedHours} Hours</span></p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <button
                                        onClick={() => startProjection(event)}
                                        className="col-span-2 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>🎥</span> Project Live QR
                                    </button>
                                    <button
                                        onClick={() => fetchAttendance(event)}
                                        disabled={isFetchingAttendance}
                                        className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        👥 Attendance
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(event.id)}
                                        className="py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                                        title="Delete Event"
                                    >
                                        <span>🗑️</span> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* FULLSCREEN PROJECTION OVERLAY */}
            {projectingEvent && (
                <div className="fixed inset-0 z-[99999] bg-[#0f172a] flex flex-col items-center justify-center p-8 animate-fadeIn">

                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                        <div>
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Live Projection
                            </span>
                        </div>
                        <button onClick={stopProjection} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold uppercase tracking-wider backdrop-blur-md transition-colors">
                            End Projection
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="text-center max-w-4xl w-full mx-auto flex flex-col items-center mt-12">
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-2xl">
                            {projectingEvent.name}
                        </h1>
                        <p className="text-lg md:text-2xl text-slate-300 font-medium mb-12">
                            Scan to instantly log your attendance & OD.
                        </p>

                        {/* The QR Code Wrapper */}
                        <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/20 flex items-center justify-center">
                            {qrData ? (
                                <img src={qrData} alt="Live QR Code" className="w-[400px] h-[400px] object-contain rendering-pixelated" />
                            ) : (
                                <div className="w-[400px] h-[400px] flex items-center justify-center">
                                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                </div>
                            )}

                            {/* Security Ring */}
                            <div className="absolute -inset-4 border-2 border-indigo-500/30 rounded-[2.5rem] pointer-events-none"></div>
                        </div>

                        {/* Security Footer */}
                        <div className="mt-12 flex items-center gap-3 text-slate-400 bg-white/5 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                            <span className="text-2xl">🔒</span>
                            <div className="text-left">
                                <p className="text-xs font-bold uppercase tracking-widest">Temporal Security Active</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-70">Code refreshes dynamically to prevent proxy scanning.</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeletingId && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-slideUp">

                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-6 text-red-600 dark:text-red-500">
                            <span className="text-3xl">⚠️</span>
                        </div>

                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Revoke & Delete Event</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium">
                            Deleting this event will instantly <span className="text-red-500 font-bold">cancel all ODs</span> generated through this QR code and <span className="text-indigo-500 font-bold">refund the hours</span> back to the students' balances. This action is irreversible.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsDeletingId(null)}
                                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 py-3.5 bg-red-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                            >
                                Confirm Delete
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* DELETE ALL CONFIRMATION MODAL */}
            {isDeletingAll && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-rose-200 dark:border-rose-900/50 transform transition-all animate-slideUp">

                        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-6 text-rose-600 dark:text-rose-500">
                            <span className="text-3xl">☢️</span>
                        </div>

                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Nuke All Events</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium">
                            You are about to delete <span className="text-rose-500 font-bold">ALL {events.length} active events</span>. This will immediately cancel all associated student ODs and refund their unspent hours. This absolute wipe cannot be undone.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsDeletingAll(false)}
                                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDeleteAll}
                                className="flex-1 py-3.5 bg-rose-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30"
                            >
                                Nuke Everything
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ATTENDANCE MODAL */}
            {attendanceData && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-slideUp overflow-hidden">

                        {/* Header */}
                        <div className="px-6 md:px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    {attendanceData.event.name}
                                </h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{attendanceData.attendance.length}</span> students logged attendance via QR
                                </p>
                            </div>
                            <button
                                onClick={() => setAttendanceData(null)}
                                className="w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50">
                            {attendanceData.attendance.length === 0 ? (
                                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                                    <span className="text-5xl block mb-4">📭</span>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">No scans recorded yet</p>
                                    <p className="text-xs text-slate-400 mt-2 font-medium">Students need to scan the live projection to appear here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {attendanceData.attendance.map(record => (
                                        <div key={record.odId} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-indigo-500/30 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white capitalize">{record.student.name.toLowerCase()}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">
                                                        {record.student.rollNo}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                                        {record.student.department} • Semester {record.student.semester}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col justify-center shrink-0">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Scanned At</span>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                                    {new Date(record.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
