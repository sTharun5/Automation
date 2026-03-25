const express = require('express');
const { createInternalEvent, editInternalEvent, getLiveEventQR, getActiveEvents, deleteInternalEvent, deleteAllInternalEvents, getEventAttendance, getMyAssignedEvents } = require('./event.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/isAdmin.middleware');

const router = express.Router();

// Static routes MUST come before dynamic /:eventId routes to avoid Express mis-matching

// Admin Routes
router.post('/internal', verifyToken, isAdmin, createInternalEvent);
router.delete('/internal/all', verifyToken, isAdmin, deleteAllInternalEvents); // Must be before /internal/:eventId
router.get('/internal/:eventId/attendance', verifyToken, isAdmin, getEventAttendance);
router.put('/internal/:eventId', verifyToken, isAdmin, editInternalEvent);
router.delete('/internal/:eventId', verifyToken, isAdmin, deleteInternalEvent);

// Faculty & Student Routes (static route before dynamic)
router.get('/internal/my-assigned', verifyToken, getMyAssignedEvents);
router.get('/active', verifyToken, getActiveEvents);

// Dynamic Route (must come last)
router.get('/:eventId/live-qr', verifyToken, getLiveEventQR);

module.exports = router;