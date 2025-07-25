// workers/dealerAssignmentWorker.js
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const dealerAssignmentQueue = require("../queues/assignmentQueue");
const Order = require("../models/order");

// Build a reusable axios instance with a baseURL
const productApi = axios.create({
  baseURL: process.env.PRODUCT_SERVICE_URL,
  timeout: 5000,
});

mongoose
  .connect(process.env.MONGODB_URI /* or your hard-coded URI */, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Worker connected to MongoDB"))
  .catch((err) => {
    console.error("Worker MongoDB connection error:", err);
    process.exit(1);
  });

dealerAssignmentQueue.process(async (job) => {
  const { orderId } = job.data;
  console.log(`🔄 Processing dealer assignment for Order ${orderId}`);

  const order = await Order.findById(orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);

  order.dealerMapping = [];
  order.skus.forEach((line) => (line.dealerMapped = []));

  for (const line of order.skus) {
    const { sku, quantity: qtyNeeded, productId } = line;

    // 1) Fetch dealers list
    const resp = await axios.get(
      `http://product-service:5001/products/v1/products/${productId}/availableDealers`
    );
    const dealers = resp.data.data || resp.data; // depending on your API shape

    // 2) Sort & pick
    const candidates = dealers
      .filter((d) => d.quantityAvailable >= qtyNeeded)
      .sort((a, b) =>
        b.priorityOverride !== a.priorityOverride
          ? b.priorityOverride - a.priorityOverride
          : b.quantityAvailable - a.quantityAvailable
      );
    if (!candidates.length) {
      console.warn(`No dealer can fulfill SKU ${sku}`);
      continue;
    }
    const chosen = candidates[0];

    // 3) Record assignment
    order.dealerMapping.push({ sku, dealerId: chosen.dealerId });
    line.dealerMapped.push({ dealerId: chosen.dealerId });

    // 4) Decrement stock
    await axios.patch(
      `http://product-service:5001/products/v1/products/${productId}/availableDealers/${chosen.dealerId}`,
      { decrementBy: qtyNeeded }
    );
  }

  await order.save();
  console.log(`✅ Dealer assignment complete for Order ${orderId}`);
});

dealerAssignmentQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});
