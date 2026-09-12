const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const JWT_SECRET = process.env.JWT_SECRET || 'baust-bloodlink-jwt-secret-key-dev-fallback';

/**
 * verifyToken — Extracts and verifies JWT from Authorization header
 * Header format: "Authorization: Bearer <token>"
 * Expiry: 8 hours
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. No authentication token provided.',
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, institutionalId, userType, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token.',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * requireAdmin — RBAC middleware on EVERY /api/admin/* route
 * "checks req.user.userType === 'Admin' server-side before touching the database
 * hiding admin buttons in the UI is cosmetic only and never the actual permission gate."
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.userType !== 'Admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Administrator privileges required.',
      code: 'ADMIN_REQUIRED',
      timestamp: new Date().toISOString(),
    });
  }
  next();
}

/**
 * requireVerifiedAccount — Server-side gate for all donor/request/message actions
 *
 * Enforced on every gated endpoint, not just hidden in the UI.
 * A Guest hitting a gated route gets 403 with code PROFILE_COMPLETION_REQUIRED.
 * The frontend catches this specific code and redirects to /complete-profile.
 *
 * Gated routes: POST /blood-requests, PATCH /blood-requests/:id/respond,
 *   POST /emergency/sos, all /messages/*, WhatsApp join action.
 * Guests CAN access: Feed (read+post+react), Helpline (read-only),
 *   Blood Hub (browse only), Emergency briefing (read-only).
 */
function requireVerifiedAccount(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
      timestamp: new Date().toISOString(),
    });
  }
  if (req.user.accountStatus === 'Guest') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires a verified campus account. Please complete your profile first.',
      code: 'PROFILE_COMPLETION_REQUIRED',
      timestamp: new Date().toISOString(),
    });
  }
  next();
}

/**
 * validateRequest — Express-validator error handling middleware
 * "All mutating endpoints validate input with express-validator and return structured 4xx errors"
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      error: 'Validation Error',
      message: formattedErrors[0]?.message || 'Input validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireVerifiedAccount,
  validateRequest,
  JWT_SECRET,
};
