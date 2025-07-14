/* /utils/cache.js
   ----------------------------------------------------------------------- */
const { redisWriter, redisReader } = require("./redisClient");
const logger = require("./logger");

const SAFE_TTL = 60 * 60; // 1 h default

/* ────────────────────────────────────────────────────────────────────── */
/*  GET                                                                  */
/* ────────────────────────────────────────────────────────────────────── */
exports.cacheGet = async (key) => {
  try {
    const raw = await redisReader.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    logger.warn(`Redis GET ${key} failed (${e.code || e.name}): ${e.message}`);
    return null; // never throw – fall back to Mongo
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  SET                                                                  */
/* ────────────────────────────────────────────────────────────────────── */
exports.cacheSet = async (key, value, ttl = SAFE_TTL) => {
  try {
    await redisWriter.setEx(key, ttl, JSON.stringify(value));
  } catch (e) {
    logger.warn(`Redis SET ${key} failed (${e.code || e.name}): ${e.message}`);
    // swallow – don’t break normal flow
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  DEL  – accepts a single key *or* an array of keys                    */
/* ────────────────────────────────────────────────────────────────────── */
exports.cacheDel = async (keys) => {
  try {
    const arr = Array.isArray(keys) ? keys : [keys];
    if (!arr.length) return;

    await redisWriter.del(arr);
  } catch (e) {
    logger.warn(`Redis DEL failed (${e.code || e.name}): ${e.message}`);
    // no re-throw – cache miss isn’t fatal
  }
};
