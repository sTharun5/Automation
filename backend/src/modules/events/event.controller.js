const { authenticator } = require('otplib');
const qrcode = require('qrcode');

const prisma = require("../../config/db");
const sendEmail = require("../../utils/sendEmail");
const notificationService = require('../notification/notification.service');


// Configure TOTP constraints (30 second default window, but we update UI every 15)
authenticator.options = { step: 30 };

exports.createInternalEvent = async (req, res) => {
    try {
        const { name, startDate, endDate, allocatedHours, maxParticipants, staffCoordinatorId, studentCoordinatorId } = req.body;

        if (!name || !startDate || !endDate || !allocatedHours) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Generate a cryptographically secure random secret key for this event
        const qrSecretKey = authenticator.generateSecret();
        // Generate a random ID e.g., EVT-4938
        const eventId = `EVT-${Math.floor(1000 + Math.random() * 9000)}`;

        let _facultyVerified = false; // used as local guard below
        if (staffCoordinatorId) {
            const fac = await prisma.faculty.findUnique({ where: { id: parseInt(staffCoordinatorId) } });
            if (!fac) return res.status(400).json({ message: "Staff Coordinator Faculty ID not found" });
            _facultyVerified = true;
        }

        if (studentCoordinatorId) {
            const stu = await prisma.student.findUnique({ where: { id: parseInt(studentCoordinatorId) } });
            if (!stu) return res.status(400).json({ message: "Student Coordinator ID not found" });
        }

        const newEvent = await prisma.event.create({
            data: {
                eventId,
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isInternal: true,
                allocatedHours: Math.max(1.0, parseFloat(allocatedHours) || 1.0),
                qrSecretKey,
                status: 'ACTIVE',
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : 0,
                staffCoordinatorId: staffCoordinatorId ? parseInt(staffCoordinatorId) : null,
                studentCoordinatorId: studentCoordinatorId ? parseInt(studentCoordinatorId) : null
            }
        });

        // ── Send notifications + emails to coordinators ──
        const eventStart = new Date(startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const eventEnd   = new Date(endDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

        if (staffCoordinatorId) {
            const fac = await prisma.faculty.findUnique({ where: { id: parseInt(staffCoordinatorId) } });
            if (fac) {
                await notificationService.createNotification(
                    fac.email,
                    `You are assigned as Staff Coordinator`,
                    `You have been assigned as the Staff Coordinator for the internal event "${name}" (${eventStart} – ${eventEnd}). Please manage the student coordinator and approve the roster.`,
                    "INFO"
                );
                await sendEmail(
                    fac.email,
                    `[SMART OD] You are assigned as Staff Coordinator — ${name}`,
                    `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
                        <h2 style="color:#4f46e5">📋 Staff Coordinator Assignment</h2>
                        <p>Hello <strong>${fac.name}</strong>,</p>
                        <p>You have been assigned as the <strong>Staff Coordinator</strong> for the internal event:</p>
                        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                            <p style="margin:0 0 8px"><strong>Event:</strong> ${name}</p>
                            <p style="margin:0 0 8px"><strong>Start:</strong> ${eventStart}</p>
                            <p style="margin:0"><strong>End:</strong> ${eventEnd}</p>
                        </div>
                        <p>Please log in to manage the student coordinator and approve the roster once submitted.</p>
                        <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                    </div>`
                );
            }
        }

        if (studentCoordinatorId) {
            const stu = await prisma.student.findUnique({ where: { id: parseInt(studentCoordinatorId) } });
            if (stu) {
                await notificationService.createNotification(
                    stu.email,
                    `You are assigned as Student Coordinator`,
                    `You have been selected as the Student Coordinator for "${name}" (${eventStart} – ${eventEnd}). Please upload the participant roster in the Events section.`,
                    "INFO"
                );
                await sendEmail(
                    stu.email,
                    `[SMART OD] You are assigned as Student Coordinator — ${name}`,
                    `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
                        <h2 style="color:#4f46e5">🎓 Student Coordinator Assignment</h2>
                        <p>Hello <strong>${stu.name}</strong>,</p>
                        <p>You have been selected as the <strong>Student Coordinator</strong> for:</p>
                        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                            <p style="margin:0 0 8px"><strong>Event:</strong> ${name}</p>
                            <p style="margin:0 0 8px"><strong>Start:</strong> ${eventStart}</p>
                            <p style="margin:0"><strong>End:</strong> ${eventEnd}</p>
                        </div>
                        <p>Please log in to the student portal, navigate to <strong>My Events</strong>, and upload the participant roster before the event begins.</p>
                        <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                    </div>`
                );
            }
        }

        res.status(201).json({
            message: "Internal Event successfully created.",
            event: { ...newEvent, qrSecretKey: undefined } // Mask the secret in response
        });
    } catch (error) {
        console.error("Error creating internal event:", error);
        res.status(500).json({ message: "Failed to create event" });
    }
};

exports.editInternalEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { name, startDate, endDate, maxParticipants, staffCoordinatorId, studentCoordinatorId } = req.body;

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) }
        });

        if (!event || !event.isInternal) {
            return res.status(404).json({ message: "Internal event not found" });
        }

        if (staffCoordinatorId) {
            const fac = await prisma.faculty.findUnique({ where: { id: parseInt(staffCoordinatorId) } });
            if (!fac) return res.status(400).json({ message: "Staff Coordinator Faculty ID not found" });
        }

        if (studentCoordinatorId) {
            const stu = await prisma.student.findUnique({ where: { id: parseInt(studentCoordinatorId) } });
            if (!stu) return res.status(400).json({ message: "Student Coordinator ID not found" });
        }

        const dataToUpdate = {};
        if (name) dataToUpdate.name = name;
        if (startDate) dataToUpdate.startDate = new Date(startDate);
        if (endDate) dataToUpdate.endDate = new Date(endDate);

        if (maxParticipants !== undefined) {
            const parsedMax = parseInt(maxParticipants);
            dataToUpdate.maxParticipants = isNaN(parsedMax) ? 0 : parsedMax;
        }

        if (staffCoordinatorId !== undefined) {
            if (!staffCoordinatorId || staffCoordinatorId === "") {
                dataToUpdate.staffCoordinatorId = null;
            } else {
                const parsedStaffId = parseInt(staffCoordinatorId);
                dataToUpdate.staffCoordinatorId = isNaN(parsedStaffId) ? null : parsedStaffId;
            }
        }

        if (studentCoordinatorId !== undefined) {
            if (!studentCoordinatorId || studentCoordinatorId === "") {
                dataToUpdate.studentCoordinatorId = null;
            } else {
                const parsedStudentId = parseInt(studentCoordinatorId);
                dataToUpdate.studentCoordinatorId = isNaN(parsedStudentId) ? null : parsedStudentId;
            }
        }

        if (req.body.allocatedHours !== undefined) {
            const parsedHours = parseFloat(req.body.allocatedHours);
            if (!isNaN(parsedHours)) {
                dataToUpdate.allocatedHours = Math.max(1.0, parsedHours);
            }
        }

        const updatedEvent = await prisma.event.update({
            where: { id: parseInt(eventId) },
            data: dataToUpdate
        });

        const evtStart = new Date(updatedEvent.startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const evtEnd   = new Date(updatedEvent.endDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

        // Notify new staff coordinator if changed
        if (dataToUpdate.staffCoordinatorId && dataToUpdate.staffCoordinatorId !== event.staffCoordinatorId) {
            const newFac = await prisma.faculty.findUnique({ where: { id: dataToUpdate.staffCoordinatorId } });
            if (newFac) {
                await notificationService.createNotification(
                    newFac.email,
                    `You are assigned as Staff Coordinator`,
                    `You have been assigned as the Staff Coordinator for "${updatedEvent.name}" (${evtStart} – ${evtEnd}).`,
                    "INFO"
                );
                await sendEmail(
                    newFac.email,
                    `[SMART OD] Staff Coordinator Assignment — ${updatedEvent.name}`,
                    `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
                        <h2 style="color:#4f46e5">📋 Staff Coordinator Assignment</h2>
                        <p>Hello <strong>${newFac.name}</strong>,</p>
                        <p>You have been assigned as the <strong>Staff Coordinator</strong> for:</p>
                        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                            <p style="margin:0 0 8px"><strong>Event:</strong> ${updatedEvent.name}</p>
                            <p style="margin:0 0 8px"><strong>Start:</strong> ${evtStart}</p>
                            <p style="margin:0"><strong>End:</strong> ${evtEnd}</p>
                        </div>
                        <p>Please log in to manage the student coordinator and approve the roster.</p>
                        <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                    </div>`
                );
            }
        }

        // Notify new student coordinator if changed
        if (dataToUpdate.studentCoordinatorId && dataToUpdate.studentCoordinatorId !== event.studentCoordinatorId) {
            const newStu = await prisma.student.findUnique({ where: { id: dataToUpdate.studentCoordinatorId } });
            if (newStu) {
                await notificationService.createNotification(
                    newStu.email,
                    `You are assigned as Student Coordinator`,
                    `You have been selected as the Student Coordinator for "${updatedEvent.name}" (${evtStart} – ${evtEnd}). Please upload the participant roster.`,
                    "INFO"
                );
                await sendEmail(
                    newStu.email,
                    `[SMART OD] Student Coordinator Assignment — ${updatedEvent.name}`,
                    `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
                        <h2 style="color:#4f46e5">🎓 Student Coordinator Assignment</h2>
                        <p>Hello <strong>${newStu.name}</strong>,</p>
                        <p>You have been selected as the <strong>Student Coordinator</strong> for:</p>
                        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                            <p style="margin:0 0 8px"><strong>Event:</strong> ${updatedEvent.name}</p>
                            <p style="margin:0 0 8px"><strong>Start:</strong> ${evtStart}</p>
                            <p style="margin:0"><strong>End:</strong> ${evtEnd}</p>
                        </div>
                        <p>Please log in and upload the participant roster before the event begins.</p>
                        <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                    </div>`
                );
            }
        }

        res.json({
            message: "Event updated successfully",
            event: updatedEvent
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Failed to update event" });
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

        // --- RBAC Enforcement ---
        // Only ADMINs or the assigned staffCoordinator for this event can generate the QR code
        const { role, id: userId } = req.user;
        const isAuthorized = role === 'ADMIN' ||
            (role === 'FACULTY' && event.staffCoordinatorId === userId);

        if (!isAuthorized) {
            return res.status(403).json({ message: "Only assigned Staff Coordinators or Admins can generate attendance QR." });
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
            otp: token, // ✅ Added OTP
            expiresIn: authenticator.timeRemaining() // Tell frontend when to refresh
        });

    } catch (error) {
        console.error("Error generating QR:", error);
        res.status(500).json({ message: "Failed to generate live QR" });
    }
};

exports.getActiveEvents = async (req, res) => {
    try {
        const { showPast } = req.query;

        // Find all active, internal events
        const query = {
            where: {
                status: 'ACTIVE',
                isInternal: true
            },
            select: {
                id: true,
                eventId: true,
                name: true,
                startDate: true,
                endDate: true,
                allocatedHours: true,
                maxParticipants: true,
                staffCoordinatorId: true,
                staffCoordinator: { select: { name: true, department: true } },
                studentCoordinatorId: true,
                studentCoordinator: { select: { name: true, rollNo: true } },
                isRosterSubmitted: true,
                isRosterApproved: true,
                timeline: true
            },
            orderBy: { startDate: 'desc' } // Changed to desc for better history visibility
        };

        // If not showing past, filter by end date
        if (showPast !== 'true') {
            query.where.endDate = { gte: new Date() };
        }

        const events = await prisma.event.findMany(query);

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
            select: {
                id: true,
                trackerId: true,
                status: true,
                timeline: true,
                createdAt: true,
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
            status: record.status,
            timeline: record.timeline,
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

/* =====================================================
   FETCH ASSIGNED EVENTS FOR FACULTY / STUDENT
===================================================== */
exports.getMyAssignedEvents = async (req, res) => {
    try {
        const { email, role } = req.user;

        let events = [];

        if (role === 'FACULTY') {
            const faculty = await prisma.faculty.findUnique({ where: { email } });
            if (!faculty) return res.status(404).json({ message: "Faculty not found" });

            events = await prisma.event.findMany({
                where: {
                    staffCoordinatorId: faculty.id,
                    endDate: { gte: new Date() }
                },
                include: { studentCoordinator: { select: { name: true, rollNo: true } } },
                orderBy: { startDate: 'desc' }
            });
        } else if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { email } });
            if (!student) return res.status(404).json({ message: "Student not found" });

            events = await prisma.event.findMany({
                where: {
                    studentCoordinatorId: student.id,
                    endDate: { gte: new Date() }
                },
                include: { staffCoordinator: { select: { name: true, department: true } } },
                orderBy: { startDate: 'desc' }
            });
        }

        res.status(200).json(events);

    } catch (error) {
        console.error("Get Assigned Events Error:", error);
        res.status(500).json({ message: "Failed to fetch assigned events" });
    }
};
