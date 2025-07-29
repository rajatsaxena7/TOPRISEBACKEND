const express = require("express");
const router = express.Router();
const OrderKPI = require("../controllers/orderKpi");
const mongoose = require("mongoose");
const redis = require("redis"); // Only if you're using Redis
const CircuitBreaker = require("opossum"); // Only if you want circuit breaking

// Basic dealer ID validation middleware

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error(`Route error: ${error.message}`, {
      route: req.originalUrl,
      stack: error.stack,
    });

    // Ensure response object is valid before sending error
    if (res && typeof res.status === "function") {
      res.status(500).json({
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } else {
      console.error("Critical: Invalid response object", error);
    }
  });
};

// Simple cache implementation (remove if not using Redis)
const cacheMiddleware = (ttl) => {
  if (!redis || !redis.createClient) {
    // If Redis isn't configured, return a pass-through middleware
    return (req, res, next) => next();
  }

  const redisClient = redis.createClient();
  return async (req, res, next) => {
    const key = `kpi:${req.originalUrl}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        redisClient.set(key, JSON.stringify(body), "EX", ttl);
        originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Cache error:", error);
      next();
    }
  };
};

// Basic circuit breaker (remove if not needed)
const serviceCircuitBreaker = (serviceName) => {
  // If not using circuit breaker, return pass-through middleware
  if (!CircuitBreaker) {
    return (req, res, next) => next();
  }

  const breaker = new CircuitBreaker(async () => true, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  });

  return (req, res, next) => {
    breaker
      .fire()
      .then(() => next())
      .catch(() => {
        res.status(503).json({
          error: "Service temporarily unavailable",
          action: "Try again later",
        });
      });
  };
};

// KPI Routes
router.get(
  "/dealers/:dealerId/performance",
  // cacheMiddleware(300), // Enable if using Redis
  OrderKPI.getDealerPerformance
);

// Extended KPI Routes
router.get("/dealers/:dealerId/performance/sla", (req, res) => {
  OrderKPI.getSLACompliance(req, res).catch((error) => {
    console.error("SLA Compliance Error:", error);
    res.status(500).json({ error: "Failed to get SLA metrics" });
  });
});

router.get("/dealers/:dealerId/performance/fulfillment", (req, res) => {
  OrderKPI.getFulfillmentMetrics(req, res).catch((error) => {
    console.error("Fulfillment Metrics Error:", error);
    res.status(500).json({ error: "Failed to get fulfillment metrics" });
  });
});

// Bulk KPI Endpoints
router.post("/dealers/performance/bulk", async (req, res) => {
  try {
    const { dealerIds, startDate, endDate } = req.body;

    if (!dealerIds || !Array.isArray(dealerIds)) {
      return res.status(400).json({ error: "Invalid dealer IDs provided" });
    }

    const results = await Promise.all(
      dealerIds.map(async (dealerId) => {
        try {
          // Create mock request/response objects
          const mockReq = {
            params: { dealerId },
            query: { startDate, endDate },
          };
          let responseData;
          const mockRes = {
            json: (data) => {
              responseData = data;
            },
          };

          await OrderKPI.getDealerPerformance(mockReq, mockRes);
          return { dealerId, ...responseData };
        } catch (error) {
          return { dealerId, error: error.message };
        }
      })
    );

    res.json(results);
  } catch (error) {
    console.error("Bulk KPI Error:", error);
    res.status(500).json({ error: "Failed to process bulk request" });
  }
});

// Historical Data Export
router.get(
  "/dealers/:dealerId/performance/export",
  asyncHandler(async (req, res) => {
    const { dealerId } = req.params;
    const { format = "json", startDate, endDate } = req.query;

    // Validate dealerId format
    if (
      !dealerId ||
      typeof dealerId !== "string" ||
      !mongoose.Types.ObjectId.isValid(dealerId)
    ) {
      return res.status(400).json({ error: "Invalid dealer ID format" });
    }

    // Get the data
    const mockReq = {
      params: { dealerId },
      query: { startDate, endDate },
    };

    let responseData;
    const mockRes = {
      json: (data) => (responseData = data),
      status: () => mockRes,
      send: () => {},
    };

    await OrderKPI.getDealerPerformance(mockReq, mockRes);

    // Handle different export formats
    switch (format.toLowerCase()) {
      case "csv":
        const { json2csv } = require("json-2-csv");
        const csv = await json2csv([responseData], {
          expandArrayObjects: true,
          unwindArrays: true,
        });

        res.header("Content-Type", "text/csv");
        res.attachment(`dealer-performance-${dealerId}.csv`);
        return res.send(csv);

      case "json":
      default:
        res.json(responseData);
    }
  })
);

// Health Check Endpoint
router.get("/kpi-health", (req, res) => {
  res.json({
    status: "operational",
    timestamp: new Date(),
    notes:
      "Basic health check - for full monitoring implement proper health checks",
  });
});

module.exports = router;
