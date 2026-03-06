const calendarService = require("./calendar.service");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const notificationService = require("../notification/notification.service");
const sendEmail = require("../../utils/sendEmail");

exports.getEvents = async (req, res) => {
    try {
        const events = await calendarService.getEvents();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch events", error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        // Basic Admin Check
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        const event = await calendarService.createEvent(req.body);

        /* ===== AUTO-TRUNCATE LOGIC (New) ===== */
        try {
            if (event.type === "EXAM") {
                const { startDate, endDate } = event;
                const examStart = new Date(startDate);
                const examEnd = new Date(endDate);

                // Find conflicting APPROVED ODs and fetch student details for notification
                const conflictingODs = await prisma.od.findMany({
                    where: {
                        status: { in: ["APPROVED", "MENTOR_APPROVED"] },
                        OR: [
                            { startDate: { lte: examEnd }, endDate: { gte: examStart } }
                        ]
                    },
                    include: { student: true } // ✅ Fetch Student for email
                });

                for (const od of conflictingODs) {
                    const odStart = new Date(od.startDate);

                    // Case 1: OD starts before Exam -> Truncate to day before Exam
                    if (odStart < examStart) {
                        const newEndDate = new Date(examStart);
                        newEndDate.setDate(newEndDate.getDate() - 1);

                        // Recalculate duration (inclusive of start and end date)
                        const diffTime = Math.abs(newEndDate - odStart);
                        const newDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                        await prisma.od.update({
                            where: { id: od.id },
                            data: {
                                endDate: newEndDate,
                                duration: newDuration,
                                remarks: (od.remarks || "") + "\n[System: Auto-Truncated due to Exam Conflict]"
                            }
                        });

                        // 🔔 NOTIFY STUDENT
                        if (od.student && od.student.email) {
                            const message = `Your OD (Tracker: #${od.trackerId}) has been shortened due to an upcoming Exam on ${new Date(startDate).toLocaleDateString()}. Your OD now ends on ${newEndDate.toLocaleDateString()}.`;

                            // 1. In-App Notification
                            await notificationService.createNotification(
                                od.student.email,
                                "OD Duration Shortened",
                                message,
                                "WARNING"
                            );

                            // 2. Email Notification
                            await sendEmail(
                                od.student.email,
                                "Urgent: OD Auto-Truncated Due to Exam Conflict",
                                `<div style="font-family: Arial, sans-serif; color: #333;">
                                    <h2>OD Duration Updated</h2>
                                    <p>Dear ${od.student.name},</p>
                                    <p>${message}</p>
                                    <p><strong>New End Date:</strong> ${newEndDate.toLocaleDateString()}</p>
                                    <p><strong>Total Duration:</strong> ${newDuration} Days</p>
                                    <br/>
                                    <p>System Auto-Generated Email</p>
                                </div>`
                            );
                        }
                    }
                    // Case 2: OD starts on/after Exam -> Reject (Consumed by Exam)
                    else {
                        await prisma.od.update({
                            where: { id: od.id },
                            data: {
                                status: "REJECTED",
                                timeline: {
                                    push: {
                                        status: "REJECTED",
                                        label: "auto rejected",
                                        time: new Date(),
                                        description: "System Auto-Rejected due to Exam Conflict"
                                    }
                                }
                            }
                        });
                    }
                }
            }
        } catch (autoTruncateError) {
            console.error("Auto-Truncate Logic Failed (Non-blocking):", autoTruncateError);
        }

        res.status(201).json(event);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Failed to create event", error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }
        await calendarService.deleteEvent(req.params.id);
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete event", error: error.message });
    }
};
