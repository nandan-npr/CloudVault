import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { File as FileIcon, Folder, Loader2, RotateCcw, Trash2 } from "lucide-react";
import {
  emptyRecycleBin,
  listRecycleBin,
  permanentlyDeleteFile,
  permanentlyDeleteFolder,
  restoreFile,
  restoreFolder,
} from "../../services/api";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

function RecycleBin({ onChanged }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listRecycleBin();
      setFolders(response.data.folders);
      setFiles(response.data.files);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load the Recycle Bin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the fetch's setState calls don't run synchronously in the effect body
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const term = search.trim().toLowerCase();
  const visibleFolders = term
    ? folders.filter((folder) => folder.name.toLowerCase().includes(term))
    : folders;
  const visibleFiles = term
    ? files.filter((file) => file.originalName.toLowerCase().includes(term))
    : files;
  const isEmpty = visibleFolders.length === 0 && visibleFiles.length === 0;

  const handleRestoreFolder = async (folder) => {
    setBusyId(folder.id);
    try {
      await restoreFolder(folder.id);
      toast.success(`Folder "${folder.name}" restored.`);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Restore failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentFolder = async (folder) => {
    if (
      !window.confirm(
        `Permanently delete "${folder.name}" and everything inside it? This cannot be undone.`
      )
    )
      return;
    setBusyId(folder.id);
    try {
      await permanentlyDeleteFolder(folder.id);
      toast.success(`Folder "${folder.name}" permanently deleted.`);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Permanent delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRestoreFile = async (file) => {
    setBusyId(file.id);
    try {
      await restoreFile(file.id);
      toast.success(`File "${file.originalName}" restored.`);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Restore failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentFile = async (file) => {
    if (!window.confirm(`Permanently delete "${file.originalName}"? This cannot be undone.`)) return;
    setBusyId(file.id);
    try {
      await permanentlyDeleteFile(file.id);
      toast.success(`File "${file.originalName}" permanently deleted.`);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Permanent delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleEmpty = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete all items in the Recycle Bin? This cannot be undone."
      )
    )
      return;
    setBusyId("__empty__");
    try {
      await emptyRecycleBin();
      toast.success("Recycle Bin emptied.");
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not empty the Recycle Bin.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search deleted items..."
          aria-label="Search deleted items"
          className="w-full rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-sm text-[var(--cv-text)] outline-none transition focus:border-[var(--cv-brand)] sm:max-w-xs"
        />
        <div className="flex-1" />
        {folders.length + files.length > 0 && (
          <button
            onClick={handleEmpty}
            disabled={busyId === "__empty__"}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
          >
            {busyId === "__empty__" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Empty Recycle Bin
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[var(--cv-text-muted)]">Loading Recycle Bin...</p>
      ) : isEmpty ? (
        <p className="py-8 text-center text-sm text-[var(--cv-text-muted)]">
          {term ? "No deleted items match your search." : "The Recycle Bin is empty."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {visibleFolders.map((folder) => (
            <li
              key={folder.id}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
                  <Folder size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--cv-text)]">
                    {folder.name}
                  </p>
                  <p className="text-xs text-[var(--cv-text-muted)]">
                    Folder &middot; deleted {formatDate(folder.deletedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => handleRestoreFolder(folder)}
                  disabled={busyId === folder.id}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--cv-text-muted)] transition hover:bg-[var(--muted)] hover:text-[var(--cv-text)] disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentFolder(folder)}
                  disabled={busyId === folder.id}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--cv-text-muted)] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
                >
                  {busyId === folder.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete Permanently
                </button>
              </div>
            </li>
          ))}
          {visibleFiles.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
                  <FileIcon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--cv-text)]">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-[var(--cv-text-muted)]">
                    {formatBytes(file.size)} &middot; deleted {formatDate(file.deletedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => handleRestoreFile(file)}
                  disabled={busyId === file.id}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--cv-text-muted)] transition hover:bg-[var(--muted)] hover:text-[var(--cv-text)] disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentFile(file)}
                  disabled={busyId === file.id}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--cv-text-muted)] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
                >
                  {busyId === file.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete Permanently
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecycleBin;
