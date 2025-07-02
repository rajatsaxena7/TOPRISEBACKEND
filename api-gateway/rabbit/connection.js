// api-gateway/rabbit/connection.js
const amqp = require("amqplib");
const RETRY = 5;

let channel = null;

const connectRabbitMQ = async () => {
  let retries = RETRY;
  while (retries) {
    try {
      const conn = await amqp.connect("amqp://rabbitmq:5672");
      channel = await conn.createChannel();
      console.log("✅ Connected to RabbitMQ");
      return;
    } catch (err) {
      console.error("❌ RabbitMQ connection error:", err.message);
      retries -= 1;
      console.log(`⏳ retrying in 5 s… (${RETRY - retries}/${RETRY})`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  process.exit(1); // could not connect after N tries
};

const getChannel = () => channel;
module.exports = { connectRabbitMQ, getChannel };
