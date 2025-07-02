const amqp = require("amqplib");
const logger = require("../../../packages/utils/logger");

let channel;

const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect("amqp://rabbitmq");
    channel = await connection.createChannel();
    logger.info("✅ Connected to RabbitMQ from user-service");
    return channel;
  } catch (error) {
    logger.error(`❌ RabbitMQ connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectToRabbitMQ;
