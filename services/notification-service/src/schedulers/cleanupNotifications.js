
const cron = require('node-cron');
const mongoose = require('mongoose');
const Notification = require('../model/notification'); // adjust path as needed
const logger = require('/packages/utils/logger');

// Schedule: “0 0 * * *” → At 00:00 every day
cron.schedule('0 0 * * *', async () => {
  try {
    // Compute threshold date: one calendar month ago
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - 1);

    const result = await Notification.deleteMany({
      createdAt: { $lt: threshold },
      $or: [
        { markAsRead: true },
        { isUserDeleted: true }
      ]
    });

    logger.info(`🗑️  cleanupNotifications: deleted ${result.deletedCount} old notifications`);
  } catch (err) {
    logger.error('❌ cleanupNotifications error:', err);
  }
});

module.exports = cron;