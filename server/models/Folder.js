const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: 100,
    },
    parentFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

folderSchema.index({ userId: 1, parentFolderId: 1, isDeleted: 1 });
folderSchema.index({ owner: 1, parentFolderId: 1, isDeleted: 1 });

folderSchema.pre("save", function syncUserAlias(next) {
  if (!this.userId && this.owner) this.userId = this.owner;
  if (!this.owner && this.userId) this.owner = this.userId;
  next();
});

module.exports = mongoose.model("Folder", folderSchema);
