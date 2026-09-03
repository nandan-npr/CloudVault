const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cloudvault-storage-test-"));
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/cloudvault-test";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.CLIENT_URL = "http://localhost:5173";
process.env.CORS_ORIGINS = "http://localhost:5173";
process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test";
process.env.SMTP_PASS = "test";
process.env.SMTP_FROM = "no-reply@example.com";
process.env.FILE_STORAGE_DIR = tempRoot;
process.env.MAX_FILE_SIZE_MB = "50";

const storage = require("../services/fileStorageService");

const STORED_NAME = "12345678-1234-1234-1234-123456789abc.png";

const after = require("node:test").after;

after(async () => {
  await fsp.rm(tempRoot, { recursive: true, force: true });
});

test("save moves a temporary file into the storage directory", async () => {
  const source = path.join(tempRoot, "tmp", "source.png");
  await fsp.mkdir(path.dirname(source), { recursive: true });
  await fsp.writeFile(source, "png-bytes");

  await storage.save(STORED_NAME, source);

  const destination = path.join(storage.storageRoot, "files", STORED_NAME);
  assert.equal(fs.existsSync(destination), true);
  assert.equal(fs.existsSync(source), false);
  await storage.remove(STORED_NAME);
});

test("read returns a stream with the stored content", async () => {
  const source = path.join(storage.tmpDir, "source.png");
  await fsp.mkdir(storage.tmpDir, { recursive: true });
  await fsp.writeFile(source, "hello-storage");
  await storage.save(STORED_NAME, source);

  const stream = storage.read(STORED_NAME);
  const chunks = [];
  await new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  assert.equal(Buffer.concat(chunks).toString("utf8"), "hello-storage");
  await storage.remove(STORED_NAME);
});

test("computeSha256 returns the expected checksum", async () => {
  const source = path.join(storage.tmpDir, "source.png");
  await fsp.mkdir(storage.tmpDir, { recursive: true });
  await fsp.writeFile(source, "checksum-me");

  const hash = await storage.computeSha256(source);

  assert.equal(hash, crypto.createHash("sha256").update("checksum-me").digest("hex"));
});

test("remove deletes the stored file and is idempotent", async () => {
  const source = path.join(storage.tmpDir, "source.png");
  await fsp.mkdir(storage.tmpDir, { recursive: true });
  await fsp.writeFile(source, "x");
  await storage.save(STORED_NAME, source);

  assert.equal(await storage.remove(STORED_NAME), true);
  assert.equal(await storage.remove(STORED_NAME), false);
});

test("path traversal stored names are rejected", async () => {
  const source = path.join(storage.tmpDir, "source.png");
  await fsp.mkdir(storage.tmpDir, { recursive: true });
  await fsp.writeFile(source, "x");

  await assert.rejects(() => storage.save("../../evil.txt", source));
  await assert.rejects(() => storage.remove("../../evil.txt"));
  await assert.rejects(async () => storage.read("../../evil.txt"));
});

test("removeTemporary ignores missing files", async () => {
  await assert.doesNotReject(() => storage.removeTemporary(path.join(tempRoot, "nope.txt")));
});
