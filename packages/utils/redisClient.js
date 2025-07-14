// /utils/redisClient.js
const { createClient } = require("redis");
const logger = require("./logger"); // assume you have this

/* ------------------------------------------------------------- */
/*  Primary (read-write) – use your PRIMARY / RW endpoint here   */
/* ------------------------------------------------------------- */
const redisWriter = createClient({
  url: process.env.REDIS_PRIMARY_URL || "redis://redis_container:6379",
});
redisWriter.on("ready", () => logger.info("Redis-writer ready"));
redisWriter.on("error", (e) => logger.error("Redis-writer ERR", e));

/* ------------------------------------------------------------- */
/*  Replica (read-only) – optional. Leave undefined if you       */
/*  don’t have a RO endpoint.                                    */
/* ------------------------------------------------------------- */
const redisReader = createClient({
  url: "redis://redis_container:6379",
});
redisReader.on("ready", () => logger.info("Redis-reader ready"));
redisReader.on("error", (e) => logger.error("Redis-reader ERR", e));

/* Connect immediately so the first request isn’t blocked */
(async () => {
  await Promise.all([redisWriter.connect(), redisReader.connect()]);
})();

module.exports = { redisWriter, redisReader };
