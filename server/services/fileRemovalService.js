const File = require("../models/File");
const User = require("../models/User");
const logger = require("../config/logger");
const fileStorageService = require("./fileStorageService");

const getCloudinaryResourceType = (mimeType) =>
  mimeType?.startsWith("image/") ? "image" : mimeType?.startsWith("audio/") ? "video" : "raw";

// Removes the Cloudinary resource and the metadata record, then frees storage counters.
// Cloudinary failure must not block metadata removal — the counters stay consistent
// because both are computed from the same record before deletion.
const permanentlyRemoveFile = async (record, userId) => {
  try {
    await fileStorageService.removeCloudinary(
      record.cloudinaryPublicId,
      getCloudinaryResourceType(record.mimeType)
    );
  } catch (storageError) {
    logger.warn(
      { err: storageError, fileId: record._id },
      "File metadata removed but Cloudinary cleanup failed"
    );
  }
  await File.deleteOne({ _id: record._id });

  if (userId) {
    await User.updateOne(
      { _id: userId },
      [
        {
          $set: {
            storageUsed: {
              $max: [0, { $add: ["$storageUsed", -(record.fileSize ?? record.size ?? 0)] }],
            },
            totalFiles: { $max: [0, { $add: ["$totalFiles", -1] }] },
          },
        },
      ]
    );
  }
};

module.exports = { permanentlyRemoveFile, getCloudinaryResourceType };
