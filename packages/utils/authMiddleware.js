const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

// Middleware to verify JWT or Firebase token and enforce role
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });
  const token = authHeader.split(" ")[1];
  try {
    let decoded;
    // Try Firebase token verification first
    try {
      // A;
      console.log("token", token);
      decoded = await admin.auth().verifyIdToken(token);
      req.user = { id: decoded.uid, role: "User (Firebase)" };
    } catch (err) {
      // Fallback to internal JWT verification
      decoded = jwt.verify(
        token,
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IjE3NzMxNzdlODhlZTFiZTMyNWZiMzkyZDZkMDU3MGVkIn0.e30.Om3KOQDXsSvrY8I7BBABYugTo25IadUd7wF1LIgjv8VlDyNYsaXI_t4rPYcZgiMd8JxfS2y2hlQRc86S3Y_vEA"
      );
      req.user = { id: decoded.id, role: decoded.role };
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log("req.user.role", req.user.role);
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied: role not allowed" });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };
