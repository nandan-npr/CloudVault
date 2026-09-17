const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const env = require("../config/env");
const logger = require("../config/logger");
const AppError = require("../utils/AppError");
const { sendPasswordResetEmail } = require("../services/emailService");
const {
  REFRESH_COOKIE,
  createAccessToken,
  hashToken,
  issueRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../services/tokenService");

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_DURATION_MS = 15 * 60 * 1000;

const serializeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  avatar: user.avatar,
  storageUsed: user.storageUsed,
  storageLimit: user.storageLimit,
  totalFiles: user.totalFiles,
  createdAt: user.createdAt,
  isVerified: user.isVerified,
  // Extended profile fields
  dateOfBirth: user.dateOfBirth || null,
  phone: user.phone || "",
  gender: user.gender || "",
  location: user.location || "",
  bio: user.bio || "",
  theme: user.theme || "system",
});

const authenticateResponse = async (user, req, res) => {
  const refreshToken = await issueRefreshToken(user._id, req);
  setRefreshCookie(res, refreshToken);
  return {
    accessToken: createAccessToken(user._id),
    user: serializeUser(user),
  };
};

const invalidCredentials = (res) =>
  res.status(401).json({
    success: false,
    message: "Invalid email or password.",
  });

const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(fullName || "CloudVault User").trim();
    const existingUser = await User.exists({ email: normalizedEmail });

    if (existingUser) {
      throw new AppError("An account with that email already exists.", 409);
    }

    const user = await User.create({
      fullName: normalizedName,
      email: normalizedEmail,
      password: await bcrypt.hash(password, SALT_ROUNDS),
    });

    const session = await authenticateResponse(user, req, res);
    logger.info({ event: "registration_success", userId: user._id }, "User registered");
    res.status(201).json({ success: true, message: "Registration successful.", ...session });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil");

    if (!user) return invalidCredentials(res);

    if (user.lockUntil && user.lockUntil > new Date()) {
      logger.warn({ event: "login_locked", userId: user._id }, "Locked account login attempted");
      return invalidCredentials(res);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      const nextAttempt = user.loginAttempts + 1;
      user.loginAttempts = nextAttempt;
      if (nextAttempt >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.loginAttempts = 0;
        logger.warn({ event: "account_locked", userId: user._id }, "Account temporarily locked");
      }
      await user.save({ validateBeforeSave: false });
      logger.warn({ event: "login_failure", userId: user._id }, "Invalid login attempt");
      return invalidCredentials(res);
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save({ validateBeforeSave: false });
    const session = await authenticateResponse(user, req, res);
    logger.info({ event: "login_success", userId: user._id }, "User authenticated");
    res.status(200).json({ success: true, message: "Login successful.", ...session });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE];
    if (!refreshToken) throw new AppError("Session expired. Please sign in again.", 401);

    const session = await RefreshToken.findOneAndDelete({
      tokenHash: hashToken(refreshToken),
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      clearRefreshCookie(res);
      throw new AppError("Session expired. Please sign in again.", 401);
    }

    const user = await User.findById(session.user);
    if (!user) {
      clearRefreshCookie(res);
      throw new AppError("Session expired. Please sign in again.", 401);
    }

    const response = await authenticateResponse(user, req, res);
    logger.info({ event: "session_refreshed", userId: user._id }, "Session refreshed");
    res.status(200).json({ success: true, ...response });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE];
    if (refreshToken) await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
    clearRefreshCookie(res);
    logger.info({ event: "logout" }, "Session ended");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordResetTokenHash +passwordResetExpiresAt"
    );

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.passwordResetTokenHash = hashToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS);
      await user.save({ validateBeforeSave: false });

      const resetUrl = new URL(`/reset-password/${token}`, env.FRONTEND_URL);

      try {
        await sendPasswordResetEmail({ email: user.email, resetUrl: resetUrl.toString() });
        logger.info({ event: "password_reset_requested", userId: user._id }, "Password reset requested");
      } catch (emailError) {
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
        await user.save({ validateBeforeSave: false });
        logger.error(
          { err: emailError, event: "password_reset_email_failed", userId: user._id },
          "Password reset email failed"
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const token = (req.body?.token || req.params?.token || "").trim();
    const { password } = req.body;

    if (!token) {
      throw new AppError("The password reset link is invalid or has expired.", 400);
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");

    if (!user) {
      throw new AppError("The password reset link is invalid or has expired.", 400);
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    await RefreshToken.deleteMany({ user: user._id });
    clearRefreshCookie(res);
    logger.info({ event: "password_reset_completed", userId: user._id }, "Password reset completed");
    res.status(200).json({ success: true, message: "Password reset successful. Please sign in." });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, password } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new AppError("Current password is incorrect.", 400);
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save({ validateBeforeSave: false });
    await RefreshToken.deleteMany({ user: user._id });
    const session = await authenticateResponse(user, req, res);
    logger.info({ event: "password_changed", userId: user._id }, "Password changed");
    res.status(200).json({ success: true, message: "Password changed successfully.", ...session });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res) => {
  res.status(200).json({ success: true, user: serializeUser(req.user) });
};

const getProfile = async (req, res, next) => {
  try {
    // Re-fetch to ensure all new fields are populated (in case middleware user is from old session)
    const user = await User.findById(req.user._id).select("-password -__v -loginAttempts -lockUntil -passwordResetTokenHash -passwordResetExpiresAt");
    if (!user) throw new AppError("User not found.", 404);
    res.status(200).json({ success: true, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["fullName", "dateOfBirth", "phone", "gender", "location", "bio", "theme"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate fullName if provided
    if (updates.fullName !== undefined) {
      const name = String(updates.fullName).trim();
      if (name.length < 3 || name.length > 50) {
        throw new AppError("Full name must be between 3 and 50 characters.", 400);
      }
      updates.fullName = name;
    }

    // Validate theme if provided
    if (updates.theme !== undefined && !["light", "dark", "system"].includes(updates.theme)) {
      throw new AppError("Theme must be one of: light, dark, system.", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -__v -loginAttempts -lockUntil -passwordResetTokenHash -passwordResetExpiresAt");

    if (!user) throw new AppError("User not found.", 404);

    logger.info({ event: "profile_updated", userId: user._id }, "Profile updated");
    res.status(200).json({ success: true, message: "Profile updated successfully.", user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
};
