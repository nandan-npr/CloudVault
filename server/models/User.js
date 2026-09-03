const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 12,
      select: false,
    },
    loginAttempts: { type: Number, default: 0, min: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    avatar: { type: String, default: "" },
    storageUsed: { type: Number, default: 0, min: 0 },
    storageLimit: { type: Number, default: 2147483648, min: 0 },
    totalFiles: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
