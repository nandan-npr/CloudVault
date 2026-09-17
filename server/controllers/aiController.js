const mongoose = require("mongoose");
const File = require("../models/File");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { extractDocumentText, isAiSupported, AI_UNSUPPORTED_MESSAGE } = require("../services/documentTextService");
const { askAboutDocument, isConfigured } = require("../services/aiService");

const normalizeFileQuery = (userId) => ({
  $or: [{ userId }, { owner: userId }],
});

// In-memory cache of extracted text so a multi-question chat session does not
// re-download and re-parse the document on every message. Keyed by file id +
// updatedAt so any file change invalidates it.
const CACHE_LIMIT = 20;
const extractionCache = new Map();

const getCachedExtraction = async (file) => {
  const key = `${file._id}:${file.updatedAt?.getTime() || 0}`;
  if (extractionCache.has(key)) {
    const cached = extractionCache.get(key);
    extractionCache.delete(key);
    extractionCache.set(key, cached); // refresh LRU position
    return cached;
  }

  const extracted = await extractDocumentText(file);
  extractionCache.set(key, extracted);
  if (extractionCache.size > CACHE_LIMIT) {
    const oldest = extractionCache.keys().next().value;
    extractionCache.delete(oldest);
  }
  return extracted;
};

const chatWithFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      throw new AppError("Invalid file id.", 400);
    }

    const message = String(req.body?.message || "").trim();
    if (!message) throw new AppError("Please enter a question.", 400);
    if (message.length > 2000) throw new AppError("Question is too long (2000 characters max).", 400);

    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    // Ownership + soft-delete checks — the AI never sees files outside req.user
    const file = await File.findOne({
      _id: fileId,
      ...normalizeFileQuery(req.user._id),
      isDeleted: false,
    });
    if (!file) throw new AppError("File not found.", 404);

    if (!isAiSupported(file)) {
      throw new AppError(AI_UNSUPPORTED_MESSAGE, 415);
    }

    if (!isConfigured()) {
      throw new AppError("AI is not configured on this server. Ask the administrator to set AI_API_KEY.", 503);
    }

    const { text, truncated, pageCount } = await getCachedExtraction(file);

    const { answer } = await askAboutDocument({
      documentText: text,
      documentName: file.originalName,
      truncated,
      messages: history,
    });

    logger.info(
      { event: "ai_chat_answered", userId: req.user._id, fileId: file._id, chars: text.length },
      "AI chat response delivered"
    );

    res.status(200).json({
      success: true,
      answer,
      fileId: file._id,
      truncated,
      // Real page data exists only for PDFs; never fabricate citations for DOCX/TXT
      sources: [],
      pageCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { chatWithFile };
