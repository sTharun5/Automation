import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNotification } from "../context/NotificationContext";

export default function Notifications() {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAll } = useNotification();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto w-full">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                >
                    <span>←</span> Back
                </button>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">All Notifications</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                You have {unreadCount} unread notifications
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Mark all as read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={deleteAll}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-4xl">
                                🔔
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No notifications yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                When you have updates regarding your OD applications, they will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                    className={`p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${n.read
                                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                        : "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>}
                                                <h4 className={`font-semibold ${n.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>
                                                    {n.title}
                                                </h4>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
