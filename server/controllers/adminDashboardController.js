const Event = require('../models/eventModel');
const Registration = require('../models/registrationModel');
const User = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    // Get total counts
    const totalEvents = await Event.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    
    // Get upcoming events
    const now = new Date();
    const upcomingEvents = await Event.find({
      date: { $gte: now }
    })
    .sort({ date: 1 })
    .limit(5);
    
    // Get recent registrations with user and event details
    const recentRegistrations = await Registration.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'event',
        select: 'title date'
      })
      .sort({ registrationDate: -1 })
      .limit(10);
    
    // Get event popularity stats
    const popularEvents = await Registration.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate the event details for popular events
    const populatedPopularEvents = await Event.populate(popularEvents, {
      path: '_id',
      select: 'title date totalSeats'
    });
    
    // Format the popular events data
    const formattedPopularEvents = populatedPopularEvents.map(item => ({
      event: item._id,
      registrationCount: item.count
    }));
    
    // Calculate occupancy rates
    const eventsWithRegistrations = await Event.find();
    const occupancyRates = [];
    
    for (const event of eventsWithRegistrations) {
      const registrationCount = await Registration.countDocuments({
        event: event._id,
        status: 'confirmed'
      });
      
      occupancyRates.push({
        eventId: event._id,
        title: event.title,
        date: event.date,
        occupancyRate: (registrationCount / event.totalSeats) * 100,
        registeredUsers: registrationCount,
        totalSeats: event.totalSeats
      });
    }
    
    // Sort by occupancy rate
    occupancyRates.sort((a, b) => b.occupancyRate - a.occupancyRate);
    
    return successResponse(res, {
      counts: {
        totalEvents,
        totalUsers,
        totalRegistrations
      },
      upcomingEvents,
      recentRegistrations,
      popularEvents: formattedPopularEvents,
      occupancyRates: occupancyRates.slice(0, 5) // Top 5 by occupancy
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getAdminDashboard
};