const cron = require('node-cron');
const slaViolationMiddleware = require('../middleware/slaViolationMiddleware');
const logger = require('/packages/utils/logger');

/**
 * SLA Violation Scheduler
 * Automatically checks for SLA violations at regular intervals
 */
class SLAViolationScheduler {
  constructor() {
    this.isRunning = false;
    this.scheduledJobs = new Map();
  }

  /**
   * Start the SLA violation scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('SLA violation scheduler is already running');
      return;
    }

    logger.info('Starting SLA violation scheduler...');

    // Schedule regular SLA violation checks (every 15 minutes)
    this.scheduleSLAViolationCheck();

    // Schedule warning checks for orders approaching SLA violation (every 5 minutes)
    this.scheduleWarningCheck();

    // Schedule daily summary report (every day at 9 AM)
    this.scheduleDailyReport();

    this.isRunning = true;
    logger.info('SLA violation scheduler started successfully');
  }

  /**
   * Stop the SLA violation scheduler
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('SLA violation scheduler is not running');
      return;
    }

    logger.info('Stopping SLA violation scheduler...');

    // Stop all scheduled jobs
    this.scheduledJobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped scheduled job: ${name}`);
    });

    this.scheduledJobs.clear();
    this.isRunning = false;
    logger.info('SLA violation scheduler stopped successfully');
  }

  /**
   * Schedule regular SLA violation checks
   */
  scheduleSLAViolationCheck() {
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('Running scheduled SLA violation check...');
        const result = await slaViolationMiddleware.checkAllActiveOrders();
        logger.info(`Scheduled SLA check completed: ${result.processedCount} orders processed, ${result.violationCount} violations found`);
      } catch (error) {
        logger.error('Error in scheduled SLA violation check:', error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata" // Adjust timezone as needed
    });

    job.start();
    this.scheduledJobs.set('slaViolationCheck', job);
    logger.info('Scheduled SLA violation check: every 15 minutes');
  }

  /**
   * Schedule warning checks for orders approaching SLA violation
   */
  scheduleWarningCheck() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Running scheduled SLA warning check...');
        const approachingViolations = await slaViolationMiddleware.getOrdersApproachingSLAViolation(30); // 30 minutes warning
        
        if (approachingViolations.length > 0) {
          logger.warn(`Found ${approachingViolations.length} orders approaching SLA violation:`);
          approachingViolations.forEach(violation => {
            logger.warn(`Order ${violation.orderId} (Dealer: ${violation.dealerId}) - ${violation.minutesUntilViolation} minutes until SLA violation`);
          });

          // Here you can add notification logic (email, SMS, etc.)
          await this.sendWarningNotifications(approachingViolations);
        }
      } catch (error) {
        logger.error('Error in scheduled SLA warning check:', error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    job.start();
    this.scheduledJobs.set('slaWarningCheck', job);
    logger.info('Scheduled SLA warning check: every 5 minutes');
  }

  /**
   * Schedule daily summary report
   */
  scheduleDailyReport() {
    const job = cron.schedule('0 9 * * *', async () => {
      try {
        logger.info('Generating daily SLA violation report...');
        await this.generateDailyReport();
      } catch (error) {
        logger.error('Error generating daily SLA report:', error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    job.start();
    this.scheduledJobs.set('dailyReport', job);
    logger.info('Scheduled daily SLA report: every day at 9 AM');
  }

  /**
   * Send warning notifications for orders approaching SLA violation
   * @param {Array} approachingViolations - Orders approaching SLA violation
   */
  async sendWarningNotifications(approachingViolations) {
    try {
      // Group violations by dealer
      const violationsByDealer = approachingViolations.reduce((acc, violation) => {
        if (!acc[violation.dealerId]) {
          acc[violation.dealerId] = [];
        }
        acc[violation.dealerId].push(violation);
        return acc;
      }, {});

      // Send notifications to each dealer
      for (const [dealerId, violations] of Object.entries(violationsByDealer)) {
        try {
          // Here you can implement notification logic
          // For example: email, SMS, push notification, etc.
          logger.info(`Sending warning notification to dealer ${dealerId} for ${violations.length} orders approaching SLA violation`);
          
          // Example notification payload
          const notificationPayload = {
            dealerId,
            violations: violations.map(v => ({
              orderId: v.orderId,
              minutesUntilViolation: v.minutesUntilViolation,
              expectedFulfillmentTime: v.expectedFulfillmentTime
            })),
            message: `You have ${violations.length} order(s) approaching SLA violation. Please prioritize these orders.`
          };

          // TODO: Implement actual notification sending
          // await notificationService.sendToDealer(dealerId, notificationPayload);
          
        } catch (error) {
          logger.error(`Failed to send warning notification to dealer ${dealerId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error sending warning notifications:', error);
    }
  }

  /**
   * Generate daily SLA violation report
   */
  async generateDailyReport() {
    try {
      const SLAViolation = require('../models/slaViolation');
      const DealerSLA = require('../models/dealerSla');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get violations from yesterday
      const violations = await SLAViolation.find({
        created_at: {
          $gte: yesterday,
          $lt: today
        }
      }).populate('order_id', 'orderId customerDetails');

      // Group violations by dealer
      const violationsByDealer = violations.reduce((acc, violation) => {
        if (!acc[violation.dealer_id]) {
          acc[violation.dealer_id] = [];
        }
        acc[violation.dealer_id].push(violation);
        return acc;
      }, {});

      // Generate report
      const report = {
        date: yesterday.toISOString().split('T')[0],
        totalViolations: violations.length,
        totalViolationMinutes: violations.reduce((sum, v) => sum + v.violation_minutes, 0),
        averageViolationMinutes: violations.length > 0 
          ? Math.round(violations.reduce((sum, v) => sum + v.violation_minutes, 0) / violations.length)
          : 0,
        violationsByDealer: Object.entries(violationsByDealer).map(([dealerId, dealerViolations]) => ({
          dealerId,
          violationCount: dealerViolations.length,
          totalViolationMinutes: dealerViolations.reduce((sum, v) => sum + v.violation_minutes, 0),
          averageViolationMinutes: Math.round(dealerViolations.reduce((sum, v) => sum + v.violation_minutes, 0) / dealerViolations.length)
        }))
      };

      logger.info('Daily SLA violation report:', report);

      // TODO: Send report to administrators
      // await notificationService.sendDailyReport(report);

    } catch (error) {
      logger.error('Error generating daily report:', error);
    }
  }

  /**
   * Manually trigger SLA violation check
   */
  async triggerManualCheck() {
    try {
      logger.info('Manual SLA violation check triggered...');
      const result = await slaViolationMiddleware.checkAllActiveOrders();
      logger.info(`Manual SLA check completed: ${result.processedCount} orders processed, ${result.violationCount} violations found`);
      return result;
    } catch (error) {
      logger.error('Error in manual SLA violation check:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      jobCount: this.scheduledJobs.size
    };
  }
}

// Create singleton instance
const slaViolationScheduler = new SLAViolationScheduler();

module.exports = slaViolationScheduler;
