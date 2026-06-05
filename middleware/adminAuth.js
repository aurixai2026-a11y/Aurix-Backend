const { getSessionUser } = require("../services/adminAuthService");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function requireAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    const admin = token ? await getSessionUser(token) : null;

    if (!admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.admin = admin;
    req.adminToken = token;

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = {
  requireAdmin
};

