const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { notifyUser } = require("../../utils/socket");

exports.getNotifications = async (req, res) => {
    try {
        const { email } = req.user;
        const notifications = await prisma.notification.findMany({
            where: { email },
            orderBy: { createdAt: "desc" },
            take: 50
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id: Number(id) },
            data: { read: true }
        });
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update notification" });
    }
};

// Helper to create and send notification
exports.createNotification = async (email, title, message, type = "INFO") => {
    try {
        const notification = await prisma.notification.create({
            data: { email, title, message, type }
        });

        // Send real-time
        notifyUser(email, title, message, type);

        return notification;
    } catch (err) {
        console.error("NOTIFICATION ERROR:", err);
    }
};
