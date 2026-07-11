const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

connectDB();

const app = express();

/*
=========================================
            MIDDLEWARE
=========================================
*/

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
=========================================
             ROUTES
=========================================
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "CloudVault",
    version: "1.0.0",
    message: "Backend is running successfully."
  });
});

app.use("/api/auth", authRoutes);

/*
=========================================
            404 ROUTE
=========================================
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  });
});

/*
=========================================
            START SERVER
=========================================
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=========================================");
  console.log(`🚀 CloudVault Server Running`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("=========================================");
});