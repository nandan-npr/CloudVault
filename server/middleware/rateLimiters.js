const rateLimit = require("express-rate-limit");
const logger = require("../config/logger");

const createAuthLimiter = (windowMs, limit, event) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
    handler: (req, res, next, options) => {
      logger.warn({ ip: req.ip, path: req.originalUrl, event }, "Rate limit triggered");
      res.status(options.statusCode).send(options.message);
    },
  });

const loginLimiter = createAuthLimiter(15 * 60 * 1000, 10, "login_rate_limit");
const registerLimiter = createAuthLimiter(60 * 60 * 1000, 5, "register_rate_limit");
const passwordResetLimiter = createAuthLimiter(60 * 60 * 1000, 5, "password_reset_rate_limit");
const uploadLimiter = createAuthLimiter(15 * 60 * 1000, 60, "upload_rate_limit");
const aiLimiter = createAuthLimiter(15 * 60 * 1000, 30, "ai_rate_limit");

module.exports = { loginLimiter, registerLimiter, passwordResetLimiter, uploadLimiter, aiLimiter };
