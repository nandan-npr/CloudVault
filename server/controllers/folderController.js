const mongoose = require("mongoose");
const Folder = require("../models/Folder");
const File = require("../models/File");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { permanentlyRemoveFile } = require("../services/fileRemovalService");

const normalizeFolderQuery = (userId) => ({
  $or: [{ userId }, { owner: userId }],
});

const normalizeFileQuery = (userId) => ({
  $or: [{ userId }, { owner: userId }],
});

const FOLDER_NAME_PATTERN = /[\\/:*?"<>|]/;

const validateFolderName = (rawName) => {
  const name = String(rawName || "").trim();
  if (!name) throw new AppError("Folder name cannot be empty.", 400);
  if (name.length > 100) throw new AppError("Folder name must be 100 characters or fewer.", 400);
  if (name === "." || name === ".." || FOLDER_NAME_PATTERN.test(name)) {
    throw new AppError("Folder name contains invalid characters.", 400);
  }
  return name;
};

const parseObjectId = (value, label) => {
  if (value === undefined || value === null || value === "" || value === "root") return null;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label} id.`, 400);
  }
  return new mongoose.Types.ObjectId(value);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertActiveFolder = async (folderId, userId) => {
  if (!folderId) return null;
  const folder = await Folder.findOne({
    _id: folderId,
    ...normalizeFolderQuery(userId),
    isDeleted: false,
  });
  if (!folder) throw new AppError("Folder not found.", 404);
  return folder;
};

// Throws if moving `folderId` into `targetId` would create a cycle
const assertNoCircularMove = async (folderId, targetId) => {
  if (!targetId) return;
  if (String(folderId) === String(targetId)) {
    throw new AppError("A folder cannot be moved into itself.", 400);
  }
  let currentId = targetId;
  const seen = new Set();
  while (currentId) {
    if (String(currentId) === String(folderId)) {
      throw new AppError("A folder cannot be moved into one of its own subfolders.", 400);
    }
    if (seen.has(String(currentId))) break;
    seen.add(String(currentId));
    const parent = await Folder.findById(currentId).select("parentFolderId");
    currentId = parent?.parentFolderId || null;
  }
};

const assertNoDuplicateName = async ({ userId, parentFolderId, name, excludeId }) => {
  const query = {
    ...normalizeFolderQuery(userId),
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    isDeleted: false,
    parentFolderId: parentFolderId || null,
  };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Folder.findOne(query);
  if (existing) {
    throw new AppError("A folder with that name already exists here.", 409);
  }
};

// All folder ids in the subtree rooted at rootId (inclusive), scoped to the user
const collectSubtreeFolderIds = async (rootId, userId) => {
  const ids = [rootId];
  const seen = new Set([String(rootId)]);
  let frontier = [rootId];
  while (frontier.length) {
    const children = await Folder.find({
      ...normalizeFolderQuery(userId),
      parentFolderId: { $in: frontier },
    })
      .select("_id")
      .lean();
    frontier = [];
    for (const child of children) {
      if (!seen.has(String(child._id))) {
        seen.add(String(child._id));
        frontier.push(child._id);
        ids.push(child._id);
      }
    }
  }
  return ids;
};

const buildAncestorTrail = async (folder, userId) => {
  const trail = [];
  let currentId = folder.parentFolderId;
  const seen = new Set();
  while (currentId && !seen.has(String(currentId))) {
    seen.add(String(currentId));
    const parent = await Folder.findOne({
      _id: currentId,
      ...normalizeFolderQuery(userId),
      isDeleted: false,
    }).select("name parentFolderId");
    if (!parent) break;
    trail.unshift({ id: parent._id, name: parent.name });
    currentId = parent.parentFolderId;
  }
  return [...trail, { id: folder._id, name: folder.name }];
};

const serializeFolder = (folder) => ({
  id: folder._id,
  name: folder.name,
  parentFolderId: folder.parentFolderId || null,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
  deletedAt: folder.deletedAt || null,
});

const createFolder = async (req, res, next) => {
  try {
    const name = validateFolderName(req.body?.name);
    const parentFolderId = parseObjectId(req.body?.parentFolderId, "parent folder");

    if (parentFolderId) {
      await assertActiveFolder(parentFolderId, req.user._id);
    }
    await assertNoDuplicateName({ userId: req.user._id, parentFolderId, name });

    const folder = await Folder.create({
      userId: req.user._id,
      owner: req.user._id,
      name,
      parentFolderId,
    });

    logger.info(
      { event: "folder_created", userId: req.user._id, folderId: folder._id },
      "Folder created"
    );
    res
      .status(201)
      .json({ success: true, message: "Folder created successfully.", folder: serializeFolder(folder) });
  } catch (error) {
    next(error);
  }
};

const listFolders = async (req, res, next) => {
  try {
    const parentId = parseObjectId(req.query.parent, "parent folder");
    const folders = await Folder.find({
      ...normalizeFolderQuery(req.user._id),
      parentFolderId: parentId,
      isDeleted: false,
    })
      .sort({ name: 1 })
      .lean();

    res.status(200).json({ success: true, folders: folders.map(serializeFolder) });
  } catch (error) {
    next(error);
  }
};

// Full active folder tree — used by the Move dialog picker
const getFolderTree = async (req, res, next) => {
  try {
    const folders = await Folder.find({
      ...normalizeFolderQuery(req.user._id),
      isDeleted: false,
    })
      .select("name parentFolderId")
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      folders: folders.map((folder) => ({
        id: folder._id,
        name: folder.name,
        parentFolderId: folder.parentFolderId || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      ...normalizeFolderQuery(req.user._id),
      isDeleted: false,
    });
    if (!folder) throw new AppError("Folder not found.", 404);

    const breadcrumb = await buildAncestorTrail(folder, req.user._id);
    const [folderCount, fileCount] = await Promise.all([
      Folder.countDocuments({
        ...normalizeFolderQuery(req.user._id),
        parentFolderId: folder._id,
        isDeleted: false,
      }),
      File.countDocuments({
        ...normalizeFileQuery(req.user._id),
        folderId: folder._id,
        isDeleted: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      folder: { ...serializeFolder(folder), breadcrumb, folderCount, fileCount },
    });
  } catch (error) {
    next(error);
  }
};

const renameFolder = async (req, res, next) => {
  try {
    const name = validateFolderName(req.body?.name);
    const folder = await Folder.findOne({
      _id: req.params.id,
      ...normalizeFolderQuery(req.user._id),
      isDeleted: false,
    });
    if (!folder) throw new AppError("Folder not found.", 404);

    await assertNoDuplicateName({
      userId: req.user._id,
      parentFolderId: folder.parentFolderId,
      name,
      excludeId: folder._id,
    });

    folder.name = name;
    await folder.save();

    logger.info(
      { event: "folder_renamed", userId: req.user._id, folderId: folder._id },
      "Folder renamed"
    );
    res
      .status(200)
      .json({ success: true, message: "Folder renamed successfully.", folder: serializeFolder(folder) });
  } catch (error) {
    next(error);
  }
};

const moveFolder = async (req, res, next) => {
  try {
    const targetId = parseObjectId(req.body?.targetFolderId, "target folder");
    const folder = await Folder.findOne({
      _id: req.params.id,
      ...normalizeFolderQuery(req.user._id),
      isDeleted: false,
    });
    if (!folder) throw new AppError("Folder not found.", 404);

    if (targetId) {
      await assertActiveFolder(targetId, req.user._id);
      await assertNoCircularMove(folder._id, targetId);
    }

    if (String(folder.parentFolderId || "") === String(targetId || "")) {
      return res
        .status(200)
        .json({ success: true, message: "Folder is already in that location.", folder: serializeFolder(folder) });
    }

    await assertNoDuplicateName({
      userId: req.user._id,
      parentFolderId: targetId,
      name: folder.name,
      excludeId: folder._id,
    });

    folder.parentFolderId = targetId;
    await folder.save();

    logger.info(
      { event: "folder_moved", userId: req.user._id, folderId: folder._id, targetId },
      "Folder moved"
    );
    res
      .status(200)
      .json({ success: true, message: "Folder moved successfully.", folder: serializeFolder(folder) });
  } catch (error) {
    next(error);
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      ...normalizeFolderQuery(req.user._id),
      isDeleted: false,
    });
    if (!folder) throw new AppError("Folder not found.", 404);

    const folderIds = await collectSubtreeFolderIds(folder._id, req.user._id);
    const deletedAt = new Date();

    await Folder.updateMany(
      { _id: { $in: folderIds }, ...normalizeFolderQuery(req.user._id) },
      { $set: { isDeleted: true, deletedAt } }
    );
    await File.updateMany(
      { ...normalizeFileQuery(req.user._id), folderId: { $in: folderIds }, isDeleted: false },
      { $set: { isDeleted: true, deletedAt } }
    );

    logger.info(
      { event: "folder_deleted", userId: req.user._id, folderId: folder._id, subtree: folderIds.length },
      "Folder moved to recycle bin"
    );
    res.status(200).json({ success: true, message: "Folder moved to the Recycle Bin." });
  } catch (error) {
    next(error);
  }
};

const restoreFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      ...normalizeFolderQuery(req.user._id),
      isDeleted: true,
    });
    if (!folder) throw new AppError("Deleted folder not found.", 404);

    const batchTime = folder.deletedAt;

    // The parent must still exist and be active; otherwise restore at root
    let newParent = folder.parentFolderId;
    if (newParent) {
      const parent = await Folder.findOne({
        _id: newParent,
        ...normalizeFolderQuery(req.user._id),
      }).select("isDeleted");
      if (!parent || parent.isDeleted) newParent = null;
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    folder.parentFolderId = newParent;
    await folder.save();

    // Restore everything that was deleted together with this folder (same batch),
    // so separately deleted siblings/subtrees stay in the Recycle Bin.
    const batchFolders = await Folder.find({
      ...normalizeFolderQuery(req.user._id),
      isDeleted: true,
      deletedAt: batchTime,
      _id: { $ne: folder._id },
    }).select("_id parentFolderId");

    if (batchFolders.length) {
      await Folder.updateMany(
        { _id: { $in: batchFolders.map((item) => item._id) } },
        { $set: { isDeleted: false, deletedAt: null } }
      );

      const batchFolderIds = new Set(batchFolders.map((item) => String(item._id)));
      batchFolderIds.add(String(folder._id));
      // A restored folder whose parent was deleted in a different batch is re-parented to root
      for (const item of batchFolders) {
        if (!item.parentFolderId) continue;
        if (batchFolderIds.has(String(item.parentFolderId))) continue;
        const parent = await Folder.findOne({
          _id: item.parentFolderId,
          ...normalizeFolderQuery(req.user._id),
        }).select("isDeleted");
        if (!parent || parent.isDeleted) {
          await Folder.updateOne({ _id: item._id }, { $set: { parentFolderId: null } });
        }
      }
    }

    // Restore files from the same batch whose folder is now active (or root).
    // Files in folders that are still deleted stay deleted and return with their folder.
    const activeFolderIds = new Set(
      (
        await Folder.find({ ...normalizeFolderQuery(req.user._id), isDeleted: false })
          .select("_id")
          .lean()
      ).map((item) => String(item._id))
    );

    const batchFiles = await File.find({
      ...normalizeFileQuery(req.user._id),
      isDeleted: true,
      deletedAt: batchTime,
    }).select("_id folderId");

    const restorableFileIds = batchFiles
      .filter((file) => !file.folderId || activeFolderIds.has(String(file.folderId)))
      .map((file) => file._id);

    if (restorableFileIds.length) {
      await File.updateMany(
        { _id: { $in: restorableFileIds } },
        { $set: { isDeleted: false, deletedAt: null } }
      );
    }

    logger.info(
      { event: "folder_restored", userId: req.user._id, folderId: folder._id },
      "Folder restored"
    );
    res.status(200).json({ success: true, message: "Folder restored successfully." });
  } catch (error) {
    next(error);
  }
};

const permanentlyDeleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      ...normalizeFolderQuery(req.user._id),
    });
    if (!folder) throw new AppError("Folder not found.", 404);

    const folderIds = await collectSubtreeFolderIds(folder._id, req.user._id);
    const files = await File.find({
      ...normalizeFileQuery(req.user._id),
      folderId: { $in: folderIds },
    });

    for (const record of files) {
      await permanentlyRemoveFile(record, req.user._id);
    }
    await Folder.deleteMany({ _id: { $in: folderIds }, ...normalizeFolderQuery(req.user._id) });

    logger.info(
      {
        event: "folder_permanently_deleted",
        userId: req.user._id,
        folderId: folder._id,
        files: files.length,
      },
      "Folder permanently deleted"
    );
    res.status(200).json({ success: true, message: "Folder permanently deleted." });
  } catch (error) {
    next(error);
  }
};

// Top-level items of each deleted subtree: deleted folders whose parent is not itself deleted
const listRecycleBin = async (req, res, next) => {
  try {
    const [deletedFolders, deletedFiles] = await Promise.all([
      Folder.find({ ...normalizeFolderQuery(req.user._id), isDeleted: true })
        .sort({ deletedAt: -1 })
        .lean(),
      File.find({ ...normalizeFileQuery(req.user._id), isDeleted: true })
        .sort({ deletedAt: -1 })
        .lean(),
    ]);

    const deletedFolderIds = new Set(deletedFolders.map((folder) => String(folder._id)));
    const topFolders = deletedFolders.filter(
      (folder) => !folder.parentFolderId || !deletedFolderIds.has(String(folder.parentFolderId))
    );

    res.status(200).json({
      success: true,
      folders: topFolders.map(serializeFolder),
      files: deletedFiles.map((file) => ({
        id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.fileSize ?? file.size ?? 0,
        folderId: file.folderId || null,
        deletedAt: file.deletedAt || file.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const emptyRecycleBin = async (req, res, next) => {
  try {
    const deletedFiles = await File.find({ ...normalizeFileQuery(req.user._id), isDeleted: true });
    const deletedFolders = await Folder.find({
      ...normalizeFolderQuery(req.user._id),
      isDeleted: true,
    }).select("_id");

    // Files first (including every file inside deleted folder subtrees), then folder records
    for (const record of deletedFiles) {
      await permanentlyRemoveFile(record, req.user._id);
    }
    if (deletedFolders.length) {
      await Folder.deleteMany({
        _id: { $in: deletedFolders.map((folder) => folder._id) },
        ...normalizeFolderQuery(req.user._id),
      });
    }

    logger.info(
      {
        event: "recycle_bin_emptied",
        userId: req.user._id,
        files: deletedFiles.length,
        folders: deletedFolders.length,
      },
      "Recycle bin emptied"
    );
    res.status(200).json({
      success: true,
      message: "Recycle Bin emptied successfully.",
      removed: { files: deletedFiles.length, folders: deletedFolders.length },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFolder,
  listFolders,
  getFolderTree,
  getFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  restoreFolder,
  permanentlyDeleteFolder,
  listRecycleBin,
  emptyRecycleBin,
};
