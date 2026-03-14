import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
    ArrowLeft,
    Mailbox,
    CheckCircle2,
    FileSpreadsheet,
    Plus,
    X,
    Clock,
    User,
    Calendar,
    Award,
    Zap,
    LayoutGrid,
    Search
} from 'lucide-react';

export default function StudentEvents() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Roster specific state per event ID
    const [rosters, setRosters] = useState({});
    const [manualInputs, setManualInputs] = useState({});

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/internal/my-assigned');
            setEvents(res.data);

            // Initialize empty rosters ONLY for new events to avoid overwriting drafted data
            setRosters(prev => {
                const updatedRosters = { ...prev };
                res.data.forEach(e => {
                    if (!(e.id in updatedRosters)) {
                        updatedRosters[e.id] = [];
                    }
                });
                return updatedRosters;
            });

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
                const blacklist = ["ROLLNO", "ROLL NUMBER", "ROLL_NO", "NAME", "SERIAL", "S.NO", "EMAIL", "DEPARTMENT", "DEPT", "STUDENT"];

                json.forEach(row => {
                    row.forEach(cell => {
                        if (typeof cell === 'string' && cell.trim()) {
                            const cleaned = cell.replace(/\s+/g, '').toUpperCase();
                            // Basic roll no validation: alphanumeric without spaces, min length 4, and not in blacklist
                            if (/^[A-Z0-9]+$/.test(cleaned) && cleaned.length > 3 && !blacklist.includes(cleaned)) {
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


    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Command Center</h1>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Multi-Event Coordination Protocol</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10">
                    {loading ? (
                        <div className="py-24 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                            <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse text-center">Syncing Event Matrix...</p>
                            </div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="py-24 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative">
                             <div className="absolute inset-0 bg-slate-500/5 dark:bg-slate-500/2 pointer-events-none"></div>
                             <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-500/5 rotate-3">
                                    <Mailbox className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4 uppercase tracking-tighter">Null Assignment</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs mx-auto mb-10 leading-relaxed text-center px-6">You have no active coordination vectors assigned to your node at this time.</p>
                                <button
                                    onClick={() => navigate('/student/dashboard')}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
                                >
                                    Return to HQ
                                </button>
                             </div>
                        </div>
                    ) : (
                        events.map((event) => {
                            const roster = rosters[event.id] || [];
                            const isSubmitted = event.isRosterSubmitted;
                            const isApproved = event.isRosterApproved;

                            return (
                                <div key={event.id} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col lg:flex-row gap-0 lg:gap-1 transition-all hover:border-indigo-500/20">
                                    {/* Event Details Section */}
                                    <div className="flex-1 p-8 sm:p-12 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none transition-all group-hover:bg-indigo-500/10"></div>
                                        
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border ${event.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {event.status} Protocol
                                            </span>
                                            <span className="font-mono text-xs font-black text-slate-300 dark:text-slate-600 tracking-tighter">NODE_{event.eventId}</span>
                                        </div>

                                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-8 leading-none tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.name}</h2>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 relative z-10">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeframe</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                    {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bandwidth</p>
                                                <p className="text-xs font-bold text-indigo-500">
                                                    {event.maxParticipants > 0 ? `${roster.length} / ${event.maxParticipants}` : `${roster.length} (Unlimited)`}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Credit</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                    {Math.floor(event.allocatedHours)}h {Math.round((event.allocatedHours % 1) * 60)}m Value
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supervisor</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tighter">
                                                    {event.staffCoordinator?.name.split(' ')[0]}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-10 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-wrap items-center gap-6 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${event.isRosterApproved ? 'bg-emerald-100 text-emerald-600' : event.isRosterSubmitted ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Status</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${event.isRosterApproved ? 'text-emerald-500' : event.isRosterSubmitted ? 'text-amber-500' : 'text-slate-400'}`}>
                                                        {event.isRosterApproved ? 'Approved & Locked' : event.isRosterSubmitted ? 'Transmitted / Pending' : 'Offline / Idle'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {event.isRosterApproved ? (
                                            <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[2rem] flex items-center gap-5 relative z-10">
                                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                    <Award className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">Matrix Verified</h3>
                                                    <p className="text-[10px] font-bold text-emerald-700/70 dark:text-emerald-500/70 uppercase tracking-widest">Roster is final. Credentials are live.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 relative z-10">
                                                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-[2rem] space-y-8">
                                                    {/* Upload Area */}
                                                    <div>
                                                        <label className="group/drop flex flex-col items-center justify-center w-full h-40 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-[1.5rem] cursor-pointer bg-white dark:bg-slate-900 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm">
                                                            <div className="flex flex-col items-center justify-center text-center px-4">
                                                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-500 group-hover/drop:scale-110 transition-transform">
                                                                    <FileSpreadsheet className="w-6 h-6" />
                                                                </div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest"><span className="text-indigo-600 dark:text-indigo-400">Inject</span> EXCEL MATRIX</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Automatic Roster Parsing</p>
                                                            </div>
                                                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, event.id)} />
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center gap-6 px-4">
                                                        <hr className="flex-1 border-slate-100 dark:border-slate-800" />
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Manual Hub</span>
                                                        <hr className="flex-1 border-slate-100 dark:border-slate-800" />
                                                    </div>

                                                    {/* Manual Hub */}
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <div className="flex-1 relative">
                                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Enter Roll Numbers (Separated by Comma)"
                                                                value={manualInputs[event.id] || ''}
                                                                onChange={(e) => setManualInputs(prev => ({ ...prev, [event.id]: e.target.value.toUpperCase() }))}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleManualAdd(event.id)}
                                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleManualAdd(event.id)}
                                                            className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-xl shadow-slate-200/50 dark:shadow-none shrink-0"
                                                        >
                                                            Integrate
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleSubmitRoster(event)}
                                                    disabled={roster.length === 0}
                                                    className={`w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] transition-all shadow-2xl relative overflow-hidden ${roster.length === 0
                                                        ? 'bg-slate-100 dark:bg-slate-800/10 text-slate-300 cursor-not-allowed shadow-none border border-slate-50 dark:border-slate-800/50'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.98]'
                                                        }`}
                                                >
                                                    <span className="relative z-10">
                                                        {isSubmitted ? "Re-Transmit Optimized Matrix" : "Initialize Matrix Transmission"} ({roster.length} Nodes)
                                                    </span>
                                                    {!roster.length === 0 && <div className="absolute inset-0 bg-white/20 animate-shimmer scale-x-150"></div>}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Roster Live Matrix Preview */}
                                    <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-800/20 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col min-w-0 lg:min-w-[320px]">
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                    <LayoutGrid className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Matrix</h3>
                                            </div>
                                            <span className="px-3 py-1 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-black rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                                {roster.length} PX
                                            </span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-none space-y-3 pr-2 custom-scrollbar">
                                            {roster.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Matrix is empty.</p>
                                                </div>
                                            ) : (
                                                roster.map(roll => (
                                                    <div key={roll} className="flex justify-between items-center px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none group/node hover:border-indigo-500/30 transition-all">
                                                        <span className="font-mono font-black text-xs text-slate-700 dark:text-slate-300 tracking-tight">{roll}</span>
                                                        {!event.isRosterApproved && (
                                                            <button
                                                                onClick={() => handleRemoveRoll(event.id, roll)}
                                                                className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/10 text-rose-500 flex items-center justify-center opacity-0 group-hover/node:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                                                title="Disconnect Node"
                                                            >
                                                                <X className="w-4 h-4" />
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
            <Footer />
        </div>
    );
}
