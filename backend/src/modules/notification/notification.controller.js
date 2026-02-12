const notificationService = require("./notification.service");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.email);
        res.json(notifications);
    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.markAsRead(id, req.user.email);
        res.json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update notification" });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.email);
        res.json({ message: "All marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update notifications" });
    }
};

exports.deleteAll = async (req, res) => {
    try {
        await notificationService.deleteAll(req.user.email);
        res.json({ message: "All notifications cleared" });
    } catch (error) {
        console.error("DELETE ALL NOTIFICATIONS ERROR:", error);
        res.status(500).json({ message: "Failed to clear notifications" });
    }
};
