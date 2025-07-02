// /utils/redisClient.js
const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://redis_container:6379",
});

client.on("error", (err) => console.error("Redis Client Error", err));

client.connect();

module.exports = client;
