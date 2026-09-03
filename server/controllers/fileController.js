const path = require("path");
const User = require("../models/User");
const File = require("../models/File");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const fileStorageService = require("../services/fileStorageService");
const { sanitizeOriginalName } = require("../middleware/uploadMiddleware");
const { listFilesSchema } = require("../validators/fileValidation");

const normalizeFileQuery = (userId) => ({
  $or: [{ userId }, { owner: userId }],
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const inferCategory = (mimeType) => {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("text")) return "text";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "presentation";
  if (mimeType.includes("zip")) return "archive";
  if (mimeType.includes("word") || mimeType.includes("document")) return "document";
  return "other";
};

const getCloudinaryResourceType = (mimeType) =>
  mimeType?.startsWith("image/") ? "image" : mimeType?.startsWith("audio/") ? "video" : "raw";

const serializeFile = (file) => ({
  id: file._id,
  userId: file.userId || file.owner || null,
  originalName: file.originalName,
  cloudinaryPublicId: file.cloudinaryPublicId,
  cloudinaryUrl: file.cloudinaryUrl,
  mimeType: file.mimeType,
  size: file.fileSize ?? file.size ?? 0,
  fileSize: file.fileSize ?? file.size ?? 0,
  category: file.category || inferCategory(file.mimeType),
  extension: file.extension || path.extname(file.originalName || "").slice(1).toLowerCase(),
  uploadedAt: file.uploadedAt || file.createdAt,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

const uploadFile = async (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];

  if (!files.length) {
    return next(new AppError("No file was provided.", 400));
  }

  const uploadedFiles = [];
  let totalBytes = 0;

  try {
    for (const item of files) {
      totalBytes += item.size || 0;
      const tempPath = item.path;
      const sha256 = await fileStorageService.computeSha256(tempPath);
      const cloud = await fileStorageService.uploadFromPath(tempPath, item.originalname, item.mimetype);
      const fileSize = cloud.bytes || item.size || 0;

      const record = await File.create({
        userId: req.user._id,
        owner: req.user._id,
        originalName: sanitizeOriginalName(item.originalname),
        cloudinaryPublicId: cloud.publicId,
        cloudinaryUrl: cloud.url,
        mimeType: item.mimetype,
        fileSize,
        size: fileSize,
        category: inferCategory(item.mimetype),
        extension: path.extname(item.originalname).toLowerCase().slice(1),
        uploadedAt: new Date(),
        sha256,
      });

      uploadedFiles.push(serializeFile(record));
      await fileStorageService.removeTemporary(tempPath);
      logger.info({ event: "file_uploaded", userId: req.user._id, fileId: record._id }, "File uploaded");
    }

    const updated = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        $expr: { $lte: [{ $add: ["$storageUsed", totalBytes] }, "$storageLimit"] },
      },
      { $inc: { storageUsed: totalBytes, totalFiles: uploadedFiles.length } },
      { new: true }
    );

    if (!updated) {
      for (const record of uploadedFiles) {
        await File.deleteOne({ _id: record.id });
        await fileStorageService.remove(record.cloudinaryPublicId, record.mimeType?.startsWith("image/") ? "image" : "auto");
      }
      return next(new AppError("Storage quota exceeded.", 413));
    }

    if (uploadedFiles.length === 1) {
      return res.status(201).json({ success: true, message: "File uploaded successfully.", file: uploadedFiles[0] });
    }

    return res.status(201).json({ success: true, message: "Files uploaded successfully.", files: uploadedFiles });
  } catch (error) {
    for (const item of files) {
      try {
        await fileStorageService.removeTemporary(item.path);
      } catch (cleanupError) {
        logger.warn({ err: cleanupError }, "Failed to clean up temporary upload");
      }
    }
    next(error);
  }
};

const listFiles = async (req, res, next) => {
  try {
    const parsed = listFilesSchema.safeParse(req.query);

    if (!parsed.success) {
      return next(
        new AppError(
          "Invalid query parameters.",
          400,
          parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }))
        )
      );
    }

    const { page, limit, sort, search, type } = parsed.data;
    const filter = normalizeFileQuery(req.user._id);
    if (search) {
      filter.$and = [{ originalName: { $regex: escapeRegex(search), $options: "i" } }];
    }
    if (type) {
      filter.$and = [
        ...(filter.$and || []),
        { category: { $regex: `^${type}$`, $options: "i" } },
      ];
    }

    const [files, total] = await Promise.all([
      File.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      File.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      files: files.map(serializeFile),
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

const getFile = async (req, res, next) => {
  try {
    const record = await File.findOne({ _id: req.params.id, ...normalizeFileQuery(req.user._id) });

    if (!record) return next(new AppError("File not found.", 404));

    res.status(200).json({ success: true, file: serializeFile(record) });
  } catch (error) {
    next(error);
  }
};

const previewFile = async (req, res, next) => {
  try {
    const record = await File.findOne({ _id: req.params.id, ...normalizeFileQuery(req.user._id) });

    if (!record) return next(new AppError("File not found.", 404));

    const previewTypes = ["application/pdf", "image/jpeg", "image/png", "text/plain"];
    const getsInlinePreview = previewTypes.includes(record.mimeType);

    if (!record.cloudinaryUrl || !getsInlinePreview) {
      return next(new AppError("Preview is not available for this file type.", 400));
    }

    const stream = await fileStorageService.readCloudinary({
      publicId: record.cloudinaryPublicId,
      resourceType: getCloudinaryResourceType(record.mimeType),
      format: record.extension,
    });
    res.setHeader("Content-Type", record.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${sanitizeOriginalName(record.originalName)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const record = await File.findOne({ _id: req.params.id, ...normalizeFileQuery(req.user._id) });

    if (!record) return next(new AppError("File not found.", 404));

    const stream = await fileStorageService.readCloudinary({
      publicId: record.cloudinaryPublicId,
      resourceType: getCloudinaryResourceType(record.mimeType),
      format: record.extension,
    });

    res.setHeader("Content-Type", record.mimeType || "application/octet-stream");
    res.setHeader("Content-Length", record.fileSize ?? record.size ?? 0);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(record.originalName)}`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const record = await File.findOne({ _id: req.params.id, ...normalizeFileQuery(req.user._id) });

    if (!record) return next(new AppError("File not found.", 404));

    await User.updateOne(
      { _id: req.user._id },
      [
        {
          $set: {
            storageUsed: { $max: [0, { $add: ["$storageUsed", -(record.fileSize ?? record.size ?? 0)] }] },
            totalFiles: { $max: [0, { $add: ["$totalFiles", -1] }] },
          },
        },
      ]
    );

    try {
      await fileStorageService.removeCloudinary(
        record.cloudinaryPublicId,
        getCloudinaryResourceType(record.mimeType)
      );
    } catch (storageError) {
      logger.warn({ err: storageError, fileId: record._id }, "File metadata removed but Cloudinary cleanup failed");
    }

    await File.deleteOne({ _id: record._id });

    logger.info({ event: "file_deleted", userId: req.user._id, fileId: record._id }, "File deleted");
    res.status(200).json({ success: true, message: "File deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, listFiles, getFile, previewFile, downloadFile, deleteFile };
