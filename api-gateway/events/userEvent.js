const { publishToQueue } = require("../rabbit/publisher");

const sendUserCreatedEvent = async (userData) => {
  await publishToQueue("user_created", {
    type: "USER_CREATED",
    data: userData,
  });
};

module.exports = { sendUserCreatedEvent };
