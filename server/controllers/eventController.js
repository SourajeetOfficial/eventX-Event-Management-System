const Event = require('../models/eventModel');
const Registration = require('../models/registrationModel');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { validateEventData, canModifyEvent, hasAvailableSeats } = require('../utils/eventValidation');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    // Allow filtering by title or date
    const filter = {};
    
    if (req.query.title) {
      filter.title = { $regex: req.query.title, $options: 'i' };
    }
    
    if (req.query.date) {
      const dateObj = new Date(req.query.date);
      filter.date = {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(dateObj.setHours(23, 59, 59, 999))
      };
    }
    
    // Get total count for pagination info
    const total = await Event.countDocuments(filter);
    
    // Get events
    const events = await Event.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: 1 })
      .skip(startIndex)
      .limit(limit);

    // Enhance events with availableSeats calculation
    const eventsWithAvailability = await Promise.all(
      events.map(async (event) => {
        const confirmedRegistrations = await Registration.countDocuments({
          event: event._id,
          status: 'confirmed'
        });
        return {
          ...event.toObject(),
          availableSeats: event.totalSeats - confirmedRegistrations
        };
      })
    );
      
    return successResponse(res, {
      events: eventsWithAvailability,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name');
      
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Calculate available seats
    const confirmedRegistrations = await Registration.countDocuments({
      event: event._id,
      status: 'confirmed'
    });
    
    const eventWithAvailability = {
      ...event.toObject(),
      availableSeats: event.totalSeats - confirmedRegistrations
    };
    
    return successResponse(res, { event: eventWithAvailability });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      time, 
      location, 
      imageUrl, 
      totalSeats,  // Now expecting totalSeats from frontend
      seatsAvailable // Fallback if frontend still sends seatsAvailable
    } = req.body;
    
    // Use totalSeats if provided, otherwise fallback to seatsAvailable
    const finalTotalSeats = totalSeats || seatsAvailable;
    
    if (!finalTotalSeats || finalTotalSeats < 1) {
      return errorResponse(res, 'Total seats must be at least 1', 400);
    }

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      time,
      location,
      imageUrl: imageUrl || 'https://via.placeholder.com/300',
      totalSeats: Number(finalTotalSeats), // Corrected field name
      createdBy: req.user._id
    });
    
    return successResponse(res, { event }, 201);
  } catch (error) {
    console.error('Event creation error:', error);
    return errorResponse(res, {
      message: 'Failed to create event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, 400);
  }
}
// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event exists and can be modified
    const modifyCheck = await canModifyEvent(eventId);
    if (!modifyCheck.success) {
      return errorResponse(res, modifyCheck.message, 404);
    }

    // Validate the update data
    const { isValid, errors } = validateEventData(req.body, true);
    if (!isValid) {
      return errorResponse(res, errors.join(', '), 400);
    }

    let event = await Event.findById(eventId);
    
    // Handle partial updates
    const updatableFields = ['title', 'description', 'date', 'time', 'location', 'imageUrl', 'totalSeats', 'status', 'isFeatured'];
    const updates = {};
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    // If updating total seats, check if new capacity is valid
    if (updates.totalSeats) {
      const registrationCount = await Registration.countDocuments({
        event: eventId,
        status: 'confirmed'
      });
      
      if (updates.totalSeats < registrationCount) {
        return errorResponse(
          res, 
          `Cannot reduce capacity below current registration count (${registrationCount})`,
          400
        );
      }
    }

    // Apply updates and save
    Object.assign(event, updates);
    const updatedEvent = await event.save();

    // Get current registration count for availability
    const confirmedRegistrations = await Registration.countDocuments({
      event: eventId,
      status: 'confirmed'
    });

    // Return event with availability info
    const eventWithAvailability = {
      ...updatedEvent.toObject(),
      availableSeats: updatedEvent.totalSeats - confirmedRegistrations
    };
    
    return successResponse(res, { 
      event: eventWithAvailability,
      message: modifyCheck.message !== 'Event can be modified' ? modifyCheck.message : 'Event updated successfully'
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }
    
    // Check if there are registrations
    const registrations = await Registration.countDocuments({ event: event._id });
    
    if (registrations > 0) {
      return errorResponse(
        res,
        'Cannot delete event with active registrations',
        400
      );
    }
    
    await event.deleteOne();
    
    return successResponse(res, { message: 'Event removed' });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get event statistics
// @route   GET /api/events/:id/stats
// @access  Private/Admin
const getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }
    
    const totalRegistrations = await Registration.countDocuments({
      event: event._id,
      status: 'confirmed'
    });
    
    const cancellations = await Registration.countDocuments({
      event: event._id,
      status: 'cancelled'
    });
    
    const availableSeats = event.totalSeats - totalRegistrations;
    
    return successResponse(res, {
      eventId: event._id,
      title: event.title,
      totalSeats: event.totalSeats,
      totalRegistrations,
      cancellations,
      availableSeats,
      occupancyRate: (totalRegistrations / event.totalSeats) * 100
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats
};