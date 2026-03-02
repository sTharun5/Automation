const express = require('express');
const { createInternalEvent, getLiveEventQR, getActiveEvents, deleteInternalEvent, deleteAllInternalEvents, getEventAttendance } = require('./event.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/isAdmin.middleware');

const router = express.Router();

// Admin Routes
router.post('/internal', verifyToken, isAdmin, createInternalEvent);
router.delete('/internal/all', verifyToken, isAdmin, deleteAllInternalEvents);
router.delete('/internal/:eventId', verifyToken, isAdmin, deleteInternalEvent);
router.get('/internal/:eventId/attendance', verifyToken, isAdmin, getEventAttendance);

// Public / Shared Routes
router.get('/:eventId/live-qr', verifyToken, getLiveEventQR);
router.get('/active', verifyToken, getActiveEvents);

module.exports = router;