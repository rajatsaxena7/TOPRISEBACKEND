const jwt = require("jsonwebtoken");
const logger = require("/packages/utils/logger");

/**
 * Map JWT role to system role format
 */
const mapRole = (jwtRole) => {
  const roleMap = {
    "Super-admin": "Super Admin",
    "Fulfilment-admin": "Fulfilment Admin", 
    "Inventory-admin": "Inventory Admin",
    "Dealer": "Dealer",
    "Customer": "Customer",
    "System": "System"
  };
  
  return roleMap[jwtRole] || jwtRole;
};

/**
 * Authenticate JWT token and attach user info to req.user
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    // Map the role from JWT to system format
    const mappedRole = mapRole(decoded.role);
    
    req.user = {
      id: decoded.id || decoded._id,
      _id: decoded.id || decoded._id,
      name: decoded.name,
      email: decoded.email,
      role: mappedRole,
      ...decoded
    };
    
    next();
  } catch (error) {
    logger.error("JWT authentication error:", error);
    // Don't fail the request, just continue without user info
    req.user = null;
    next();
  }
};

/**
 * Optional authentication - doesn't require token but attaches user info if present
 */
const optionalAuth = authenticateJWT;

/**
 * Required authentication - requires valid token
 */
const requireAuth = (req, res, next) => {
  authenticateJWT(req, res, (err) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication failed" 
      });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }
    
    next();
  });
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  requireAuth,
  mapRole
};
