const env = require("../config/env");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");

// OpenAI-compatible chat-completions abstraction. Configure through:
//   AI_API_KEY  — provider API key (required for live responses)
//   AI_MODEL    — model name (default: gpt-4o-mini)
//   AI_BASE_URL — provider base URL (default: https://api.openai.com/v1)
// Works with any OpenAI-compatible provider (OpenAI, Groq, OpenRouter, local gateways).

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `You are an assistant analyzing a user's private document.
Answer questions using only the document content provided.
If the answer cannot be found in the document, clearly say that the information is not available in the document.
Do not invent facts.`;

const isConfigured = () => Boolean(env.AI_API_KEY);

// messages: [{ role: "user" | "assistant", content }] — recent conversation context
const askAboutDocument = async ({ documentText, documentName, truncated, messages = [] }) => {
  if (!isConfigured()) {
    throw new AppError("AI is not configured on this server. Ask the administrator to set AI_API_KEY.", 503);
  }

  const contextNotice = truncated
    ? "\n\nNote: this document was very long; only the first portion could be included. If the answer may be in a later part, say so."
    : "";

  const chatMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze the document "${documentName}". Its content is between the markers.\n\n<<<DOCUMENT START>>>${contextNotice}\n${documentText}\n<<<DOCUMENT END>>>`,
    },
    ...messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-6)
      .map((message) => ({ role: message.role, content: String(message.content).slice(0, 2000) })),
  ];

  let response;
  try {
    response = await fetch(`${env.AI_BASE_URL || DEFAULT_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL || DEFAULT_MODEL,
        messages: chatMessages,
        temperature: 0.2,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logger.error({ err: error.message, event: "ai_request_failed" }, "AI provider request failed");
    throw new AppError("The AI service could not be reached. Please try again later.", 502);
  }

  if (!response.ok) {
    // Log safe metadata only — never provider error bodies (they may echo request content)
    logger.error(
      { event: "ai_provider_error", status: response.status },
      "AI provider returned an error"
    );
    throw new AppError("The AI service returned an error. Please try again later.", 502);
  }

  const data = await response.json().catch(() => null);
  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new AppError("The AI service returned an empty response. Please try again.", 502);
  }

  return { answer };
};

module.exports = { isConfigured, askAboutDocument, SYSTEM_PROMPT };
