import { useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2, X } from "lucide-react";
import { previewFile } from "../../services/api";

const PREVIEWABLE = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);

function FilePreviewModal({ file, onClose }) {
  const [state, setState] = useState("loading");
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    let objectUrl = null;
    if (PREVIEWABLE.has(file.mimeType)) {
      previewFile(file.id)
        .then((response) => {
          objectUrl = URL.createObjectURL(new Blob([response.data], { type: file.mimeType }));
          setUrl(objectUrl);
          setState("ready");
        })
        .catch(() => setState("error"));
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, onClose]);

  if (!file) return null;

  const isImage = file.mimeType?.startsWith("image/");
  const unsupported = !PREVIEWABLE.has(file.mimeType);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${file.originalName}`}
    >
      <div
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--cv-border)] px-5 py-3">
          <p className="min-w-0 truncate text-sm font-semibold text-[var(--cv-text)]">
            {file.originalName}
          </p>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--cv-text-muted)] transition hover:bg-[var(--cv-surface)] hover:text-[var(--cv-text)]"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-[60vh] flex-1 overflow-auto bg-[var(--cv-surface)] p-4">
          {state === "loading" && (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-[var(--cv-text-muted)]">
              <Loader2 size={26} className="animate-spin" />
              <p className="text-sm">Loading preview...</p>
            </div>
          )}

          {state === "ready" && !isImage && (
            <iframe
              src={url}
              title={`Preview of ${file.originalName}`}
              className="h-[70vh] w-full rounded-xl border border-[var(--cv-border)] bg-white"
            />
          )}

          {state === "ready" && isImage && (
            <div className="flex h-[70vh] items-center justify-center">
              <img
                src={url}
                alt={file.originalName}
                className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          )}

          {unsupported && (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-[var(--cv-text-muted)]">
              <FileText size={28} />
              <p className="text-sm">
                Preview is not available for this file type. Use Download instead.
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-[var(--cv-text-muted)]">
              <AlertCircle size={28} className="text-red-500" />
              <p className="text-sm">Could not load the preview. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilePreviewModal;
