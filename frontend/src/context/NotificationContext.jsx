/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const role = sessionStorage.getItem("role");
            if (!role) {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            const res = await api.get("/notifications");
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n) => !n.read).length); // Count unread locally
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put(`/notifications/read-all`);
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };


    const deleteAll = async () => {
        try {
            await api.delete("/notifications");
            // Optimistic update
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to clear notifications", error);
        }
    };

    // Poll every 30 seconds (reduced from 15s to lower DB load)
    useEffect(() => {
        const role = sessionStorage.getItem("role");
        if (!role) return; // Don't even start polling if not logged in

        fetchNotifications(); // Initial fetch
        const interval = setInterval(() => {
            // Re-check on every tick — stop polling if user logged out
            if (!sessionStorage.getItem("role")) {
                clearInterval(interval);
                setNotifications([]);
                setUnreadCount(0);
                return;
            }
            fetchNotifications();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteAll }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
