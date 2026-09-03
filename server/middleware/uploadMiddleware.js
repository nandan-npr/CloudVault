const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const AppError = require("../utils/AppError");
const fileStorageService = require("../services/fileStorageService");

const ALLOWED_TYPES = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.ms-powerpoint": ["ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
  "text/plain": ["txt"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/zip": ["zip"],
  "application/x-zip-compressed": ["zip"],
  "application/vnd.ms-excel.sheet.macroenabled.12": ["xlsm"],
};

const stripControlCharacters = (value) => {
  let result = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    result += char;
  }
  return result;
};

const sanitizeOriginalName = (originalName) => {
  const normalized = String(originalName || "file").replace(/\\/g, "/");
  const basename = normalized.split("/").pop();
  const cleaned = stripControlCharacters(basename)
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim()
    .slice(0, 255);
  return cleaned || "file";
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fileStorageService.ensureTemporaryDir();
      cb(null, fileStorageService.tmpDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, `${crypto.randomUUID()}.${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase().slice(1);
  const allowedExtensions = ALLOWED_TYPES[file.mimetype];

  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return cb(
      new AppError(
        "Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, ZIP.",
        415
      )
    );
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: fileStorageService.MAX_FILE_SIZE_BYTES, files: 10 },
  fileFilter,
});

module.exports = { upload, ALLOWED_TYPES, sanitizeOriginalName };
