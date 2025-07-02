const isEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isPhoneNumber = (phone) => {
  return /^\d{10}$/.test(phone);
};

const isNonEmptyString = (str) => {
  return typeof str === "string" && str.trim().length > 0;
};

module.exports = { isEmail, isPhoneNumber, isNonEmptyString };
