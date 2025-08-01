const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const userRoutes = require("./routes/user");
const logger = require("/packages/utils/logger");
const userController = require("./controllers/user");

// Load correct .env file based on NODE_ENV
const dotenvFlow = require("dotenv-flow");

dotenvFlow.config({
  path: path.resolve(__dirname, "../../../../"),
  node_env: "development",
});

const ENV = "development";
console.log(`✅ ENVIRONMENT: ${ENV}`);
console.log(`✅ Loaded from: .env.${ENV}`);
console.log(`✅ MONGO_URI: ${process.env.MONGO_URI}`);
const { startUserConsumer } = require("./rabbit/userConsumer");

logger.info(`Environment loaded: ${ENV}`);

// Firebase config from base64-encoded secret
const base64Key =
  "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAidG9wcmlzZS1jMjUxNSIsCiAgInByaXZhdGVfa2V5X2lkIjogIjI2NDU2Nzc5NmI2ODI0MGZmYzVlMTM5ZmNhOTA5ZGY2ZTkwYTQ1MWIiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzBZaittWDQ3L2FRVTZcbnZSRS9lQ3RReFJmTVdDZlFmcVlLVDVZY01XbmtQc052YUJBRGk5bFVrNDlJVVJVNUIyWnI1UjY5Z3h6T21JL3VcbldIS0VYd3NqTFdWQVU4SlJtMzJ0OTQwYlpmcnNjSnplV2w0dkE0c3VDNGg2LzBRY3BhUjJMb0VKd1lKTDlKUTBcbkJaTlFraGF0dkFkRjRUT1oyVThxalJwaElzVy9GRDlMYnVKbXdlaXpKSlRJN21WeThoTW9yWEV3UVBjU2ZyaE9cbnNKVFhIcmhkR3FpdVhYSExzNXdoNVQ2SnZxMlNwOWxiR0lYeHpwdnc5Q1VVcU5PeWJrTmVvOHNueFZ1d0MyYnNcblRvV1ZCZXc3enpCR3A4VVkwaDduRGtPMlFYVWhQYnEvZFNOTS9hNU5Kank5dE55QU1BS3lBWmQ4dUdrZEI5VmhcbjNxUFpFT1ZmQWdNQkFBRUNnZ0VBRVFVWUs3TG1nNGpvT21qdWdMRHVVcStyYXRlQ2pOOUxwcnRvVnRQK3dYb3BcblBKRElEMTJacmF1WDliaURmOG15b0o3bmJmV1BZL0JCM0dPeURTQUpUL3k2TktpZE5DVmFFQmtaMGxUNy9tVXpcbkYvUFU0U3RuYlhwMGIrUGl0d1ZBdXZudy9reitPMUVpSkFweFRPL2hLSmE0NVBTMmNWOXZZeWR2THNKMktzSXVcbkI4NFBuUW13aU9YQXZZRVJldHBtY0Q1OTZVR1RQbStuUXZLTFZlWUFwOFdZa0oyZmpSNmR3ZHZ3L2RSY1Z3eVlcbkFOS3BqWXJWWHRQNzM5QWlFbVlTTFdzRlNPV01sTGNJa2pHeTh0aXViZVFGZjZEMTRvV1FabEthL3F3bWNGNTJcbnl1cGJZZkU3a05CUFJ6d0tpVDIweSs1R0FXbFBocy9qSVNKemhHZFprUUtCZ1FEak96bjI4L09EUlRPbzBiVEZcblRtYVpIa0ZFL1BLZHk2T0J4M3NjR2xMMDJhTUFnNGNNUHB4d1NDVHJSb3VyQmwrYURhSkZ1c2FzZFJkb0NaQ2dcbnFWRFpPNWVMRmxXOW5nc3h4cXpTWlJRZzJjb0J1OHdQQWhrWlZCcU5zNFVsYnNRUDFaY2cvcEdnaWZweWhadTdcbnVrVXhqcXFLSDVZR2pYV2N4SFdlSmpjUlZ3S0JnUURMT0tadTdjY0g4R3VJdkF1elUrV2EyNGlpblBOeFRULzJcbnlpVmJCYUdPQ08yNlViQ2Vwc3JucVBDb2h2RVJTSEgyUGphVHF1dGpKMmdaNGdveWhFeTg0MGpiZ3k1SWc3TVJcbmx0eVFZQnQ0NUVJQ1RRc3o1VFJNY00rams1SitTcGdzR3ZYd2R2Qyt6OVNqOFkzZXR6SlcrRDJKL1M5ZmlKbFVcbm1aZGMwcCtmT1FLQmdEeGcwbWdpTGtSbE1QTGN0aEh2WVNleWVGbGlkUDBrelErQTk5OWh4MFUwUnpHdHdVYXBcbnBGdlpiNlhzbXRRWTMzSkp5U0tLSEp4YWlKdW1YdjJ4djcvWks4MVRZL2o4YzdFSVA0ZXdRQWJ5bDlDYUhBQ29cbjZBNW80SjFpWkRDc0hBQ3hHblV6NzNJZTk2TlNpU3o2czhRVlNvOWxFVEl3aUYzZGZmdEY0RUFGQW9HQkFNTVVcbkUzaEMycDg5WkF5eTdzeHJTZW80dVZYWU1qemVPZnV1bXVOZ2FYQU9GQjZhRW1DSm5oZDViZU5vL2Zwb1A3VndcbmpUVjlpazM1WXc0TmxWcGU4OGNTcXpyRkYyWFd2c3V3dFBRR3ZmaHpyUVhHYlcyWXBYYUhpRnJ1NjE0K1B3dC9cbnFmejJRQzM3RlpWMjZJZ1Y5Y1hVc0VaSSsvUEtEZDVQUGlTRnIyTEpBb0dCQUtBemZCL3MxVGFhbHIwZW94V3Fcbnh3SE51d0dxbUErMjFxQjdIVVg3R0I4OExBK3BscmRleGRjQi9FZU1tYXB2ckI1U0FrQWVFVUVaUHh5VGVWRzhcbm1NdXNEYmswK05MdjVrT2ZnUlFOS1YyajZtNVR2RDN1NGlsN1RBK2cvRzdjQ0ppODBuQjZLeHdjaVFwOUR5eElcbjFVVU5PR0h3YWpNL3EvSGtodm9IR1lJS1xuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImZpcmViYXNlLWFkbWluc2RrLWZic3ZjQHRvcHJpc2UtYzI1MTUuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTA1MzYzMjkyNjM3NTk2NDkwODE2IiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9maXJlYmFzZS1hZG1pbnNkay1mYnN2YyU0MHRvcHJpc2UtYzI1MTUuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K";
if (!base64Key) {
  logger.error("Missing FIREBASE_CONFIG_BASE64 env variable");
  process.exit(1);
}

let serviceAccount;
try {
  const decoded = Buffer.from(base64Key, "base64").toString("utf-8");
  serviceAccount = JSON.parse(decoded);
} catch (err) {
  logger.error("Failed to decode Firebase base64 config:", err.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// MongoDB Connection+
mongoose
  .connect(
    "mongodb+srv://techdev:pQFNwJKPEgILKyN9@development.7rukyou.mongodb.net/?retryWrites=true&w=majority&appName=Development",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => {
    logger.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Express App Setup
const app = express();
const PORT = process.env.PORT || 5001;
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());
app.use(morgan("dev"));

startUserConsumer();

// In your user service (index.js):

// Change this:
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "User service is very much healthy baba healthy" });
});
const appSettingRoutes = require("./routes/appSetting");

app.use("/api/users", userRoutes); // ✅ All routes now live under /api/users
app.use("/api/appSetting", appSettingRoutes);
app.use("/api/contact", require("./routes/contactRoutes"));
// Routes

// Health Check

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.message);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`User Service is running on port ${PORT}`);
});
