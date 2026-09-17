import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { chatWithFile } from "../../services/api";

const STARTER_PROMPTS = [
  "Summarize this document",
  "What are the main points?",
  "What important information is in this file?",
  "List the key details",
];

const AI_SUPPORTED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

// "✨ Ask AI" workspace — a per-file chat backed by POST /api/ai/files/:fileId/chat.
// History is session-only (kept in component state) and the last few turns are
// sent as conversation context.
function AiChatModal({ file, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!file) return null;

  const supported = AI_SUPPORTED.has(file.mimeType);

  const send = async (rawMessage) => {
    const message = String(rawMessage || "").trim();
    if (!message || sending) return;

    const userMessage = { role: "user", content: message };
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const response = await chatWithFile(file.id, { message, history });
      setMessages((prev) => [...prev, { role: "assistant", content: response.data.answer }]);
    } catch (err) {
      const apiMessage =
        err.response?.data?.message || "The AI service could not be reached. Please try again later.";
      setError(apiMessage);
      toast.error(apiMessage);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    send(input);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
      onClick={() => !sending && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Ask AI about ${file.originalName}`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex h-[85vh] max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--cv-border)] px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 rounded-xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cv-text)]">
                Ask AI
              </p>
              <p className="truncate text-xs text-[var(--cv-text-muted)]">{file.originalName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="rounded-full p-1.5 text-[var(--cv-text-muted)] transition hover:bg-[var(--cv-surface)] hover:text-[var(--cv-text)] disabled:opacity-40"
            aria-label="Close AI chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {messages.length === 0 && !error && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-2xl bg-[var(--muted)] p-3 text-[var(--cv-brand)]">
                <Sparkles size={22} />
              </div>
              <p className="text-sm font-medium text-[var(--cv-text)]">
                Ask me anything about this document.
              </p>
              {supported ? (
                <div className="flex max-w-md flex-wrap justify-center gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3.5 py-2 text-xs font-medium text-[var(--cv-text-muted)] transition hover:border-[var(--cv-brand)] hover:text-[var(--cv-text)]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="max-w-sm text-sm text-[var(--cv-text-muted)]">
                  This file type cannot be analyzed by AI yet. Supported types: PDF, DOCX and TXT.
                </p>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-[var(--muted)] p-1.5 text-[var(--cv-brand)]">
                  <Sparkles size={14} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text)]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-[var(--muted)] p-1.5 text-[var(--cv-brand)]">
                <Sparkles size={14} />
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3.5 py-2.5 text-sm text-[var(--cv-text-muted)]">
                <Loader2 size={14} className="animate-spin" />
                AI is analyzing the document...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-[var(--cv-border)] px-3 py-3 sm:px-4"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              supported ? "Ask about this document..." : "This file type cannot be analyzed by AI yet."
            }
            disabled={!supported || sending}
            maxLength={2000}
            className="min-w-0 flex-1 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2.5 text-sm text-[var(--cv-text)] outline-none transition focus:border-[var(--cv-brand)] disabled:opacity-50"
            aria-label="Ask something about this file"
          />
          <button
            type="submit"
            disabled={!supported || sending || !input.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-40"
            aria-label="Send question"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AiChatModal;
