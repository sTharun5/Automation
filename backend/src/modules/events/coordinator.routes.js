const express = require('express');
const router = express.Router();
const coordinatorController = require('./coordinator.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/isAdmin.middleware');

// Staff Coordinator assigns a Student Coordinator
router.post('/events/:eventId/assign-coordinator', verifyToken, coordinatorController.assignStudentCoordinator);

// Staff Coordinator revokes a Student Coordinator
router.put('/events/:eventId/revoke-coordinator', verifyToken, coordinatorController.revokeStudentCoordinator);

// Staff or Admin gets the current Roster draft/approved list
router.get('/events/:eventId/roster', verifyToken, coordinatorController.getRoster);

// Student Coordinator uploads their finalized roster (Array of Roll Numbers)
router.post('/events/:eventId/roster', verifyToken, coordinatorController.submitRoster);

// Staff Coordinator formally approves the roster to lock it and generate Provisional OD Passes
router.post('/events/:eventId/approve-roster', verifyToken, coordinatorController.approveRoster);

// Admin revokes a Staff Coordinator (Mentor)
router.put('/events/:eventId/revoke-mentor', verifyToken, isAdmin, coordinatorController.revokeStaffCoordinator);

module.exports = router;
