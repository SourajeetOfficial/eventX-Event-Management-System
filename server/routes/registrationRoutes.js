const express = require('express');
const { 
  registerForEvent, 
  getUserRegistrations, 
  getEventRegistrations, 
  cancelRegistration,
  checkRegistrationStatus,
  getRegistrationStats,
  updateRegistrationStatus // Add this new controller function
} = require('../controllers/registrationController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// User registration routes
router.post('/:eventId', protect, registerForEvent);
router.get('/mine', protect, getUserRegistrations);
router.put('/:id/cancel', protect, cancelRegistration);
router.get('/check/:eventId', protect, checkRegistrationStatus);

// Admin routes
router.get('/event/:eventId', [protect, admin], getEventRegistrations);
router.get('/stats', [protect, admin], getRegistrationStats);
router.put('/:id/status', [protect, admin], updateRegistrationStatus); // Add this new route

module.exports = router;