import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  File as FileIcon,
  FileImage,
  FileText,
  Loader2,
  MoveRight,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { deleteFile, downloadFile, listFiles } from "../../services/api";
import AiChatModal from "./AiChatModal";
import FilePreviewModal from "./FilePreviewModal";
import UploadZone from "./UploadZone";
import MoveModal from "./MoveModal";

const PAGE_SIZE = 10;

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "originalName", label: "Name A–Z" },
  { value: "-originalName", label: "Name Z–A" },
  { value: "-fileSize", label: "Largest first" },
  { value: "fileSize", label: "Smallest first" },
];

const SIZE_OPTIONS = [
  { value: "all", label: "Any size" },
  { value: "small", label: "Under 1 MB", minSize: 0, maxSize: 1024 * 1024 - 1 },
  { value: "medium", label: "1 MB – 10 MB", minSize: 1024 * 1024, maxSize: 10 * 1024 * 1024 - 1 },
  { value: "large", label: "Over 10 MB", minSize: 10 * 1024 * 1024 },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Images" },
  { value: "other", label: "Other" },
];

const AI_SUPPORTED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const typeIcon = (mimeType) => {
  if (mimeType === "application/pdf") return FileText;
  if (mimeType?.startsWith("image/")) return FileImage;
  return FileIcon;
};

const initialFilters = {
  search: "",
  type: "all",
  year: "",
  month: "",
  date: "",
  size: "all",
  sort: "-createdAt",
};

