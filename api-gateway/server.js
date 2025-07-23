const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const { connectRabbitMQ } = require("./rabbit/connection");
const { sendUserCreatedEvent } = require("./events/userEvent");

const app = express();
const PORT = process.env.PORT || 3000;

// Example: Emit RabbitMQ event on user creation

app.get("/health", (req, res) => {
  res.status(200).json({ status: "User service is very healthy" });
});

// Proxy HTTP to user service
app.use(
  "/api/users",
  createProxyMiddleware({
    target: "http://user-service:5001",
    changeOrigin: true,
  })
);

app.use(
  "/api/category",
  createProxyMiddleware({
    target: "http://product-service:5001", // ✅ correctly routes to product-service
    changeOrigin: true,
  })
);
app.use(
  "/api/subCategory",
  createProxyMiddleware({
    target: "http://product-service:5001", // ✅ correctly routes to product-service
    changeOrigin: true,
  })
);

app.use(
  "/products",
  createProxyMiddleware({
    target: "http://product-service:5001", // ✅ correctly routes to product-service
    changeOrigin: true,
  })
);

app.use(
  "/api/orders",
  createProxyMiddleware({
    target: "http://order-service:5001",
    changeOrigin: true,
  }),
  app.use(
    "/api/notification",
    createProxyMiddleware({
      target: "http://notification-service:5001",
      changeOrigin: true,
    })
  )
);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.post("/event/users", async (req, res) => {
  try {
    await sendUserCreatedEvent(req.body);
    res.status(200).json({ message: "User event sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send user event" });
  }
});

// Start app after RabbitMQ connects
connectRabbitMQ().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
  });
});
