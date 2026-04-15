const prisma = require("../../config/db");
const notificationService = require('../notification/notification.service');
const sendEmail = require("../../utils/sendEmail");

/* =====================================================
   STAFF: ASSIGN STUDENT COORDINATOR
===================================================== */
exports.assignStudentCoordinator = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rollNo, reason } = req.body;
        const staffEmail = req.user.email; // From authenticateToken middleware

        // 1. Verify Staff Authorization
        const staff = await prisma.faculty.findUnique({ where: { email: staffEmail } });
        if (!staff) return res.status(403).json({ message: "Only Staff can assign Student Coordinators." });

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { studentCoordinator: true }
        });
        if (!event) return res.status(404).json({ message: "Event not found." });

        if (event.staffCoordinatorId !== staff.id) {
            return res.status(403).json({ message: "You are not the designated Staff Coordinator for this event." });
        }

        // 2. Find Student by Roll No
        const student = await prisma.student.findUnique({ where: { rollNo } });
        if (!student) return res.status(404).json({ message: `Student with Roll No ${rollNo} not found.` });

        // 3. Update Event with Student Coordinator and Log to Timeline
        const currentTimeline = Array.isArray(event.timeline) ? event.timeline : [];
        const logEntry = {
            action: "COORDINATOR_ASSIGNED",
            time: new Date(),
            performedBy: { name: staff.name, facultyId: staff.facultyId },
            details: {
                previousCoordinator: event.studentCoordinator ? { name: event.studentCoordinator.name, rollNo: event.studentCoordinator.rollNo } : null,
                newCoordinator: { name: student.name, rollNo: student.rollNo },
                reason: reason || "No reason provided."
            }
        };

        const updatedEvent = await prisma.event.update({
            where: { id: parseInt(eventId) },
            data: {
                studentCoordinatorId: student.id,
                timeline: [...currentTimeline, logEntry]
            }
        });

        // 4. Notify + Email Student
        const evtStart = new Date(event.startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const evtEnd   = new Date(event.endDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

        await notificationService.createNotification(
            student.email,
            "Coordinator Assignment",
            `You have been designated as the Student Coordinator for ${event.name}. Please upload the participant roster.`,
            "INFO"
        );
        await sendEmail(
            student.email,
            `[SMART OD] You are assigned as Student Coordinator — ${event.name}`,
            `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
                <h2 style="color:#4f46e5">🎓 Student Coordinator Assignment</h2>
                <p>Hello <strong>${student.name}</strong>,</p>
                <p>Prof. <strong>${staff.name}</strong> has designated you as the <strong>Student Coordinator</strong> for:</p>
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:0 0 8px"><strong>Event:</strong> ${event.name}</p>
                    <p style="margin:0 0 8px"><strong>Start:</strong> ${evtStart}</p>
                    <p style="margin:0"><strong>End:</strong> ${evtEnd}</p>
                </div>
                <p>Please log in to the student portal, go to <strong>My Events</strong>, and upload the participant roster before the event begins.</p>
                <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
            </div>`
        );

        res.status(200).json({
            message: "Student Coordinator assigned successfully.",
            student: { name: student.name, rollNo: student.rollNo, email: student.email }
        });

    } catch (error) {
        console.error("Assign Coordinator Error:", error);
        res.status(500).json({ message: "Failed to assign student coordinator." });
    }
};

