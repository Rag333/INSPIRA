const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likerProfileImage: String,
  likerUsername: String,
  postImage: String,
  type: {
    type: String,
    enum: ['like'],
    default: 'like'
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
