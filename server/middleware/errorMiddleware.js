const { ZodError } = require("zod");
const env = require("../config/env");
const logger = require("../config/logger");

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error.";
  let details = error.details;

  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Invalid request data.";
    details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier.";
  } else if (error.name === "MulterError") {
    statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? `File is too large. Maximum size is ${env.MAX_FILE_SIZE_MB} MB.`
        : "Invalid upload request.";
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "An account with that email already exists.";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Invalid request data.";
    details = Object.values(error.errors).map((item) => item.message);
  } else if (statusCode >= 500 && statusCode !== 503) {
    // 503 keeps its message so "AI is not configured" reaches the user clearly
    message = "Internal server error.";
    details = undefined;
  }

  logger.error(
    {
      err: error,
      method: req.method,
      path: req.originalUrl,
      statusCode,
    },
    "Request failed"
  );

  const payload = { success: false, message };
  if (details) payload.details = details;
  if (process.env.NODE_ENV === "development" && statusCode >= 500) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };

