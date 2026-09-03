const pino = require("pino");
const env = require("./env");

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "confirmPassword",
      "currentPassword",
      "token",
      "accessToken",
      "refreshToken",
      "MONGODB_URI",
      "JWT_ACCESS_SECRET",
      "SMTP_PASS",
    ],
    censor: "[REDACTED]",
  },
  base: undefined,
});

module.exports = logger;
