const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'cancellation', 'reminder', 'update', 'system'],
    default: 'system'
  },
  relatedTo: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);