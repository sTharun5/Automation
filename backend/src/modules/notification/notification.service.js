const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class NotificationService {
    /**
     * Create a notification for a specific user
     * @param {string} email - Recipient email
     * @param {string} title - Notification title
     * @param {string} message - Notification body
     * @param {string} type - INFO, SUCCESS, WARNING, ERROR
     */
    async createNotification(email, title, message, type = "INFO") {
        try {
            return await prisma.notification.create({
                data: {
                    email,
                    title,
                    message,
                    type
                }
            });
        } catch (error) {
            console.error("CREATE NOTIFICATION ERROR:", error);
        }
    }

    /**
     * Create notifications for all admins
     */
    async broadcastToAdmin(title, message, type = "INFO") {
        try {
            const admins = await prisma.admin.findMany({ select: { email: true } });
            const notifications = admins.map(admin => ({
                email: admin.email,
                title,
                message,
                type
            }));

            if (notifications.length > 0) {
                await prisma.notification.createMany({ data: notifications });
            }
        } catch (error) {
            console.error("BROADCAST ADMIN ERROR:", error);
        }
    }

    /**
     * Check for students without mentors and notify admin
     * Checks strictly for students who have NO mentorId
     */
    async checkAndNotifyUnassignedStudents() {
        try {
            const count = await prisma.student.count({
                where: { mentorId: null }
            });

            if (count > 0) {
                const existingAlert = await prisma.notification.findFirst({
                    where: {
                        title: "Action Required: Unassigned Students",
                        read: false,
                    }
                });

                // Only broadcast if no pending alert exists (simple throttle)
                if (!existingAlert) {
                    await this.broadcastToAdmin(
                        "Action Required: Unassigned Students",
                        `There are ${count} students without an assigned mentor. Please assign them immediately.`,
                        "WARNING"
                    );
                }
            }
            return count;
        } catch (error) {
            console.error("CHECK UNASSIGNED STUDENTS ERROR:", error);
            return 0;
        }
    }

    /**
     * Get unread notifications for a user
     */
    async getNotifications(email) {
        return await prisma.notification.findMany({
            where: { email },
            orderBy: { createdAt: "desc" },
            take: 20 // Limit to last 20
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id, email) {
        // extra check to ensure user owns notification
        const notif = await prisma.notification.findUnique({ where: { id: Number(id) } });
        if (!notif || notif.email !== email) return null;

        return await prisma.notification.update({
            where: { id: Number(id) },
            data: { read: true }
        });
    }

    /**
     * Mark ALL as read
     */
    async markAllAsRead(email) {
        return await prisma.notification.updateMany({
            where: { email, read: false },
            data: { read: true }
        });
    }

    /**
     * Delete ALL notifications for a user
     */
    async deleteAll(email) {
        return await prisma.notification.deleteMany({
            where: { email }
        });
    }
}

module.exports = new NotificationService();
