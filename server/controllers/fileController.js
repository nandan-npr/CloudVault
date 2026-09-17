const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const File = require("../models/File");
const Folder = require("../models/Folder");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const fileStorageService = require("../services/fileStorageService");
const { permanentlyRemoveFile } = require("../services/fileRemovalService");
const { sanitizeOriginalName } = require("../middleware/uploadMiddleware");
const { listFilesSchema } = require("../validators/fileValidation");

const normalizeFileQuery = (userId) => ({
  $or: [{ userId }, { owner: userId }],
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildDateRangeFilter = ({ year, month, date }) => {
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { $gte: start, $lt: end };
  }

  if (year || month) {
    const resolvedYear = year || new Date().getUTCFullYear();
    const start = new Date(Date.UTC(resolvedYear, (month || 1) - 1, 1));
    const end = month
      ? new Date(Date.UTC(resolvedYear, month, 1))
      : new Date(Date.UTC(resolvedYear + 1, 0, 1));
    return { $gte: start, $lt: end };
  }

  return null;
};

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
  folderId: file.folderId || null,
  isDeleted: !!file.isDeleted,
  uploadedAt: file.uploadedAt || file.createdAt,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
  deletedAt: file.deletedAt || null,
});

const uploadFile = async (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];

  if (!files.length) {
    return next(new AppError("No file was provided.", 400));
  }

  const uploadedFiles = [];
  let totalBytes = 0;

  // Optional target folder: must be an active folder owned by the user
  const requestedFolderId = req.body?.folderId;
  let targetFolderId = null;
  if (requestedFolderId) {
    if (!mongoose.Types.ObjectId.isValid(requestedFolderId)) {
      return next(new AppError("Invalid folder id.", 400));
    }
    const folder = await Folder.findOne({
      _id: requestedFolderId,
      $or: [{ userId: req.user._id }, { owner: req.user._id }],
      isDeleted: false,
    });
    if (!folder) return next(new AppError("Folder not found.", 404));
    targetFolderId = folder._id;
  }

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
        folderId: targetFolderId,
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

    const { page, limit, sort, search, type, year, month, date, minSize, maxSize, folder } =
      parsed.data;
    const filter = normalizeFileQuery(req.user._id);
    filter.isDeleted = false;

    // Folder scoping: "root" (or omitted) shows only files not inside any folder
    if (folder !== undefined) {
      if (folder === "all") {
        // no folder constraint — every active file
      } else if (folder === "root" || folder === "") {
        filter.folderId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(folder)) {
          return next(new AppError("Invalid folder id.", 400));
        }
        filter.folderId = new mongoose.Types.ObjectId(folder);
      }
    }

    const andClauses = [];

    if (search) {
      andClauses.push({ originalName: { $regex: escapeRegex(search), $options: "i" } });
    }
    if (type) {
      if (type.toLowerCase() === "other") {
        andClauses.push({ category: { $nin: ["pdf", "image"] } });
      } else {
        andClauses.push({ category: { $regex: `^${escapeRegex(type)}$`, $options: "i" } });
      }
    }

    const dateRange = buildDateRangeFilter({ year, month, date });
    if (dateRange) andClauses.push({ uploadedAt: dateRange });

    if (minSize !== undefined || maxSize !== undefined) {
      const sizeExpr = { $ifNull: ["$fileSize", "$size"] };
      const sizeConditions = [];
      if (minSize !== undefined) sizeConditions.push({ $gte: [sizeExpr, minSize] });
      if (maxSize !== undefined) sizeConditions.push({ $lte: [sizeExpr, maxSize] });
      andClauses.push({ $expr: sizeConditions.length === 1 ? sizeConditions[0] : { $and: sizeConditions } });
    }

    if (andClauses.length) filter.$and = andClauses;

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

// Normal delete: soft delete into the Recycle Bin.
// Storage counters are unchanged — recycled files still consume quota until
// they are permanently deleted (see permanentlyDeleteFile).
const deleteFile = async (req, res, next) => {
  try {
    const record = await File.findOne({
      _id: req.params.id,
      ...normalizeFileQuery(req.user._id),
      isDeleted: false,
    });

    if (!record) return next(new AppError("File not found.", 404));

    record.isDeleted = true;
    record.deletedAt = new Date();
    await record.save();

    logger.info(
      { event: "file_deleted", userId: req.user._id, fileId: record._id },
      "File moved to recycle bin"
    );
    res.status(200).json({ success: true, message: "File moved to the Recycle Bin." });
  } catch (error) {
    next(error);
  }
};

