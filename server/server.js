const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

dotenv.config();
const env = require("./config/env");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const logger = require("./config/logger");
const AppError = require("./utils/AppError");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const allowedOrigins = new Set([env.CLIENT_URL, env.FRONTEND_URL, ...env.corsOrigins]);

if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
  })
);
app.use(compression());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info({ event: "http_request", message: message.trim() }),
    },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new AppError("Origin is not allowed by CORS policy.", 403));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86_400,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "CloudVault",
    version: "1.0.0",
    message: "Backend is running successfully.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use(notFound);
app.use(errorHandler);

const shutdown = async (signal, server) => {
  logger.info({ signal }, "Shutdown signal received");
  server.close(async () => {
    try {
      const mongoose = require("mongoose");
      await mongoose.disconnect();
      logger.info("HTTP server and database connection closed");
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Graceful shutdown failed");
      process.exit(1);
    }
  });
};

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, environment: env.NODE_ENV }, "CloudVault server started");
    });

    process.once("SIGTERM", () => shutdown("SIGTERM", server));
    process.once("SIGINT", () => shutdown("SIGINT", server));
    return server;
  } catch (error) {
    logger.fatal({ err: error }, "Server startup failed");
    process.exit(1);
  }
};

if (require.main === module) startServer();

module.exports = { app, startServer };
