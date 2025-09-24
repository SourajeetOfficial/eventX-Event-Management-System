const Event = require('../models/eventModel');
const Registration = require('../models/registrationModel');

// Check if event date is in the future with timezone consideration
const isDateValid = (date, time) => {
  const eventDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  return eventDateTime > now;
};

// Check if event has available seats
const hasAvailableSeats = async (eventId, requestedSeats = 1) => {
  const event = await Event.findById(eventId);
  
  if (!event) {
    return { success: false, message: 'Event not found' };
  }
  
  const registeredCount = await Registration.countDocuments({
    event: eventId,
    status: 'confirmed'
  });
  
  const availableSeats = event.totalSeats - registeredCount;
  
  return {
    success: availableSeats >= requestedSeats,
    availableSeats,
    message: availableSeats < requestedSeats ? 
      `Only ${availableSeats} seats available` : 
      'Seats available'
  };
};

// Check if user is already registered for event
const isUserRegistered = async (userId, eventId) => {
  const registration = await Registration.findOne({
    user: userId,
    event: eventId,
    status: { $in: ['confirmed', 'pending'] }
  });
  
  return {
    isRegistered: !!registration,
    status: registration ? registration.status : null,
    registrationId: registration ? registration._id : null
  };
};

// Validate event data for creation and updates
const validateEventData = (data, isUpdate = false) => {
  const errors = [];
  const requiredFields = ['title', 'description', 'date', 'time', 'location', 'totalSeats'];
  
  // For creation, check all required fields
  if (!isUpdate) {
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`${field} is required`);
      }
    });
  }

  // Validate fields if they are present in update data
  if (data.date && data.time && !isDateValid(data.date, data.time)) {
    errors.push('Event date and time must be in the future');
  }

  if (data.totalSeats && (isNaN(data.totalSeats) || data.totalSeats < 1)) {
    errors.push('Total seats must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Check if event can be modified
const canModifyEvent = async (eventId) => {
  const event = await Event.findById(eventId);
  
  if (!event) {
    return { success: false, message: 'Event not found' };
  }

  const hasStarted = new Date(`${event.date}T${event.time}`) <= new Date();
  const hasRegistrations = await Registration.exists({
    event: eventId,
    status: 'confirmed'
  });

  return {
    success: !hasStarted,
    message: hasStarted ? 'Cannot modify an event that has already started' :
             hasRegistrations ? 'Warning: Event has existing registrations' : 
             'Event can be modified'
  };
};

module.exports = {
  isDateValid,
  hasAvailableSeats,
  isUserRegistered,
  validateEventData,
  canModifyEvent
};