/* =====================================================
   STAFF: REVOKE STUDENT COORDINATOR
==================================================== */
exports.revokeStudentCoordinator = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { reason } = req.body;
        const staffEmail = req.user.email; // From authenticateToken middleware

        // 1. Verify Staff Authorization
        const staff = await prisma.faculty.findUnique({ where: { email: staffEmail } });
        if (!staff) return res.status(403).json({ message: "Only Staff can revoke Student Coordinators." });

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { studentCoordinator: true }
        });
        if (!event) return res.status(404).json({ message: "Event not found." });

        if (event.staffCoordinatorId !== staff.id) {
            return res.status(403).json({ message: "You are not the designated Staff Coordinator for this event." });
        }

        if (!event.studentCoordinatorId) {
            return res.status(400).json({ message: "No student coordinator is currently assigned to this event." });
        }

        // 2. Remove Student Coordinator Link and Log to Timeline
        const currentTimeline = Array.isArray(event.timeline) ? event.timeline : [];
        const logEntry = {
            action: "COORDINATOR_REVOKED",
            time: new Date(),
            performedBy: { name: staff.name, facultyId: staff.facultyId },
            details: {
                revokedCoordinator: { name: event.studentCoordinator.name, rollNo: event.studentCoordinator.rollNo },
                reason: reason || "No reason provided."
            }
        };

        await prisma.event.update({
            where: { id: parseInt(eventId) },
            data: {
                studentCoordinatorId: null,
                timeline: [...currentTimeline, logEntry]
            }
        });

        // 3. Notify + Email Student
        if (event.studentCoordinator?.email) {
            await notificationService.createNotification(
                event.studentCoordinator.email,
                "Coordinator Role Revoked",
                `Your coordinator access for the event "${event.name}" has been revoked by the staff in charge.`,
                "WARNING"
            );
            await sendEmail(
                event.studentCoordinator.email,
                `[SMART OD] Your Coordinator Role has been Revoked — ${event.name}`,
                `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff7f7;border-radius:12px;border-left:4px solid #ef4444">
                    <h2 style="color:#dc2626">⚠️ Coordinator Role Revoked</h2>
                    <p>Hello <strong>${event.studentCoordinator.name}</strong>,</p>
                    <p>Your role as <strong>Student Coordinator</strong> for the event <strong>${event.name}</strong> has been revoked by the assigned staff.</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                    <p>Please contact your staff coordinator if you believe this is a mistake.</p>
                    <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                </div>`
            );
        }

        res.status(200).json({
            message: "Student Coordinator revoked successfully."
        });

    } catch (error) {
        console.error("Revoke Coordinator Error:", error);
        res.status(500).json({ message: "Failed to revoke student coordinator." });
    }
};

/* =====================================================
   STUDENT COORDINATOR: SUBMIT ROSTER (ARRAY OF ROLL NOS)
===================================================== */
exports.submitRoster = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rollNos } = req.body; // Array of strings e.g. ["21IT001", "21IT002"]
        const studentEmail = req.user.email;

        if (!Array.isArray(rollNos) || rollNos.length === 0) {
            return res.status(400).json({ message: "Invalid roster data provided." });
        }

        // 1. Verify Student Coordinator Authorization
        const student = await prisma.student.findUnique({ where: { email: studentEmail } });
        if (!student) return res.status(403).json({ message: "Student record not found." });

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { staffCoordinator: true }
        });

        if (!event) return res.status(404).json({ message: "Event not found." });

        if (event.studentCoordinatorId !== student.id) {
            return res.status(403).json({ message: "You are not the designated Student Coordinator for this event." });
        }

        if (event.isRosterApproved) {
            return res.status(400).json({ message: "Roster is already approved and locked by the Staff Coordinator." });
        }

        // 2. Verify Capacity Limit (0 means unlimited)
        if (event.maxParticipants > 0 && rollNos.length > event.maxParticipants) {
            return res.status(400).json({
                message: `Capacity exceeded. Maximum allowed: ${event.maxParticipants}, Provided: ${rollNos.length}`
            });
        }

        // 3. Validate Roll Numbers exist
        const students = await prisma.student.findMany({
            where: { rollNo: { in: rollNos } },
            select: { id: true, rollNo: true }
        });

        if (students.length !== rollNos.length) {
            const foundRolls = students.map(s => s.rollNo);
            const missingRolls = rollNos.filter(r => !foundRolls.includes(r));
            return res.status(400).json({
                message: "Some Roll Numbers do not exist in the database.",
                missingRolls
            });
        }

        const studentIds = students.map(s => s.id);

        // 4. Clean existing unapproved ODs for this event (Safety wipe before inserting new draft)
        await prisma.od.deleteMany({
            where: {
                eventId: event.id,
                status: "PENDING", // If they somehow have regular pending ODs for this event, we wipe them to replace with the strict PROVISIONAL roster
                type: "INTERNAL"
            }
        });

        // Also delete any existing PROVISIONAL ones in case the coordinator is updating the draft before staff approval
        await prisma.od.deleteMany({
            where: {
                eventId: event.id,
                status: "PROVISIONAL",
                type: "INTERNAL"
            }
        });

        // 5. Create PROVISIONAL mapping ODs for every student
        const provisionalData = studentIds.map(studentId => ({
            trackerId: `INT-${Math.floor(100000 + Math.random() * 900000)}`,
            activityId: `ACT-PROV-${Math.floor(Math.random() * 10000)}`,
            studentId,
            eventId: event.id,
            type: "INTERNAL",
            startDate: event.startDate,
            endDate: event.endDate,
            duration: Math.ceil((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1,
            status: "PROVISIONAL", // Wait for Staff Approval to activate
            remarks: `Pre-Registered for Internal Event: ${event.name}`
        }));

        await prisma.od.createMany({
            data: provisionalData
        });

        // 6. Mark Roster as Submitted
        await prisma.event.update({
            where: { id: event.id },
            data: { isRosterSubmitted: true }
        });

        // 7. Notify Staff Coordinator
        if (event.staffCoordinator) {
            await notificationService.createNotification(
                event.staffCoordinator.email,
                "Action Required: Roster Submitted",
                `The Student Coordinator for ${event.name} has submitted the final roster (${rollNos.length} students). Please review and approve to officially lock the registrations.`,
                "INFO"
            );
        }

        res.status(200).json({
            message: "Roster draft submitted successfully. Pending Staff Approval.",
            count: rollNos.length
        });

    } catch (error) {
        console.error("Submit Roster Error:", error);
        res.status(500).json({ message: "Failed to submit roster." });
    }
};

