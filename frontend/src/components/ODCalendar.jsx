import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import api from '../api/axios';
import { format, parseISO } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import './ODCalendar.css'; // Custom styles for dark mode

export default function ODCalendar({ history = [] }) {
    const [value, onChange] = useState(new Date());
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/calendar');
                setEvents(res.data);
            } catch (err) {
                console.error("Failed to fetch calendar events", err);
            }
        };
        fetchEvents();
    }, []);

    // Helper to find the highest priority OD for a specific date
    const getODForDate = (date) => {
        if (!history || !Array.isArray(history)) return null;

        const dayODs = history.filter(od => {
            try {
                const start = format(parseISO(od.startDate), 'yyyy-MM-dd');
                const end = format(parseISO(od.endDate), 'yyyy-MM-dd');
                const checkDate = format(date, 'yyyy-MM-dd');
                return checkDate >= start && checkDate <= end;
            } catch (e) {
                return false;
            }
        });

        if (dayODs.length === 0) return null;

        const approved = dayODs.find(od => ["APPROVED", "MENTOR_APPROVED"].includes(od.status));
        if (approved) return approved;

        const pending = dayODs.find(od => ["PENDING", "DOCS_VERIFIED"].includes(od.status));
        if (pending) return pending;

        return dayODs[0];
    };

    const getEventForDate = (date) => {
        if (!events || !Array.isArray(events)) return null;
        return events.find(e => {
            try {
                const checkDate = format(date, 'yyyy-MM-dd');
                const start = format(parseISO(e.startDate), 'yyyy-MM-dd');
                const end = format(parseISO(e.endDate), 'yyyy-MM-dd');
                return checkDate >= start && checkDate <= end;
            } catch (err) {
                return false;
            }
        });
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const event = getEventForDate(date);
            if (event) {
                if (event.type === 'EXAM') return 'highlight-purple';
                if (event.type === 'HOLIDAY') return 'highlight-blue';
                return 'highlight-blue';
            }

            const od = getODForDate(date);
            if (od) {
                if (od.status === 'APPROVED' || od.status === 'MENTOR_APPROVED') return 'highlight-green';
                if (od.status === 'REJECTED') return 'highlight-red';
                return 'highlight-yellow';
            }
        }
        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const event = getEventForDate(date);
            if (event) {
                return (
                    <div className="flex justify-center mt-1 group relative">
                        <div className={`w-1.5 h-1.5 rounded-full ${event.type === 'EXAM' ? 'bg-purple-600' : 'bg-blue-500'} shadow-[0_0_8px_rgba(37,99,235,0.4)]`} />
                        <div className="absolute bottom-full mb-3 hidden group-hover:block w-max max-w-[150px] bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-xl px-3 py-2 z-[100] text-center shadow-2xl border border-slate-700 pointer-events-none animate-fadeIn">
                            {event.title}
                        </div>
                    </div>
                );
            }

            const od = getODForDate(date);
            if (od) {
                return (
                    <div className="flex justify-center mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${['APPROVED', 'MENTOR_APPROVED'].includes(od.status) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                            od.status === 'REJECTED' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                            }`} />
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="p-8 sm:p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
            
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-[0.3em] flex items-center gap-2 relative z-10 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div> Temporal Log Console
            </h3>
            
            <div className="calendar-container relative z-10">
                <Calendar
                    onChange={onChange}
                    value={value}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    className="w-full border-none bg-transparent text-slate-800 dark:text-slate-200 font-black uppercase tracking-tight text-xs"
                />
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 relative z-10 border-t-2 border-slate-100 dark:border-slate-800 pt-8 px-2">
                <LegendItem color="bg-emerald-500" label="Approved" />
                <LegendItem color="bg-amber-500" label="Pending" />
                <LegendItem color="bg-purple-600" label="Exam Cycle" />
                <LegendItem color="bg-blue-500" label="Recess Day" />
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-lg shadow-${color.split('-')[1]}-500/30 ring-2 ring-white dark:ring-slate-900`} />
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}
