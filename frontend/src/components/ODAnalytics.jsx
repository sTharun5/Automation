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
            <div className="p-6 text-center text-slate-500 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                No analytics data available yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Monthly Trend */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase tracking-wider">
                    Monthly Activity
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#3b82f6"
                                radius={[4, 4, 4, 4]}
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Distribution */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase tracking-wider">
                    Status Overview
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
