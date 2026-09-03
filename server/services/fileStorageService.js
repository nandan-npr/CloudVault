const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const { v2: cloudinary } = require("cloudinary");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");

const MAX_FILE_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;
const STORED_NAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,16}$/i;

const storageRoot = path.resolve(process.cwd(), env.FILE_STORAGE_DIR);
const tmpDir = path.join(storageRoot, "tmp");
const filesDir = path.join(storageRoot, "files");

let initialized = false;

const ensureDirs = async () => {
  if (initialized) return;
  await fsp.mkdir(tmpDir, { recursive: true });
  await fsp.mkdir(filesDir, { recursive: true });
  initialized = true;
};

const ensureTemporaryDir = async () => {
  await ensureDirs();
};

const assertSafeKey = (storedName) => {
  if (typeof storedName !== "string" || !STORED_NAME_PATTERN.test(storedName)) {
    throw new AppError("Invalid file key.", 400);
  }
};

const save = async (storedName, sourcePath) => {
  assertSafeKey(storedName);
  await ensureDirs();
  const destination = path.join(filesDir, storedName);
  await fsp.rename(sourcePath, destination);
  logger.debug({ event: "file_saved", storedName }, "File stored");
  return destination;
};

const read = (storedName) => {
  assertSafeKey(storedName);
  return fs.createReadStream(path.join(filesDir, storedName));
};

const remove = async (storedName) => {
  assertSafeKey(storedName);
  try {
    await fsp.unlink(path.join(filesDir, storedName));
    logger.debug({ event: "file_removed", storedName }, "File removed from storage");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.warn({ event: "file_missing", storedName }, "File not found during removal");
      return false;
    }
    throw error;
  }
};

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const getResourceType = (mimeType) => {
  if (!mimeType) return "auto";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "video";
  if (mimeType === "application/pdf" || mimeType.includes("text/")) return "raw";
  return "auto";
};

const uploadFromPath = async (sourcePath, originalName, mimeType) => {
  const publicId = `cloudvault/${Date.now()}-${crypto.randomUUID()}`;
  const result = await cloudinary.uploader.upload(sourcePath, {
    public_id: publicId,
    folder: "cloudvault",
    resource_type: getResourceType(mimeType),
    overwrite: false,
    use_filename: false,
    unique_filename: true,
    access_mode: "authenticated",
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    resourceType: result.resource_type,
    bytes: result.bytes || 0,
  };
};

const removeCloudinary = async (publicId, resourceType = "auto") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.debug({ event: "cloudinary_file_removed", publicId, result }, "Cloudinary object removed");
    return result.result === "ok" || result.result === "not_found";
  } catch (error) {
    logger.warn({ err: error, publicId }, "Failed to delete Cloudinary object");
    throw error;
  }
};

const fetchStream = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: "*/*" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchStream(res.headers.location));
        return;
      }

      if (res.statusCode && res.statusCode >= 400) {
        reject(new AppError("File could not be retrieved from Cloudinary.", 502));
        return;
      }

      resolve(res);
    });

    req.on("error", reject);
  });
};

const readCloudinary = async ({ publicId, resourceType, format }) => {
  if (!publicId) throw new AppError("File source is unavailable.", 404);

  const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: "upload",
    attachment: false,
  });

  return fetchStream(signedUrl);
};

const computeSha256 = async (filePath) => {
  const hash = crypto.createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return hash.digest("hex");
};

const removeTemporary = async (sourcePath) => {
  try {
    await fsp.unlink(sourcePath);
  } catch (error) {
    if (error.code !== "ENOENT") logger.warn({ err: error }, "Failed to remove temporary file");
  }
};

module.exports = {
  MAX_FILE_SIZE_BYTES,
  storageRoot,
  tmpDir,
  filesDir,
  ensureTemporaryDir,
  ensureDirs,
  save,
  read,
  remove,
  uploadFromPath,
  removeCloudinary,
  readCloudinary,
  computeSha256,
  removeTemporary,
  getResourceType,
};
