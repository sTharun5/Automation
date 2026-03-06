import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function StudentEvents() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Roster specific state per event ID
    const [rosters, setRosters] = useState({});
    const [manualInputs, setManualInputs] = useState({});

    // Projection State
    const [projectingEvent, setProjectingEvent] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [eventOtp, setEventOtp] = useState(null);
    const projectionInterval = useRef(null);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/internal/my-assigned');
            setEvents(res.data);

            // Initialize empty rosters
            const initialRosters = {};
            res.data.forEach(e => {
                initialRosters[e.id] = [];
            });
            setRosters(initialRosters);

        } catch (error) {
            console.error("Fetch assigned events error", error);
            showToast("Failed to load your coordinated events.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 10000); // Poll every 10s
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileUpload = (e, eventId) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Extract all roll numbers from the sheet (flatten and clean)
                const parsedRollNos = [];
                json.forEach(row => {
                    row.forEach(cell => {
                        if (typeof cell === 'string' && cell.trim()) {
                            // Basic roll no validation: alphanumeric without spaces
                            const cleaned = cell.replace(/\s+/g, '').toUpperCase();
                            if (/^[A-Z0-9]+$/.test(cleaned) && cleaned.length > 3) {
                                parsedRollNos.push(cleaned);
                            }
                        }
                    });
                });

                if (parsedRollNos.length === 0) {
                    return showToast("No valid Roll Numbers found in the Excel sheet.", "error");
                }

                // Add to existing roster state, ensuring uniqueness
                setRosters(prev => ({
                    ...prev,
                    [eventId]: [...new Set([...(prev[eventId] || []), ...parsedRollNos])]
                }));

                showToast(`Successfully extracted ${parsedRollNos.length} Roll Numbers!`, "success");

            } catch (err) {
                console.error("Excel parse error:", err);
                showToast("Failed to parse the Excel file.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = ''; // Reset input
    };

    const handleManualAdd = (eventId) => {
        const input = manualInputs[eventId];
        if (!input || !input.trim()) return;

        const rolls = input.split(',').map(r => r.trim().toUpperCase()).filter(r => r);
        if (rolls.length === 0) return;

        setRosters(prev => ({
            ...prev,
            [eventId]: [...new Set([...(prev[eventId] || []), ...rolls])]
        }));
        setManualInputs(prev => ({ ...prev, [eventId]: '' }));
    };

    const handleRemoveRoll = (eventId, rollNo) => {
        setRosters(prev => ({
            ...prev,
            [eventId]: prev[eventId].filter(r => r !== rollNo)
        }));
    };

    const handleSubmitRoster = async (event) => {
        const rollNos = rosters[event.id] || [];
        if (rollNos.length === 0) {
            return showToast("Cannot submit an empty roster.", "warning");
        }
        if (event.maxParticipants > 0 && rollNos.length > event.maxParticipants) {
            return showToast(`Roster exceeds capacity! Maximum allowed is ${event.maxParticipants}.`, "error");
        }

        try {
            await api.post(`/events/${event.id}/roster`, { rollNos });
            showToast("Roster submitted successfully! Waiting for Staff approval.", "success");
            fetchEvents(); // Refresh statuses
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to submit roster", "error");
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
        setEventOtp(null);
        if (projectionInterval.current) {
            clearInterval(projectionInterval.current);
        }
    };

    const fetchLiveQR = async (eventId) => {
        try {
            const res = await api.get(`/events/${eventId}/live-qr`);
            setQrData(res.data.qrData);
            setEventOtp(res.data.otp);
        } catch (error) {
            console.error("QR Fetch Error:", error);
            showToast("Failed to refresh live QR", "error");
            stopProjection();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="mb-8">
                    <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-indigo-600 mb-2 flex items-center gap-1 transition-colors text-sm font-bold uppercase tracking-wider">
                        ← Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Coordinator Portal</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Draft and submit participant rosters for your assigned events.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse font-bold text-slate-400 uppercase tracking-widest">Loading Your Events...</div>
                    ) : events.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-5xl block mb-4">📭</span>
                            <p className="text-slate-500 font-bold uppercase tracking-wider">You haven't been assigned to coordinate any active events.</p>
                        </div>
                    ) : (
                        events.map((event) => {
                            const roster = rosters[event.id] || [];
                            const isSubmitted = event.isRosterSubmitted;
                            const isApproved = event.isRosterApproved;

                            return (
                                <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col lg:flex-row gap-8">
                                    {/* Event Details */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${event.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                                                {event.status}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{event.eventId}</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{event.name}</h2>

                                        <div className="space-y-2 mb-6 text-sm font-medium">
                                            <p className="text-slate-600 dark:text-slate-400">Date: <span className="font-bold text-slate-900 dark:text-white">{new Date(event.startDate).toLocaleString()}</span></p>
                                            <p className="text-slate-600 dark:text-slate-400">Capacity: <span className="font-bold text-indigo-500">{event.maxParticipants > 0 ? `${roster.length} / ${event.maxParticipants}` : `${roster.length} (Unlimited)`}</span></p>
                                            <p className="text-slate-600 dark:text-slate-400">OD Value: <span className="font-bold text-indigo-500">{Math.floor(event.allocatedHours)}h {Math.round((event.allocatedHours % 1) * 60)}m</span></p>
                                            <p className="text-slate-600 dark:text-slate-400">Staff Coordinator: <span className="font-bold text-slate-900 dark:text-white">{event.staffCoordinator?.name}</span></p>
                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <span className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Roster Status:</span>
                                                {event.isRosterApproved ? (
                                                    <span className="text-green-500 font-bold text-xs uppercase tracking-wider">Approved</span>
                                                ) : event.isRosterSubmitted ? (
                                                    <span className="text-amber-500 font-bold text-xs uppercase tracking-wider animate-pulse">Pending Approval</span>
                                                ) : (
                                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Not Submitted</span>
                                                )}
                                            </div>
                                        </div>

                                        {event.isRosterApproved ? (
                                            <div className="space-y-4 mt-6">
                                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
                                                    <span className="text-3xl">✅</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Roster Approved & Locked</p>
                                                        <p className="text-xs font-medium text-emerald-700/70 dark:text-emerald-500/70 mt-1">Staff has locked the roster. Digital Passes are live.</p>
                                                    </div>
                                                </div>
                                                {event.status === 'ACTIVE' && (
                                                    <button
                                                        onClick={() => startProjection(event)}
                                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] flex items-center justify-center gap-3 mt-4"
                                                    >
                                                        <span className="text-xl">🎥</span> Project Live QR & OTP
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Draft Participant Roster</h3>

                                                    {/* Upload Excel */}
                                                    <div>
                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-xl cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <span className="text-3xl mb-2">📊</span>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold"><span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> an Excel file</p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Automatic Roll Number extraction</p>
                                                            </div>
                                                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, event.id)} />
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        <hr className="flex-1 border-slate-200 dark:border-slate-700" /> OR <hr className="flex-1 border-slate-200 dark:border-slate-700" />
                                                    </div>

                                                    {/* Manual Add */}
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Manual Entry (e.g. 21IT001, 21IT002)"
                                                            value={manualInputs[event.id] || ''}
                                                            onChange={(e) => setManualInputs(prev => ({ ...prev, [event.id]: e.target.value.toUpperCase() }))}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleManualAdd(event.id)}
                                                            className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                                                        />
                                                        <button
                                                            onClick={() => handleManualAdd(event.id)}
                                                            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shrink-0"
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleSubmitRoster(event)}
                                                    disabled={roster.length === 0}
                                                    className={`w-full py-4 text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${roster.length === 0
                                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 hover:scale-[1.02]'
                                                        }`}
                                                >
                                                    {isSubmitted ? "Update & Resubmit Roster" : "Submit Roster"} ({roster.length} Students)
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Roster Live View */}
                                    <div className="lg:w-1/3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Drafted List</h3>
                                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-black rounded-lg">
                                                {roster.length}
                                            </span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none space-y-2 pr-2 custom-scrollbar">
                                            {roster.length === 0 ? (
                                                <p className="text-xs font-medium text-slate-400 italic text-center py-10">No students added yet.</p>
                                            ) : (
                                                roster.map(roll => (
                                                    <div key={roll} className="flex justify-between items-center px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm group">
                                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{roll}</span>
                                                        {!event.isRosterApproved && (
                                                            <button
                                                                onClick={() => handleRemoveRoll(event.id, roll)}
                                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Remove Student"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

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
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                            {/* QR Block */}
                            <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/20 flex flex-col items-center justify-center">
                                {qrData ? (
                                    <img src={qrData} alt="Live QR Code" className="w-[300px] md:w-[400px] h-[300px] md:h-[400px] object-contain rendering-pixelated" />
                                ) : (
                                    <div className="w-[300px] md:w-[400px] h-[300px] md:h-[400px] flex items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {/* Security Ring */}
                                <div className="absolute -inset-4 border-2 border-indigo-500/30 rounded-[2.5rem] pointer-events-none"></div>
                            </div>

                            {/* OTP Status Block */}
                            {eventOtp && (
                                <div className="flex flex-col items-center p-8 bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">OR ENTER CODE</p>
                                    <div className="flex gap-2 mb-4">
                                        {eventOtp.split('').map((char, index) => (
                                            <div key={index} className="w-12 md:w-16 h-16 md:h-20 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-3xl md:text-5xl font-mono font-black text-indigo-400 shadow-inner">
                                                {char}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-indigo-300/60 text-xs font-mono">Refreshes every 30s</p>
                                </div>
                            )}
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

            <Footer />
        </div>
    );
}
