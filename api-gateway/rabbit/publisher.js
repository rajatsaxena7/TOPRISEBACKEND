const { getChannel } = require("./connection");

const publishToQueue = async (queue, message) => {
  const channel = getChannel();
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
};

module.exports = { publishToQueue };
