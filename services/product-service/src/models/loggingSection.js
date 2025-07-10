/* models/appLog.js ------------------------------------------------ */
const mongoose = require("mongoose");
const { Schema } = mongoose;

/* Valid log levels – align these with Winston / Pino / Bunyan etc. */
const levels = ["fatal", "error", "warn", "info", "debug", "trace"];

/*
 ────────────────────────────────────────────────────────────────────
  AppLog schema
    ▸ Stores *every* structured field you might need later.
    ▸ Heavily indexed for fast search / roll-ups.
    ▸ No required fields except level & msg – keeps the writer tiny.
 ────────────────────────────────────────────────────────────────────
*/

const AppLogSchema = new Schema(
  {
    level: {
      type: String,
      enum: levels,
      required: true,
      index: true,
    },
    msg: {
      type: String,
      required: true,
    },

    user_id: { type: String, index: true }, // decoded JWT user
    service: { type: String, default: "api-gateway" }, // micro-service name
    hostname: { type: String }, // container host
    request_id: { type: String, index: true }, // e.g. uuid/v4
    route: { type: String }, // Express route
    method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
    url: { type: String },

    /* TIMING ------------------------------------------------------- */
    ts: { type: Date, default: Date.now, index: true },
    response_ms: { type: Number }, // latency

    /* PAYLOAD / META --------------------------------------------- */
    status_code: { type: Number }, // HTTP status
    ip: { type: String },
    user_agent: { type: String },
    query: { type: Schema.Types.Mixed }, // ?a=1&b=2
    params: { type: Schema.Types.Mixed }, // /:id
    body: { type: Schema.Types.Mixed }, // req.body (sanitised!)
    headers: { type: Schema.Types.Mixed },

    /* ERROR DETAILS ---------------------------------------------- */
    err_name: { type: String },
    err_message: { type: String },
    stack: { type: String },

    /* CUSTOM APP META -------------------------------------------- */
    meta: { type: Schema.Types.Mixed }, // anything else (ES indexable)

    /* ORIGIN FLAGS ------------------------------------------------ */
    is_internal: { type: Boolean, default: false }, // system vs public
    env: { type: String, default: process.env.NODE_ENV || "development" },
  },
  {
    collection: "app_logs",
    versionKey: false,
  }
);

/* Helpful compound indexes */
AppLogSchema.index({ level: 1, ts: -1 });
AppLogSchema.index({ service: 1, ts: -1 });
AppLogSchema.index({ route: 1, method: 1, ts: -1 });

module.exports = mongoose.model("AppLog", AppLogSchema);
