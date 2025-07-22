// services/user-service/src/rabbit/userConsumer.js
const connectToRabbitMQ = require("./connection");
const logger = require("../../../../packages/utils/logger");

const startUserConsumer = async () => {
  const ch = await connectToRabbitMQ();
  await ch.assertQueue("user_events", { durable: true });
  ch.consume("user_events", (msg) => {
    const payload = JSON.parse(msg.content.toString());
    logger.info("📥  user_events:", payload);
    ch.ack(msg);
  });
};

module.exports = { startUserConsumer };
