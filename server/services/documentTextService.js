const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const fileStorageService = require("./fileStorageService");

// Document types the AI pipeline can currently analyze.
// DOC (legacy binary Word) has no reliable pure-JS parser — deliberately unsupported.
const AI_SUPPORTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const AI_UNSUPPORTED_MESSAGE = "This file type cannot be analyzed by AI yet.";

// Hard cap on extracted text sent to the model (~150k chars ≈ 40k tokens).
// Documents beyond this are truncated at a page/paragraph boundary and flagged,
// never silently cut.
const MAX_TEXT_CHARS = 150_000;

const isAiSupported = (file) => {
  if (AI_SUPPORTED_MIME.has(file.mimeType)) return true;
  // Fallback for TXT stored under generic mime types
  if (file.mimeType?.startsWith("text/") && file.extension === "txt") return true;
  return false;
};

// Buffers the authenticated Cloudinary stream, bounded by the upload size limit
const retrieveFileBuffer = async (file) => {
  const stream = await fileStorageService.readCloudinary({
    publicId: file.cloudinaryPublicId,
    resourceType: file.mimeType?.startsWith("image/") ? "image" : "raw",
    format: file.extension,
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    stream.on("data", (chunk) => {
      size += chunk.length;
      if (size > fileStorageService.MAX_FILE_SIZE_BYTES) {
        stream.destroy();
        reject(new AppError("File is too large to analyze.", 413));
        return;
      }
      chunks.push(chunk);
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", () => reject(new AppError("File could not be retrieved from storage.", 502)));
  });
};

const extractPdfText = async (buffer) => {
  const doc = new PDFParse({ data: buffer });
  try {
    const result = await doc.getText();
    const pages = (result.pages || []).map((page, index) => ({
      page: index + 1,
      text: page.text || "",
    }));
    return {
      text: pages.map((page) => page.text).join("\n\n"),
      pages,
      pageCount: result.total || pages.length,
    };
  } finally {
    doc.destroy().catch(() => {});
  }
};

const extractDocxText = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value || "", pages: [], pageCount: null };
};

const extractTxtText = async (buffer) => ({
  text: buffer.toString("utf8"),
  pages: [],
  pageCount: null,
});

const truncateText = (text, pages) => {
  if (text.length <= MAX_TEXT_CHARS) return { text, truncated: false };

  let cut = text.slice(0, MAX_TEXT_CHARS);
  // Prefer cutting on a paragraph/page boundary when page info is available
  if (pages.length) {
    let consumed = 0;
    for (const page of pages) {
      consumed += page.text.length + 2;
      if (consumed > MAX_TEXT_CHARS) break;
      cut = pages.slice(0, pages.indexOf(page) + 1).map((p) => p.text).join("\n\n");
    }
  } else {
    const paragraphBreak = cut.lastIndexOf("\n\n");
    if (paragraphBreak > MAX_TEXT_CHARS * 0.5) cut = cut.slice(0, paragraphBreak);
  }
  return { text: cut, truncated: true };
};

// Extracts normalized plain text (plus real page data when available) from a
// file record the caller has already verified ownership for.
const extractDocumentText = async (file) => {
  const buffer = await retrieveFileBuffer(file);

  let extracted;
  if (file.mimeType === "application/pdf") {
    extracted = await extractPdfText(buffer);
  } else if (
    file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    extracted = await extractDocxText(buffer);
  } else {
    extracted = await extractTxtText(buffer);
  }

  const normalized = extracted.text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length < 10) {
    throw new AppError("This document doesn't contain enough readable text for AI analysis yet.", 422);
  }

  const { text, truncated } = truncateText(normalized, extracted.pages);

  logger.info(
    {
      event: "ai_text_extracted",
      fileId: file._id,
      mime: file.mimeType,
      chars: text.length,
      truncated,
      pages: extracted.pageCount,
    },
    "Document text extracted for AI"
  );

  return { text, truncated, pageCount: extracted.pageCount };
};

module.exports = {
  AI_SUPPORTED_MIME,
  AI_UNSUPPORTED_MESSAGE,
  MAX_TEXT_CHARS,
  isAiSupported,
  extractDocumentText,
};
