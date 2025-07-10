const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const categoryRoutes = require("./route/categoryRoutes");
const subCategoryRoutes = require("./route/subCategoryroutes");
const brandsRoutes = require("./route/brand");
const logger = require("/packages/utils/logger");
const typeRoutes = require("./route/type");
const modelRoutes = require("./route/modelRoutes");
const yearRoutes = require("./route/year");
const productRoutes = require("./route/product");
const variantRoutes = require("./route/variant");
const logMiddleware = require("./controller/logging");

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

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://techdev:dLLlFqu0Wx103dzp@toprisedev.xoptvj9.mongodb.net/?retryWrites=true&w=majority&appName=toprisedev",
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
app.use(cors());

app.use(express.json());
app.use(morgan("dev"));

startUserConsumer();

// In your user service (index.js):

// Change this:
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "Product service is very much healthy baba healthy" });
});

app.use("/api/category", categoryRoutes);
app.use("/api/subCategory", subCategoryRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/types", typeRoutes);
app.use("/api/model", modelRoutes);
app.use("/variants", variantRoutes);
app.use("/api/year", yearRoutes);
app.use("/products/v1", productRoutes);

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
  logger.info(`Product Service is running on port ${PORT}`);
});
