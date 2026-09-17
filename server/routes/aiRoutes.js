const express = require("express");
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { aiLimiter } = require("../middleware/rateLimiters");
const { chatWithFileSchema } = require("../validators/aiValidation");
const { chatWithFile } = require("../controllers/aiController");

const router = express.Router();

router.use(protect);

router.post("/files/:fileId/chat", aiLimiter, validateRequest(chatWithFileSchema), chatWithFile);

module.exports = router;
