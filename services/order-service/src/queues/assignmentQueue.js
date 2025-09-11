// queues/assignmentQueue.js
const Queue = require("bull");
const IORedis = require("ioredis");

// Use the primary Redis URL for write operations
const redisUrl = process.env.REDIS_PRIMARY_URL || process.env.REDIS_HOST || "redis://localhost:6379";

// Parse Redis URL to get connection options
const redisOptions = {
  // Bull disallows readyCheck + maxRetriesPerRequest on subscriber and bclient
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// If REDIS_PRIMARY_URL is provided, use it; otherwise fall back to host/port
if (process.env.REDIS_PRIMARY_URL) {
  redisOptions.url = redisUrl;
} else {
  redisOptions.host = process.env.REDIS_HOST || "localhost";
  redisOptions.port = parseInt(process.env.REDIS_PORT, 10) || 6379;
}

// Create three separate connections
const client = new IORedis(redisOptions);
const subscriber = new IORedis(redisOptions);
const bclient = new IORedis(redisOptions);

// Add connection event handlers
client.on('connect', () => console.log('Assignment Queue Redis client connected'));
client.on('error', (err) => console.error('Assignment Queue Redis client error:', err));

subscriber.on('connect', () => console.log('Assignment Queue Redis subscriber connected'));
subscriber.on('error', (err) => console.error('Assignment Queue Redis subscriber error:', err));

bclient.on('connect', () => console.log('Assignment Queue Redis bclient connected'));
bclient.on('error', (err) => console.error('Assignment Queue Redis bclient error:', err));

const assignmentQueue = new Queue("dealer-assignment", {
  createClient: (type) => {
    console.log(`Creating Redis client for type: ${type}`);
    switch (type) {
      case "client":
        return client;
      case "subscriber":
        return subscriber;
      case "bclient":
        return bclient;
      default:
        return client;
    }
  },
});

// Add queue event handlers for debugging
assignmentQueue.on('error', (error) => {
  console.error('Assignment Queue error:', error);
});

assignmentQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

assignmentQueue.on('active', (job) => {
  console.log(`Job ${job.id} is now active`);
});

assignmentQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

assignmentQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = assignmentQueue;
