const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Register for an event
// @route   POST /api/registrations/:eventId
// @access  Private
const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user._id;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }
    
    // Check if already registered
    const existingRegistration = await Registration.findOne({
      user: userId,
      event: eventId
    });
    
    if (existingRegistration) {
      if (existingRegistration.status === 'confirmed') {
        return errorResponse(res, 'Already registered for this event', 400);
      } else if (existingRegistration.status === 'cancelled') {
        // Re-register after cancellation
        existingRegistration.status = 'confirmed';
        existingRegistration.registrationDate = Date.now();
        await existingRegistration.save();
        
        // Update event registration count
        event.registeredUsers += 1;
        await event.save();
        
        return successResponse(
          res, 
          { registration: existingRegistration },
          200
        );
      }
    }
    
    // Check if seats are available
    const registeredCount = await Registration.countDocuments({
      event: eventId,
      status: 'confirmed'
    });
    
    if (registeredCount >= event.totalSeats) {
      return errorResponse(res, 'Event is fully booked', 400);
    }
    
    // Create new registration
    const registration = await Registration.create({
      user: userId,
      event: eventId
    });
    
    // Update event registered users count
    event.registeredUsers += 1;
    await event.save();
    
    return successResponse(res, { registration }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get user's registrations
// @route   GET /api/registrations/mine
// @access  Private
const getUserRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user._id
    })
    .populate({
      path: 'event',
      select: 'title description date time location imageUrl'
    })
    .sort({ registrationDate: -1 });
    
    return successResponse(res, { registrations });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get all registrations for an event
// @route   GET /api/registrations/event/:eventId
// @access  Private/Admin
const getEventRegistrations = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }
    
    // Get registrations with user details
    const registrations = await Registration.find({
      event: eventId
    })
    .populate({
      path: 'user',
      select: 'name email'
    })
    .sort({ registrationDate: -1 });
    
    return successResponse(res, { registrations });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Cancel registration
// @route   PUT /api/registrations/:id/cancel
// @access  Private
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return errorResponse(res, 'Registration not found', 404);
    }
    
    // Check if user owns this registration or is admin
    if (registration.user.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized', 403);
    }
    
    // Check if already cancelled
    if (registration.status === 'cancelled') {
      return errorResponse(res, 'Registration already cancelled', 400);
    }
    
    // Update registration status
    registration.status = 'cancelled';
    await registration.save();
    
    // Update event registered users count
    const event = await Event.findById(registration.event);
    event.registeredUsers -= 1;
    await event.save();
    
    return successResponse(res, { registration });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Check registration status
// @route   GET /api/registrations/check/:eventId
// @access  Private
const checkRegistrationStatus = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user._id;
    
    const registration = await Registration.findOne({
      user: userId,
      event: eventId
    });
    
    if (!registration) {
      return successResponse(res, { registered: false });
    }
    
    return successResponse(res, {
      registered: registration.status === 'confirmed',
      status: registration.status,
      registrationId: registration._id,
      registrationDate: registration.registrationDate
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// In registrationController.js
const getRegistrationStats = async (req, res) => {
  try {
    // Get all registrations with populated user and event data
    const registrations = await Registration.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'event',
        select: 'title date location'
      })
      .sort({ registrationDate: -1 });
    
    // Get some basic stats
    const confirmedCount = await Registration.countDocuments({ status: 'confirmed' });
    const cancelledCount = await Registration.countDocuments({ status: 'cancelled' });
    
    return successResponse(res, {
      registrations,
      stats: {
        total: registrations.length,
        confirmed: confirmedCount,
        cancelled: cancelledCount
      }
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['confirmed', 'cancelled', 'waitlisted'].includes(status)) {
      return errorResponse(res, 'Invalid status value', 400);
    }
    
    // Find registration
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return errorResponse(res, 'Registration not found', 404);
    }
    
    // Update status
    registration.status = status;
    await registration.save();
    
    // Populate user and event details
    await registration.populate({
      path: 'user',
      select: 'name email'
    });
    
    await registration.populate({
      path: 'event',
      select: 'title date'
    });
    
    return successResponse(res, {
      registration
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};


module.exports = {
  registerForEvent,
  getUserRegistrations,
  getEventRegistrations,
  cancelRegistration,
  checkRegistrationStatus,
  getRegistrationStats,
  updateRegistrationStatus
};