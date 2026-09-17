import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Folder, FolderOpen, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getFolderTree, moveFiles, moveFolder } from "../../services/api";

// Folder-selection dialog used by both "Move file(s)" and "Move folder".
// The user can navigate into folders and pick a destination with "Move Here".
function MoveModal({ fileIds, folder, onClose, onMoved }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentId, setCurrentId] = useState(null); // null = My Files (root)

  const isFileMove = Array.isArray(fileIds) && fileIds.length > 0;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    getFolderTree()
      .then((response) => setTree(response.data.folders))
      .catch(() => toast.error("Could not load your folders."))
      .finally(() => setLoading(false));
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Build the navigation path from root to the currently browsed folder
  const trail = useMemo(() => {
    const byId = new Map(tree.map((item) => [item.id, item]));
    const path = [];
    let current = currentId;
    const seen = new Set();
    while (current && !seen.has(current)) {
      seen.add(current);
      const node = byId.get(current);
      if (!node) break;
      path.unshift(node);
      current = node.parentFolderId;
    }
    return path;
  }, [tree, currentId]);

  const childFolders = useMemo(
    () => tree.filter((item) => (item.parentFolderId || null) === currentId),
    [tree, currentId]
  );

  // Descendants of the folder being moved are invalid destinations (server re-validates)
  const invalidTargetIds = useMemo(() => {
    if (isFileMove) return new Set();
    const blocked = new Set([folder.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of tree) {
        const parent = item.parentFolderId || null;
        if (!blocked.has(item.id) && parent && blocked.has(parent)) {
          blocked.add(item.id);
          changed = true;
        }
      }
    }
    return blocked;
  }, [tree, folder, isFileMove]);

  const handleMoveHere = async () => {
    setBusy(true);
    try {
      if (isFileMove) {
        await moveFiles({ fileIds, targetFolderId: currentId });
      } else {
        await moveFolder(folder.id, { targetFolderId: currentId });
      }
      toast.success("Moved successfully.");
      onMoved();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Move failed.");
    } finally {
      setBusy(false);
    }
  };

  const movingLabel = isFileMove
    ? `Move ${fileIds.length} file${fileIds.length === 1 ? "" : "s"}`
    : `Move "${folder?.name}"`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={movingLabel}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] shadow-2xl"
      >
        <div className="border-b border-[var(--cv-border)] px-5 py-3">
          <p className="text-sm font-semibold text-[var(--cv-text)]">{movingLabel}</p>
        </div>

        <div className="min-h-[40vh] flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-[var(--cv-text-muted)]">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : (
            <>
              {/* Breadcrumb path */}
              <div className="mb-3 flex flex-wrap items-center gap-1 text-sm">
                <button
                  onClick={() => setCurrentId(null)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
                    currentId === null
                      ? "bg-[var(--muted)] text-[var(--cv-text)]"
                      : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                  }`}
                >
                  <Home size={14} />
                  My Files
                </button>
                {trail.map((node) => (
                  <span key={node.id} className="flex items-center gap-1">
                    <ChevronRight size={13} className="text-[var(--cv-text-muted)]" />
                    <button
                      onClick={() => setCurrentId(node.id)}
                      className={`rounded-lg px-2 py-1 transition ${
                        currentId === node.id
                          ? "bg-[var(--muted)] font-medium text-[var(--cv-text)]"
                          : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                      }`}
                    >
                      {node.name}
                    </button>
                  </span>
                ))}
              </div>

              <ul className="space-y-1">
                {childFolders.length === 0 && (
                  <li className="rounded-xl px-3 py-4 text-center text-sm text-[var(--cv-text-muted)]">
                    No subfolders here.
                  </li>
                )}
                {childFolders.map((item) => {
                  const disabled = invalidTargetIds.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => !disabled && setCurrentId(item.id)}
                        disabled={disabled}
                        className="flex w-full items-center gap-2 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2.5 text-left text-sm font-medium text-[var(--cv-text)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Folder size={16} className="text-[var(--cv-brand)]" />
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                        <ChevronRight size={14} className="text-[var(--cv-text-muted)]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--cv-border)] px-5 py-3">
          <p className="flex items-center gap-1.5 text-xs text-[var(--cv-text-muted)]">
            <FolderOpen size={13} />
            Destination: My Files{trail.length > 0 && ` / ${trail.map((node) => node.name).join(" / ")}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-[var(--cv-border)] px-4 py-2 text-sm font-medium text-[var(--cv-text-muted)] transition hover:text-[var(--cv-text)]"
            >
              Cancel
            </button>
            <button
              onClick={handleMoveHere}
              disabled={busy || loading}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-70"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Move Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;
