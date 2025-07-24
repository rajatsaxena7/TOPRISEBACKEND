// queues/assignmentQueue.js
const Queue = require("bull");
const IORedis = require("ioredis");

const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  // Bull disallows readyCheck + maxRetriesPerRequest on subscriber and bclient
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create three separate connections
const client = new IORedis(redisOptions);
const subscriber = new IORedis(redisOptions);
const bclient = new IORedis(redisOptions);

const assignmentQueue = new Queue("dealer-assignment", {
  createClient: (type) => {
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

module.exports = assignmentQueue;
