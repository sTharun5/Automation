const { PrismaClient } = require('@prisma/client');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

const prisma = new PrismaClient();

// Configure TOTP constraints (30 second default window, but we update UI every 15)
authenticator.options = { step: 30 };

exports.createInternalEvent = async (req, res) => {
    try {
        const { name, startDate, endDate, allocatedHours } = req.body;

        if (!name || !startDate || !endDate || !allocatedHours) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Generate a cryptographically secure random secret key for this event
        const qrSecretKey = authenticator.generateSecret();
        // Generate a random ID e.g., EVT-4938
        const eventId = `EVT-${Math.floor(1000 + Math.random() * 9000)}`;

        const newEvent = await prisma.event.create({
            data: {
                eventId,
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isInternal: true,
                allocatedHours: parseInt(allocatedHours),
                qrSecretKey,
                status: 'ACTIVE'
            }
        });

        res.status(201).json({
            message: "Internal Event successfully created.",
            event: { ...newEvent, qrSecretKey: undefined } // Mask the secret in response
        });
    } catch (error) {
        console.error("Error creating internal event:", error);
        res.status(500).json({ message: "Failed to create event" });
    }
};

exports.getLiveEventQR = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) }
        });

        if (!event || !event.isInternal) {
            return res.status(404).json({ message: "Internal event not found" });
        }

        if (event.status !== 'ACTIVE') {
            return res.status(400).json({ message: "Event is no longer active" });
        }

        // Check if currently within the event time window (Optional strict enforcement here)
        // const now = new Date();
        // if (now < event.startDate || now > event.endDate) { ... }

        // Generate the rolling TOTP specific to right now
        const token = authenticator.generate(event.qrSecretKey);

        // We embed the eventID and the Token into the QR payload
        // Format: `SMART_OD_QR::eventId::token`
        const payload = `SMART_OD_QR::${event.id}::${token}`;

        // Generate the QR as a data URI (Base64 image)
        const qrBase64 = await qrcode.toDataURL(payload, {
            scale: 10,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' }
        });

        res.json({
            qrData: qrBase64,
            expiresIn: authenticator.timeRemaining() // Tell frontend when to refresh
        });

    } catch (error) {
        console.error("Error generating QR:", error);
        res.status(500).json({ message: "Failed to generate live QR" });
    }
};

exports.getActiveEvents = async (req, res) => {
    try {
        // Find all active, internal events whose end date hasn't passed
        const events = await prisma.event.findMany({
            where: {
                status: 'ACTIVE',
                isInternal: true,
                endDate: { gte: new Date() }
            },
            select: {
                id: true,
                eventId: true,
                name: true,
                startDate: true,
                endDate: true,
                allocatedHours: true
            },
            orderBy: { startDate: 'asc' }
        });

        res.json(events);
    } catch (error) {
        console.error("Error fetching active events:", error);
        res.status(500).json({ message: "Failed to fetch events" });
    }
};

exports.getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) }
        });

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Fetch all ODs linked to this event, including student details
        const attendanceRecords = await prisma.od.findMany({
            where: { eventId: event.id },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        rollNo: true,
                        department: true,
                        semester: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' } // Order by scan time
        });

        // Map it to a cleaner format
        const formattedAttendance = attendanceRecords.map(record => ({
            odId: record.id,
            trackerId: record.trackerId,
            scanTime: record.createdAt,
            student: record.student
        }));

        res.json({
            event: { name: event.name, eventId: event.eventId, startDate: event.startDate, endDate: event.endDate },
            attendance: formattedAttendance
        });

    } catch (error) {
        console.error("Error fetching event attendance:", error);
        res.status(500).json({ message: "Failed to fetch event attendance" });
    }
};

exports.deleteInternalEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const id = parseInt(eventId);

        // Before deleting, ensure it's an internal event
        const event = await prisma.event.findUnique({
            where: { id },
            include: { ods: true }
        });

        if (!event || !event.isInternal) {
            return res.status(404).json({ message: "Internal event not found" });
        }

        // Perform cancellation in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Cancel ODs and refund hours
            if (event.ods && event.ods.length > 0) {
                for (const od of event.ods) {
                    const student = await tx.student.findUnique({ where: { id: od.studentId } });
                    if (student) {
                        // Refund the internal hours 
                        const newHours = Math.max(0, student.internalHoursUsed - event.allocatedHours);
                        await tx.student.update({
                            where: { id: student.id },
                            data: { internalHoursUsed: newHours }
                        });
                    }
                }

                // 2. Delete all associated ODs 
                // Alternatively, we could update their status to REJECTED or CANCELLED, but 
                // since the event is being completely wiped, deleting the ODs keeps the database clean.
                await tx.od.deleteMany({
                    where: { eventId: id }
                });
            }

            // 3. Delete the event entirely
            await tx.event.delete({
                where: { id }
            });
        });

        return res.json({ message: "Event and associated ODs deleted successfully." });

    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Failed to delete event and its ODs" });
    }
};

exports.deleteAllInternalEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            where: { isInternal: true },
            include: { ods: true }
        });

        if (!events || events.length === 0) {
            return res.status(404).json({ message: "No internal events found to delete." });
        }

        await prisma.$transaction(async (tx) => {
            for (const event of events) {
                // Refund all ODs linked to this event
                if (event.ods && event.ods.length > 0) {
                    for (const od of event.ods) {
                        const student = await tx.student.findUnique({ where: { id: od.studentId } });
                        if (student) {
                            const newHours = Math.max(0, student.internalHoursUsed - event.allocatedHours);
                            await tx.student.update({
                                where: { id: student.id },
                                data: { internalHoursUsed: newHours }
                            });
                        }
                    }
                    await tx.od.deleteMany({ where: { eventId: event.id } });
                }
            }

            // Finally delete all internal events
            await tx.event.deleteMany({
                where: { isInternal: true }
            });
        });

        return res.json({ message: "All internal events and associated ODs deleted successfully." });
    } catch (error) {
        console.error("Error deleting all events:", error);
        res.status(500).json({ message: "Failed to delete all events." });
    }
};
