const express = require('express');
const { createInternalEvent, editInternalEvent, getLiveEventQR, getActiveEvents, deleteInternalEvent, deleteAllInternalEvents, getEventAttendance, getMyAssignedEvents } = require('./event.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/isAdmin.middleware');

const router = express.Router();

// Admin Routes
router.post('/internal', verifyToken, isAdmin, createInternalEvent);
router.put('/internal/:eventId', verifyToken, isAdmin, editInternalEvent);
router.delete('/internal/all', verifyToken, isAdmin, deleteAllInternalEvents);
router.delete('/internal/:eventId', verifyToken, isAdmin, deleteInternalEvent);
router.get('/internal/:eventId/attendance', verifyToken, isAdmin, getEventAttendance);

// Faculty & Student Routes
router.get('/internal/my-assigned', verifyToken, getMyAssignedEvents);

// Public / Shared Routes
router.get('/:eventId/live-qr', verifyToken, getLiveEventQR);
router.get('/active', verifyToken, getActiveEvents);

module.exports = router;