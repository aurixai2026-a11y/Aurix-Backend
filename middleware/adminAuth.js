const { getSessionUser } = require("../services/adminAuthService");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function requireAdmin(req, res, next) {
  const token = getBearerToken(req);
  const admin = token ? getSessionUser(token) : null;

  if (!admin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.admin = admin;
  req.adminToken = token;

  return next();
}

module.exports = {
  requireAdmin
};
