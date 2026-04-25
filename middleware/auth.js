const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const revokedTokens = new Map();

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

function cleanupRevokedTokens() {
  const nowSeconds = Math.floor(Date.now() / 1000);

  for (const [token, exp] of revokedTokens.entries()) {
    if (exp <= nowSeconds) {
      revokedTokens.delete(token);
    }
  }
}

function getTokenFromRequest(req) {
  const headerValue = req.headers.authorization;

  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function revokeToken(token, exp) {
  if (!token || !exp) {
    return;
  }

  cleanupRevokedTokens();
  revokedTokens.set(token, exp);
}

function isTokenRevoked(token) {
  cleanupRevokedTokens();
  return revokedTokens.has(token);
}

function generateAuthToken(user) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
    tokenVersion: crypto.randomUUID(),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authenticateToken(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  if (isTokenRevoked(token)) {
    return res.status(401).json({ error: "Token has been revoked" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.auth = decoded;
    req.token = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

module.exports = {
  JWT_EXPIRES_IN,
  generateAuthToken,
  authenticateToken,
  requireRole,
  getTokenFromRequest,
  revokeToken,
};