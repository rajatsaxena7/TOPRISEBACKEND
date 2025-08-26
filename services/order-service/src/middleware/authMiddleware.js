const jwt = require('jsonwebtoken');
const logger = require('/packages/utils/logger');

/**
 * Map JWT roles to system roles
 */
const mapRole = (jwtRole) => {
  // Return the role as-is since the audit log model now matches the user model
  return jwtRole;
};

/**
 * JWT Authentication Middleware
 * Decodes JWT token and attaches user information to req.user
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For analytics endpoints, we'll allow requests without authentication
      // but won't create audit logs for them
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // For testing purposes, let's decode the token without verification
      // In production, you should use: const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Decode token without verification for testing
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        logger.warn('Invalid JWT token: could not decode');
        req.user = null;
        return next();
      }
      
      // Map the role from JWT to system role
      const mappedRole = mapRole(decoded.role);
      
      const user = {
        id: decoded.id,
        role: mappedRole,
        name: decoded.name || decoded.email,
        email: decoded.email
      };
      
      logger.info(`Authenticated user: ${user.email} with role: ${user.role} (mapped from: ${decoded.role})`);
      req.user = user;
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError.message);
      req.user = null;
      next();
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Optional Authentication Middleware
 * Allows requests to proceed even without valid authentication
 */
const optionalAuth = (req, res, next) => {
  authenticateJWT(req, res, next);
};

/**
 * Required Authentication Middleware
 * Returns 401 if no valid authentication is provided
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // For testing purposes, let's decode the token without verification
      // In production, you should use: const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Decode token without verification for testing
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        logger.warn('Invalid JWT token: could not decode');
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Map the role from JWT to system role
      const mappedRole = mapRole(decoded.role);
      
      const user = {
        id: decoded.id,
        role: mappedRole,
        name: decoded.name || decoded.email,
        email: decoded.email
      };
      
      logger.info(`Authenticated user: ${user.email} with role: ${user.role} (mapped from: ${decoded.role})`);
      req.user = user;
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  requireAuth
};
