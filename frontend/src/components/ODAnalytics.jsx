import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ODAnalytics({ history = [] }) {

    // 1. Process Data for Bar Chart (ODs per Month)
    const monthlyData = useMemo(() => {
        const months = {};
        history.forEach(od => {
            const date = new Date(od.createdAt || od.appliedOn);
            const key = date.toLocaleString('default', { month: 'short' });
            months[key] = (months[key] || 0) + 1;
        });

        return Object.entries(months).map(([name, count]) => ({ name, count }));
    }, [history]);

    // 2. Process Data for Pie Chart (Status Distribution)
    const statusData = useMemo(() => {
        const textMap = {
            "APPROVED": "Approved",
            "MENTOR_APPROVED": "Approved",
            "REJECTED": "Rejected",
            "PENDING": "Pending",
            "UNDER_REVIEW": "Pending",
            "DOCS_VERIFIED": "Pending"
        };

        const stats = { Approved: 0, Rejected: 0, Pending: 0 };
        history.forEach(od => {
            const label = textMap[od.status] || "Pending";
            stats[label] = (stats[label] || 0) + 1;
        });

        return [
            { name: 'Approved', value: stats.Approved, color: '#10b981' }, // Emerald
            { name: 'Pending', value: stats.Pending, color: '#f59e0b' },  // Amber
            { name: 'Rejected', value: stats.Rejected, color: '#ef4444' } // Red
        ].filter(i => i.value > 0);
    }, [history]);

    if (!history || !Array.isArray(history) || history.length === 0) {
        return (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Telemetry Database Empty</p>
                <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-tight">No historical records found for analytics processing.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
            {/* Monthly Trend */}
            <div className="p-8 sm:p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-blue-500/20 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
                
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-[0.3em] flex items-center gap-2 relative z-10 px-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Monthly Vector Flux
                </h3>
                <div className="w-full h-64 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }}
                                contentStyle={{ 
                                    borderRadius: '24px', 
                                    border: 'none', 
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                    backgroundColor: '#0f172a',
                                    padding: '16px'
                                }}
                                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                labelStyle={{ display: 'none' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="url(#colorBar)"
                                radius={[8, 8, 8, 8]}
                                barSize={32}
                            />
                            <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Distribution */}
            <div className="p-8 sm:p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-emerald-500/20 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>

                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-[0.3em] flex items-center gap-2 relative z-10 px-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Status Protocol Distribution
                </h3>
                <div className="w-full h-64 relative z-10 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={95}
                                paddingAngle={10}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ 
                                    borderRadius: '24px', 
                                    border: 'none', 
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                    backgroundColor: '#0f172a',
                                    padding: '16px'
                                }}
                                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                           {history.length}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Logs</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
