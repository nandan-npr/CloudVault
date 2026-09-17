const express = require("express");
const protect = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const { uploadLimiter } = require("../middleware/rateLimiters");
const {
  uploadFile,
  listFiles,
  getFile,
  getFileStats,
  previewFile,
  downloadFile,
  deleteFile,
  restoreFile,
  permanentlyDeleteFile,
  moveFiles,
} = require("../controllers/fileController");

const router = express.Router();

router.use(protect);

router.post("/upload", uploadLimiter, upload.array("files", 10), uploadFile);
router.post("/", uploadLimiter, upload.array("files", 10), uploadFile);
router.post("/single", uploadLimiter, upload.single("file"), uploadFile);
router.post("/move", moveFiles);
router.get("/stats", getFileStats);
router.get("/", listFiles);
router.post("/:id/restore", restoreFile);
router.get("/:id", getFile);
router.get("/:id/preview", previewFile);
router.get("/:id/download", downloadFile);
router.delete("/:id/permanent", permanentlyDeleteFile);
router.delete("/:id", deleteFile);

module.exports = router;
