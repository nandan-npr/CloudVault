const express = require("express");
const protect = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const { uploadLimiter } = require("../middleware/rateLimiters");
const {
  uploadFile,
  listFiles,
  getFile,
  previewFile,
  downloadFile,
  deleteFile,
} = require("../controllers/fileController");

const router = express.Router();

router.use(protect);

router.post("/upload", uploadLimiter, upload.array("files", 10), uploadFile);
router.post("/", uploadLimiter, upload.array("files", 10), uploadFile);
router.post("/single", uploadLimiter, upload.single("file"), uploadFile);
router.get("/", listFiles);
router.get("/:id", getFile);
router.get("/:id/preview", previewFile);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);

module.exports = router;
