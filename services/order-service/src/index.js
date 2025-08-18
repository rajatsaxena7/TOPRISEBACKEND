const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const logger = require("/packages/utils/logger");

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

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://techdev:H1E0bf2fvvPiKZ36@toprise-staging.nshaxai.mongodb.net/?retryWrites=true&w=majority&appName=Toprise-Staging",
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
const WHITELIST = [
  "http://localhost:3000", // React / Next dev server
  "http://193.203.161.146:3000", // your prod IP (if you serve UI there)
];
app.use(
  cors({
    origin: (origin, cb) => {
      // allow REST tools like Postman (no origin) and any whitelisted origin
      if (!origin || WHITELIST.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true, // ← crucial!
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

app.use(express.json());
app.use(morgan("dev"));
startUserConsumer();
require("./jobs/ticketAssignment");
require("./jobs/dealerAssignmentWorker");

// Initialize SLA Violation Scheduler
const slaViolationScheduler = require("./jobs/slaViolationScheduler");
try {
  slaViolationScheduler.start();
  logger.info("SLA violation scheduler started successfully");
} catch (error) {
  logger.error("Failed to start SLA violation scheduler:", error);
}

const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const ticketRoutes = require("./routes/tickets");
const wishlistRoutes = require("./routes/wishList");
const paymentRoutes = require("./routes/payment");
const returnRoutes = require("./routes/return");

app.use("/api/carts", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orders/kpi", require("./routes/orderKpiFIle"));
app.use("/api/tickets", ticketRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/returns", returnRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Order service is very healthy" });
});

// Queue health check endpoint
app.get("/health/queue", async (req, res) => {
  try {
    const dealerAssignmentQueue = require("./queues/assignmentQueue");

    const [waiting, active, completed, failed] = await Promise.all([
      dealerAssignmentQueue.getWaiting(),
      dealerAssignmentQueue.getActive(),
      dealerAssignmentQueue.getCompleted(),
      dealerAssignmentQueue.getFailed(),
    ]);

    res.status(200).json({
      status: "Queue health check",
      queue: "dealer-assignment",
      stats: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "Queue health check failed",
      error: error.message,
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.message);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Order Service is running on port ${PORT}`);
});
