/* ──────────────────────────────────────────────────────────────── */
/*  controllers/appLogController.js                                */
/* ──────────────────────────────────────────────────────────────── */
const os = require("os");
const { v4: uuid } = require("uuid");
const AppLog = require("../models/loggingSection");

/* helper ───────────────────────────────────────────────────────── */
const pick = (obj, keys) =>
  keys.reduce((o, k) => {
    if (obj?.[k] !== undefined) o[k] = obj[k];
    return o;
  }, {});

/* ──────────────────────────────────────────────────────────────────
  1. WRITE A LOG PROGRAMMATICALLY
     usage: await writeLog({ level:'error', msg:'DB failed', err })
   ──────────────────────────────────────────────────────────────── */
exports.writeLog = async ({
  level = "info",
  msg,
  err = null,
  req = null,
  meta = {},
  is_internal = false,
}) => {
  try {
    const base = {
      level,
      msg,
      service: process.env.SERVICE_NAME || "api-gateway",
      hostname: os.hostname(),
      is_internal,
      meta,
    };

    /* attach request context if we have it */
    if (req) {
      Object.assign(base, {
        route: req.route?.path,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        headers: pick(req.headers, ["host", "user-agent", "referer"]),
        query: req.query,
        params: req.params,
        user_id: req.user?._id || req.authUserId, // adapt to your auth util
        request_id: req.id, // e.g. from express-request-id
      });
    }

    /* attach error details if present */
    if (err) {
      Object.assign(base, {
        err_name: err.name,
        err_message: err.message,
        stack: err.stack,
      });
    }

    await AppLog.create(base);
  } catch (e) {
    /* Never let logging kill the app */
    /* eslint-disable-next-line no-console */
    console.error("[AppLog] failed to write log →", e.message);
  }
};

/* ──────────────────────────────────────────────────────────────────
  2. LOGGING MIDDLEWARE  (records every request + latency)
   ──────────────────────────────────────────────────────────────── */
exports.logMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint(); // high-res timer
  req.id = uuid(); // simple request-id
  res.on("finish", async () => {
    const diffMs = Number(process.hrtime.bigint() - start) / 1e6;

    await exports.writeLog({
      level: "info",
      msg: "HTTP " + res.statusCode,
      req,
      meta: { response_ms: diffMs },
    });
  });
  next();
};

/* ──────────────────────────────────────────────────────────────────
  3. GET /api/logs   (rich filtering + pagination)
     query params:
       ?level=error,warn     comma list
       ?service=api-gateway
       ?user_id=abc123
       ?from=2025-07-01T00:00:00Z
       ?to=2025-07-05
       ?text=database         full-text (msg & err_message)
       ?page=1&limit=50
       ?sort=-ts             (<field>|-<field>)
   ──────────────────────────────────────────────────────────────── */
exports.getLogs = async (req, res) => {
  try {
    const {
      level,
      service,
      user_id,
      request_id,
      method,
      from,
      to,
      text,
      page = 1,
      limit = 50,
      sort = "-ts",
    } = req.query;

    const q = {};

    if (level) q.level = { $in: level.split(",") };
    if (service) q.service = service;
    if (user_id) q.user_id = user_id;
    if (request_id) q.request_id = request_id;
    if (method) q.method = method.toUpperCase();

    if (from || to)
      q.ts = Object.assign(
        {},
        from ? { $gte: new Date(from) } : {},
        to ? { $lte: new Date(to) } : {}
      );

    if (text) {
      q.$or = [
        { msg: { $regex: text, $options: "i" } },
        { err_message: { $regex: text, $options: "i" } },
      ];
    }

    /* pagination & projection */
    const pg = Math.max(1, parseInt(page, 10));
    const lim = Math.min(200, Math.max(1, parseInt(limit, 10)));

    const [rows, total] = await Promise.all([
      AppLog.find(q)
        .sort(sort.replace(",", " "))
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean(),
      AppLog.countDocuments(q),
    ]);

    return sendSuccess(res, {
      total,
      page: pg,
      pageSize: lim,
      rows,
    });
  } catch (err) {
    return sendError(res, err);
  }
};
