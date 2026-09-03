const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

const connectDB = async () => {
  const connection = await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });

  logger.info(
    { database: connection.connection.name, host: connection.connection.host },
    "MongoDB connected"
  );
};

module.exports = connectDB;