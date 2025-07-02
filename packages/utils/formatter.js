const formatEmail = (email) => {
  return email.trim().toLowerCase();
};

const formatText = (text) => {
  return text.trim().replace(/\s+/g, ' ');
};

module.exports = { formatEmail, formatText };
