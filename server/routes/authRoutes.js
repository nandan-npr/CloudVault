const express = require("express");
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { loginLimiter, registerLimiter, passwordResetLimiter } = require("../middleware/rateLimiters");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../validators/authValidation");

const router = express.Router();

router.post("/signup", registerLimiter, validateRequest(registerSchema), registerUser);
router.post("/register", registerLimiter, validateRequest(registerSchema), registerUser);
router.post("/login", loginLimiter, validateRequest(loginSchema), loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", passwordResetLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validateRequest(resetPasswordSchema), resetPassword);
router.post("/reset-password", validateRequest(resetPasswordSchema), resetPassword);
router.post("/change-password", protect, validateRequest(changePasswordSchema), changePassword);

module.exports = router;
