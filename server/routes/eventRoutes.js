const express = require('express');
const { check } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');
const { 
  getEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getEventStats
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected admin routes
router.post(
  '/',
  [
    protect,
    admin,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('date', 'Valid date is required').isISO8601().toDate(),
      check('time', 'Time is required').not().isEmpty(),
      check('location', 'Location is required').not().isEmpty(),
      check('totalSeats', 'Number of available seats is required').isInt({ min: 1 })
    ],
    validateRequest
  ],
  createEvent
);

router.put(
  '/:id',
  [
    protect,
    admin,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('date', 'Valid date is required').isISO8601().toDate(),
      check('time', 'Time is required').not().isEmpty(),
      check('location', 'Location is required').not().isEmpty(),
      check('totalSeats', 'Number of available seats is required').isInt({ min: 1 })
    ],
    validateRequest
  ],
  updateEvent
);

router.delete('/:id', [protect, admin], deleteEvent);
router.get('/:id/stats', [protect, admin], getEventStats);

module.exports = router;