/* =====================================================
   STAFF/ADMIN: GET ROSTER DETAILS
==================================================== */
exports.getRoster = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userEmail = req.user.email;
        const role = req.user.role;

        // 1. Verify Authorization (Staff or Admin)
        if (role !== 'FACULTY' && role !== 'ADMIN') {
            return res.status(403).json({ message: "Only Staff or Admins can view the full roster." });
        }

        const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
        if (!event) return res.status(404).json({ message: "Event not found." });

        if (role === 'FACULTY' && event.staffCoordinatorId !== (await prisma.faculty.findUnique({ where: { email: userEmail } })).id) {
            return res.status(403).json({ message: "You are not the designated Staff Coordinator for this event." });
        }

        // 2. Fetch all ODs linked to this event (these are the rostered students)
        const rosterOds = await prisma.od.findMany({
            where: { eventId: parseInt(eventId) },
            include: {
                student: {
                    select: { name: true, rollNo: true, department: true, semester: true }
                }
            },
            orderBy: { student: { rollNo: 'asc' } }
        });

        const formattedRoster = rosterOds.map(od => ({
            id: od.student.rollNo, // For stable keys
            name: od.student.name,
            rollNo: od.student.rollNo,
            department: od.student.department,
            semester: od.student.semester,
            status: od.status
        }));

        res.status(200).json({
            isApproved: event.isRosterApproved,
            count: formattedRoster.length,
            roster: formattedRoster
        });

    } catch (error) {
        console.error("Get Roster Error:", error);
        res.status(500).json({ message: "Failed to fetch roster." });
    }
};