function FileList({ folderId, onChanged, showUpload = false }) {
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [previewFileItem, setPreviewFileItem] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [movingIds, setMovingIds] = useState(null); // null | array of file ids
  const [aiFile, setAiFile] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const isFiltered =
    debouncedSearch !== "" ||
    filters.type !== "all" ||
    filters.year !== "" ||
    filters.month !== "" ||
    filters.date !== "" ||
    filters.size !== "all";

  const queryParams = useMemo(() => {
    const sizeOption = SIZE_OPTIONS.find((option) => option.value === filters.size);
    const params = { page, limit: PAGE_SIZE, sort: filters.sort };
    // Server contract: folder=root lists only files outside folders; omit = all active files
    params.folder = folderId || "root";
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.type !== "all") params.type = filters.type;
    if (filters.year) params.year = filters.year;
    if (filters.month) params.month = filters.month;
    if (filters.date) params.date = filters.date;
    if (sizeOption?.minSize !== undefined) params.minSize = sizeOption.minSize;
    if (sizeOption?.maxSize !== undefined) params.maxSize = sizeOption.maxSize;
    return params;
  }, [page, filters, debouncedSearch, folderId]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listFiles(queryParams);
      setFiles(response.data.files);
      setTotal(response.data.total);
      setSelected(new Set());
      if (response.data.files.length === 0 && response.data.total > 0 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load files.");
    } finally {
      setLoading(false);
    }
  }, [queryParams, page]);

  useEffect(() => {
    // Deferred so the fetch's setState calls don't run synchronously in the effect body
    const timer = setTimeout(fetchFiles, 0);
    return () => clearTimeout(timer);
  }, [fetchFiles]);

  const updateFilter = (name, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(initialFilters);
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === files.length ? new Set() : new Set(files.map((f) => f.id))));
  };

  const handleDownload = async (file) => {
    try {
      const response = await downloadFile(file.id);
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Download failed.");
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Move "${file.originalName}" to the Recycle Bin?`)) return;

    setDeletingId(file.id);
    try {
      await deleteFile(file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setTotal((current) => Math.max(0, current - 1));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
      toast.success(`"${file.originalName}" moved to the Recycle Bin.`);
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!window.confirm(`Move ${ids.length} selected file${ids.length === 1 ? "" : "s"} to the Recycle Bin?`))
      return;
    for (const id of ids) {
      try {
        await deleteFile(id);
      } catch (error) {
        toast.error(error.response?.data?.message || `Failed to delete a file.`);
      }
    }
    toast.success(`Moved ${ids.length} file${ids.length === 1 ? "" : "s"} to the Recycle Bin.`);
    setSelected(new Set());
    await fetchFiles();
    onChanged?.();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const controlClass =
    "rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-sm text-[var(--cv-text)] outline-none transition focus:border-[var(--cv-brand)]";

  return (
    <div>
      {showUpload && <UploadZone onUploaded={onChanged} folderId={folderId} />}

      {/* Search + sort */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cv-text-muted)]"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search by file name..."
            aria-label="Search files by name"
            className={`${controlClass} w-full pl-9`}
          />
        </div>
        <select
          value={filters.sort}
          onChange={(event) => updateFilter("sort", event.target.value)}
          aria-label="Sort files"
          className={controlClass}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={filters.type}
          onChange={(event) => updateFilter("type", event.target.value)}
          aria-label="Filter by file type"
          className={controlClass}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1970}
          max={3000}
          value={filters.year}
          onChange={(event) => updateFilter("year", event.target.value)}
          placeholder="Year"
          aria-label="Filter by year"
          className={`${controlClass} w-24`}
        />
        <select
          value={filters.month}
          onChange={(event) => updateFilter("month", event.target.value)}
          aria-label="Filter by month"
          className={controlClass}
        >
          <option value="">Any month</option>
          {MONTHS.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(event) => updateFilter("date", event.target.value)}
          aria-label="Filter by date"
          className={controlClass}
        />
        <select
          value={filters.size}
          onChange={(event) => updateFilter("size", event.target.value)}
          aria-label="Filter by size"
          className={controlClass}
        >
          {SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isFiltered && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cv-border)] px-3 py-2 text-sm font-medium text-[var(--cv-text-muted)] transition hover:text-[var(--cv-text)]"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk selection toolbar */}
      {selected.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2">
          <span className="text-sm font-medium text-[var(--cv-text)]">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setMovingIds([...selected])}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-[var(--cv-text)] transition hover:bg-[var(--muted)]"
          >
            <MoveRight size={14} />
            Move
          </button>
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="py-8 text-center text-sm text-[var(--cv-text-muted)]">Loading your files...</p>
      ) : files.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--cv-text-muted)]">
          {isFiltered
            ? "No files match your search or filters."
            : "No files here yet. Upload a file or create a folder above."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 px-1 text-xs text-[var(--cv-text-muted)]">
            <input
              type="checkbox"
              checked={selected.size === files.length && files.length > 0}
              onChange={toggleSelectAll}
              aria-label="Select all files"
              className="h-4 w-4"
            />
            Select all
          </li>
          {files.map((file) => {
            const Icon = typeIcon(file.mimeType);
            const isChecked = selected.has(file.id);
            return (
              <li
                key={file.id}
                className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 transition sm:flex-row sm:items-center sm:justify-between ${
                  isChecked
                    ? "border-[var(--cv-brand)] bg-[var(--cv-surface)]"
                    : "border-[var(--cv-border)] bg-[var(--cv-surface-card)]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelected(file.id)}
                    aria-label={`Select ${file.originalName}`}
                    className="h-4 w-4 shrink-0"
                  />
                  <div className="shrink-0 rounded-xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--cv-text)]">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-[var(--cv-text-muted)]">
                      {formatBytes(file.size)} &middot; {file.mimeType} &middot;{" "}
                      {formatDate(file.uploadedAt || file.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setPreviewFileItem(file)}
                    className="rounded-xl p-2 text-[var(--cv-text-muted)] transition hover:bg-[var(--muted)] hover:text-[var(--cv-text)]"
                    aria-label={`Preview ${file.originalName}`}
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="rounded-xl p-2 text-[var(--cv-text-muted)] transition hover:bg-[var(--muted)] hover:text-[var(--cv-text)]"
                    aria-label={`Download ${file.originalName}`}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  {AI_SUPPORTED.has(file.mimeType) && (
                    <button
                      onClick={() => setAiFile(file)}
                      className="rounded-xl p-2 text-[var(--cv-brand)] transition hover:bg-[var(--muted)]"
                      aria-label={`Ask AI about ${file.originalName}`}
                      title="Ask AI"
                    >
                      <Sparkles size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setMovingIds([file.id])}
                    className="rounded-xl p-2 text-[var(--cv-text-muted)] transition hover:bg-[var(--muted)] hover:text-[var(--cv-text)]"
                    aria-label={`Move ${file.originalName}`}
                    title="Move"
                  >
                    <MoveRight size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    disabled={deletingId === file.id}
                    className="rounded-xl p-2 text-[var(--cv-text-muted)] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
                    aria-label={`Delete ${file.originalName}`}
                    title="Delete"
                  >
                    {deletingId === file.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--cv-text-muted)]">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--cv-border)] px-3 py-1.5 font-medium transition disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          <span>
            Page {page} of {totalPages} &middot; {total} file{total === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--cv-border)] px-3 py-1.5 font-medium transition disabled:opacity-40"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <FilePreviewModal file={previewFileItem} onClose={() => setPreviewFileItem(null)} />
      {aiFile && <AiChatModal file={aiFile} onClose={() => setAiFile(null)} />}
      {movingIds && (
        <MoveModal
          fileIds={movingIds}
          onMoved={async () => {
            await fetchFiles();
            onChanged?.();
          }}
          onClose={() => setMovingIds(null)}
        />
      )}
    </div>
  );
}

export default FileList;
