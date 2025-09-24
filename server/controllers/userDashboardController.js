const Event = require('../models/eventModel');
const Registration = require('../models/registrationModel');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get upcoming registered events
    const upcomingRegistrations = await Registration.find({
      user: userId,
      status: 'confirmed'
    })
    .populate({
      path: 'event',
      select: 'title date time location'
    })
    .sort({ 'event.date': 1 })
    .limit(5);
    
    // Filter out past events
    const now = new Date();
    const futureRegistrations = upcomingRegistrations.filter(reg => {
      const eventDate = new Date(reg.event.date);
      return eventDate >= now;
    });
    
    // Get registration statistics
    const totalRegistrations = await Registration.countDocuments({
      user: userId
    });
    
    const activeRegistrations = await Registration.countDocuments({
      user: userId,
      status: 'confirmed'
    });
    
    const cancelledRegistrations = await Registration.countDocuments({
      user: userId,
      status: 'cancelled'
    });
    
    // Get most recent event activity
    const recentActivity = await Registration.find({
      user: userId
    })
    .populate({
      path: 'event',
      select: 'title'
    })
    .sort({ registrationDate: -1 })
    .limit(10);
    
    // Get recommended events (events with available seats that the user hasn't registered for)
    const userRegisteredEventIds = await Registration.find({
      user: userId
    }).distinct('event');
    
    const recommendedEvents = await Event.find({
      _id: { $nin: userRegisteredEventIds },
      date: { $gte: now },
      totalSeats: { $gt: 0 }
    })
    .sort({ date: 1 })
    .limit(3);
    
    return successResponse(res, {
      upcomingEvents: futureRegistrations,
      stats: {
        totalRegistrations,
        activeRegistrations,
        cancelledRegistrations
      },
      recentActivity,
      recommendedEvents
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getUserDashboard
};