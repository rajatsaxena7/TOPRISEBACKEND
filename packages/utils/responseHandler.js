const sendSuccess = (res, data, message = "Success") => {
  res.status(200).json({ success: true, message, data });
};

const sendError = (res, error, status = 500) => {
  res.status(status).json({ success: false, message: error.message || error });
};

module.exports = { sendSuccess, sendError };
