const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication is required." });
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "cloudvault-api",
      audience: "cloudvault-client",
    });

    if (decoded.type !== "access" || !decoded.sub) {
      return res.status(401).json({ success: false, message: "Authentication is required." });
    }

    const user = await User.findById(decoded.sub).select("-password -__v");
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication is required." });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Authentication is required." });
  }
};

module.exports = protect;
