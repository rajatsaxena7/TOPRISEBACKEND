const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const cookieParser = require("cookie-parser"); // Added for cookie handling
const userRoutes = require("./routes/user");
const logger = require("/packages/utils/logger");
const userController = require("./controllers/user");

// Load environment variables
const dotenvFlow = require("dotenv-flow");
dotenvFlow.config({
  path: path.resolve(__dirname, "../../../../"),
  node_env: "development",
});

const ENV = "development";
logger.info(`✅ Environment: ${ENV}`);
logger.info(`✅ Loaded from: .env.${ENV}`);

// Firebase initialization
const base64Key = process.env.FIREBASE_CONFIG_BASE64;
if (!base64Key) {
  logger.error("Missing FIREBASE_CONFIG_BASE64 env variable");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(
    Buffer.from(base64Key, "base64").toString("utf-8")
  );
} catch (err) {
  logger.error("Failed to decode Firebase config:", err);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb+srv://techdev:pQFNwJKPEgILKyN9@development.7rukyou.mongodb.net/?retryWrites=true&w=majority&appName=Development",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Express App Setup
const app = express();
const PORT = process.env.PORT || 5001;

// Enhanced CORS configuration for credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

// Handle preflight requests
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies
app.use(morgan("dev"));

// Start RabbitMQ consumer
const { startUserConsumer } = require("./rabbit/userConsumer");
startUserConsumer();

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "User service healthy" });
});

app.use("/api/users", userRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`User Service running on port ${PORT}`);
});