const restoreFile = async (req, res, next) => {
  try {
    const record = await File.findOne({
      _id: req.params.id,
      ...normalizeFileQuery(req.user._id),
      isDeleted: true,
    });
    if (!record) return next(new AppError("Deleted file not found.", 404));

    // Restore into the original folder if it still exists and is active; otherwise root
    let folderId = record.folderId;
    if (folderId) {
      const folder = await Folder.findOne({
        _id: folderId,
        $or: [{ userId: req.user._id }, { owner: req.user._id }],
      }).select("isDeleted");
      if (!folder || folder.isDeleted) folderId = null;
    }

    record.isDeleted = false;
    record.deletedAt = null;
    record.folderId = folderId;
    await record.save();

    logger.info({ event: "file_restored", userId: req.user._id, fileId: record._id }, "File restored");
    res.status(200).json({ success: true, message: "File restored successfully." });
  } catch (error) {
    next(error);
  }
};

const permanentlyDeleteFile = async (req, res, next) => {
  try {
    const record = await File.findOne({
      _id: req.params.id,
      ...normalizeFileQuery(req.user._id),
    });
    if (!record) return next(new AppError("File not found.", 404));

    await permanentlyRemoveFile(record, req.user._id);

    logger.info(
      { event: "file_permanently_deleted", userId: req.user._id, fileId: req.params.id },
      "File permanently deleted"
    );
    res.status(200).json({ success: true, message: "File permanently deleted." });
  } catch (error) {
    next(error);
  }
};

// Move one or many files into a folder (or root with targetFolderId null).
// Ownership is verified for every id — unknown or foreign ids abort the batch.
const moveFiles = async (req, res, next) => {
  try {
    const fileIds = Array.isArray(req.body?.fileIds) ? req.body.fileIds : [];
    const targetFolderId = req.body?.targetFolderId;

    if (!fileIds.length) {
      return next(new AppError("No files were selected.", 400));
    }
    if (fileIds.length > 100) {
      return next(new AppError("Too many files selected.", 400));
    }
    for (const id of fileIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid file id.", 400));
      }
    }

    let targetId = null;
    if (targetFolderId) {
      if (!mongoose.Types.ObjectId.isValid(targetFolderId)) {
        return next(new AppError("Invalid target folder id.", 400));
      }
      const folder = await Folder.findOne({
        _id: targetFolderId,
        $or: [{ userId: req.user._id }, { owner: req.user._id }],
        isDeleted: false,
      });
      if (!folder) return next(new AppError("Target folder not found.", 404));
      targetId = folder._id;
    }

    const result = await File.updateMany(
      {
        _id: { $in: fileIds },
        ...normalizeFileQuery(req.user._id),
        isDeleted: false,
      },
      { $set: { folderId: targetId } }
    );

    if (result.matchedCount !== fileIds.length) {
      return next(new AppError("One or more files could not be found in your workspace.", 404));
    }

    logger.info(
      { event: "files_moved", userId: req.user._id, count: fileIds.length, targetId },
      "Files moved"
    );
    res
      .status(200)
      .json({ success: true, message: `Moved ${fileIds.length} file${fileIds.length === 1 ? "" : "s"} successfully.` });
  } catch (error) {
    next(error);
  }
};

const getFileStats = async (req, res, next) => {
  try {
    const [aggregate] = await File.aggregate([
      { $match: { ...normalizeFileQuery(req.user._id) } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          storageUsed: { $sum: { $ifNull: ["$fileSize", "$size"] } },
          pdfFiles: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$category", "pdf"] },
                    { $eq: ["$mimeType", "application/pdf"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          imageFiles: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$category", "image"] },
                    { $regexMatch: { input: { $ifNull: ["$mimeType", ""] }, regex: "^image/" } },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalFiles = aggregate?.totalFiles || 0;
    const pdfFiles = aggregate?.pdfFiles || 0;
    const imageFiles = aggregate?.imageFiles || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalFiles,
        storageUsed: aggregate?.storageUsed || 0,
        pdfFiles,
        imageFiles,
        otherFiles: Math.max(0, totalFiles - pdfFiles - imageFiles),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
