const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
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
    originalName: {
      type: String,
      required: [true, "Original name is required"],
      trim: true,
      maxlength: 255,
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
      index: true,
    },
    cloudinaryUrl: {
      type: String,
      required: [true, "Cloudinary URL is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
      maxlength: 100,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: 0,
    },
    size: {
      type: Number,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      default: "other",
      trim: true,
      maxlength: 32,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    extension: {
      type: String,
      maxlength: 16,
      default: "",
    },
    sha256: {
      type: String,
      maxlength: 64,
      default: "",
    },
  },
  { timestamps: true }
);

fileSchema.index({ userId: 1, uploadedAt: -1 });
fileSchema.index({ owner: 1, uploadedAt: -1 });

fileSchema.pre("save", function syncUserAlias(next) {
  if (!this.userId && this.owner) this.userId = this.owner;
  if (!this.owner && this.userId) this.owner = this.userId;
  if (this.fileSize === undefined && this.size !== undefined) this.fileSize = this.size;
  if (this.size === undefined && this.fileSize !== undefined) this.size = this.fileSize;
  if (!this.uploadedAt) this.uploadedAt = new Date();
  next();
});

module.exports = mongoose.model("File", fileSchema);
