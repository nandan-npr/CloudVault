const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    console.log("====================================");
    console.log("MongoDB Connected");
    console.log("Database:", connection.connection.name);
    console.log("Host:", connection.connection.host);
    console.log("====================================");
  } catch (error) {
    console.log("MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;