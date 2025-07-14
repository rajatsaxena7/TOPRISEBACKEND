// /utils/cache.js
const { redisWriter, redisReader } = require("./redisClient");
const logger = require("./logger");

const SAFE_TTL = 60 * 60; // 1 hour

// ---------- GET ----------
exports.cacheGet = async (key) => {
  try {
    const raw = await redisReader.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    logger.warn(`Redis GET failed (${e.code}): ${e.message}`);
    return null; // never throw – controller will hit Mongo
  }
};

// ---------- SET ----------
exports.cacheSet = async (key, value, ttl = SAFE_TTL) => {
  try {
    await redisWriter.setEx(key, ttl, JSON.stringify(value));
  } catch (e) {
    logger.warn(`Redis SET failed (${e.code}): ${e.message}`);
    // swallow error – don’t break the normal response flow
  }
};