/* =====================================================
   STAFF COORDINATOR: APPROVE ROSTER AND ACTIVATE PASSES
===================================================== */
exports.approveRoster = async (req, res) => {
    try {
        const { eventId } = req.params;
        const staffEmail = req.user.email;

        // 1. Verify Staff Authorization
        const staff = await prisma.faculty.findUnique({ where: { email: staffEmail } });
        if (!staff) return res.status(403).json({ message: "Only Staff can approve rosters." });

        const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
        if (!event) return res.status(404).json({ message: "Event not found." });

        if (event.staffCoordinatorId !== staff.id) {
            return res.status(403).json({ message: "You are not the designated Staff Coordinator for this event." });
        }

        if (event.isRosterApproved) {
            return res.status(400).json({ message: "Roster is already approved." });
        }

        if (!event.isRosterSubmitted) {
            return res.status(400).json({ message: "Roster must be submitted by the Student Coordinator before it can be approved." });
        }

        // 2. Lock the Event Roster
        await prisma.event.update({
            where: { id: event.id },
            data: { isRosterApproved: true }
        });

        // 3. Notify all PROVISIONAL students their pass is ready
        // (We don't change the OD status. It STAYS PROVISIONAL. 
        // PROVISIONAL *is* the Gate Pass state. It only turns APPROVED when they scan at the venue.)

        const provisionalOds = await prisma.od.findMany({
            where: {
                eventId: event.id,
                status: "PROVISIONAL",
                type: "INTERNAL"
            },
            include: { student: true }
        });

        // Bulk notify (Can be optimized with bulk DB inserts in a real system)
        const notifications = provisionalOds.map(od => ({
            email: od.student.email,
            title: "Internal OD Gate Pass Ready",
            message: `You are officially registered for ${event.name}. Your Gate Pass QR is ready on your dashboard to show your class teacher.`,
            type: "SUCCESS",
            createdAt: new Date(),
            read: false
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }

        // 3. Email all rostered students their gate pass is ready
        const emailPromises = provisionalOds.map(od =>
            sendEmail(
                od.student.email,
                `[SMART OD] Your Gate Pass is Ready — ${event.name}`,
                `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f0fdf4;border-radius:12px;border-left:4px solid #22c55e">
                    <h2 style="color:#16a34a">✅ Gate Pass Ready</h2>
                    <p>Hello <strong>${od.student.name}</strong>,</p>
                    <p>You are officially registered for:</p>
                    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                        <p style="margin:0 0 8px"><strong>Event:</strong> ${event.name}</p>
                        <p style="margin:0 0 8px"><strong>Start:</strong> ${new Date(event.startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        <p style="margin:0"><strong>End:</strong> ${new Date(event.endDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <p>Your <strong>Digital Gate Pass QR</strong> is now available on your student dashboard. Show it to your class teacher to get permission to attend.</p>
                    <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                </div>`
            )
        );
        await Promise.allSettled(emailPromises); // allSettled so one failed email doesn't block others

        res.status(200).json({
            message: "Roster officially approved. Digital Gate Passes generated for registered students.",
            approvedCount: provisionalOds.length
        });

    } catch (error) {
        console.error("Approve Roster Error:", error);
        res.status(500).json({ message: "Failed to approve roster." });
    }
};

/* =====================================================
   ADMIN: REVOKE STAFF COORDINATOR (MENTOR)
===================================================== */
exports.revokeStaffCoordinator = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { reason } = req.body;
        const adminEmail = req.user.email;

        // 1. Verify Admin
        const admin = await prisma.admin.findUnique({ where: { email: adminEmail } });
        if (!admin) return res.status(403).json({ message: "Only Admins can revoke Staff Coordinators." });

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: {
                staffCoordinator: true,
                studentCoordinator: true
            }
        });

        if (!event) return res.status(404).json({ message: "Event not found." });
        if (!event.staffCoordinatorId) {
            return res.status(400).json({ message: "No staff coordinator is currently assigned to this event." });
        }

        const currentTimeline = Array.isArray(event.timeline) ? event.timeline : [];
        const logEntry = {
            action: "STAFF_COORDINATOR_REVOKED",
            time: new Date(),
            performedBy: { name: admin.name, role: "ADMIN" },
            details: {
                revokedStaff: { name: event.staffCoordinator.name, email: event.staffCoordinator.email },
                revokedStudent: event.studentCoordinator ? { name: event.studentCoordinator.name, rollNo: event.studentCoordinator.rollNo } : null,
                reason: reason || "No reason provided."
            }
        };

        // 2. Perform Removal: Nullify both staff and student coordinator
        await prisma.event.update({
            where: { id: parseInt(eventId) },
            data: {
                staffCoordinatorId: null,
                studentCoordinatorId: null,
                timeline: [...currentTimeline, logEntry]
            }
        });

        // 3. Notify + Email revoked staff
        await notificationService.createNotification(
            event.staffCoordinator.email,
            "Staff Coordinator Access Revoked",
            `Your Staff Coordinator access for the event "${event.name}" has been revoked by the admin. Reason: ${reason || 'No reason provided.'}.`,
            "WARNING"
        );
        await sendEmail(
            event.staffCoordinator.email,
            `[SMART OD] Your Staff Coordinator Access has been Revoked — ${event.name}`,
            `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff7f7;border-radius:12px;border-left:4px solid #ef4444">
                <h2 style="color:#dc2626">⚠️ Staff Coordinator Access Revoked</h2>
                <p>Hello <strong>${event.staffCoordinator.name}</strong>,</p>
                <p>Your role as <strong>Staff Coordinator</strong> for <strong>${event.name}</strong> has been revoked by an administrator.</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                <p>If you believe this is an error, please contact the admin.</p>
                <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
            </div>`
        );

        // 4. Notify + Email revoked student coordinator (if any)
        if (event.studentCoordinator) {
            await notificationService.createNotification(
                event.studentCoordinator.email,
                "Student Coordinator Access Revoked",
                `Your Student Coordinator access for "${event.name}" has been removed along with the staff coordinator by an admin.`,
                "WARNING"
            );
            await sendEmail(
                event.studentCoordinator.email,
                `[SMART OD] Your Coordinator Role has been Removed — ${event.name}`,
                `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff7f7;border-radius:12px;border-left:4px solid #ef4444">
                    <h2 style="color:#dc2626">⚠️ Coordinator Role Removed</h2>
                    <p>Hello <strong>${event.studentCoordinator.name}</strong>,</p>
                    <p>Your <strong>Student Coordinator</strong> role for <strong>${event.name}</strong> has been removed as the staff coordinator was revoked by an administrator.</p>
                    <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                </div>`
            );
        }

        res.json({ message: `Access revoked for Prof. ${event.staffCoordinator.name} and their team.` });

    } catch (error) {
        console.error("Revoke Staff Coordinator Error:", error);
        res.status(500).json({ message: "Failed to revoke staff coordinator access" });
    }
};
