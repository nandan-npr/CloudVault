const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/folderController");

const router = express.Router();

router.use(protect);

router.post("/", createFolder);
router.get("/", listFolders);
router.get("/tree", getFolderTree);
router.get("/recycle-bin", listRecycleBin);
router.post("/recycle-bin/empty", emptyRecycleBin);
router.get("/:id", getFolder);
router.patch("/:id", renameFolder);
router.post("/:id/move", moveFolder);
router.post("/:id/restore", restoreFolder);
router.post("/:id/permanent", permanentlyDeleteFolder);
router.delete("/:id", deleteFolder);

module.exports = router;
