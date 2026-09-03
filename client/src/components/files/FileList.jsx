import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Trash2 } from "lucide-react";
import { deleteFile, downloadFile, listFiles } from "../../services/api";

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

function FileList({ onChanged }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let ignore = false;
    const startLoading = async () => {
      try {
        const response = await listFiles();
        if (!ignore) setFiles(response.data.files);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load files.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    startLoading();

    return () => {
      ignore = true;
    };
  }, []);

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
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return;

    setDeletingId(file.id);
    try {
      await deleteFile(file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      toast.success(`Deleted "${file.originalName}".`);
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="py-6 text-center text-sm text-stone-500">Loading your files...</p>;
  }

  if (files.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-stone-500">
        No files yet. Upload your first file above.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{file.originalName}</p>
            <p className="text-xs text-stone-500">
              {formatBytes(file.size)} &middot; {file.mimeType} &middot;{" "}
              {formatDate(file.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => handleDownload(file)}
              className="rounded-xl p-2 text-stone-600 transition hover:bg-stone-100"
              aria-label={`Download ${file.originalName}`}
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => handleDelete(file)}
              disabled={deletingId === file.id}
              className="rounded-xl p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
      ))}
    </ul>
  );
}

export default FileList;
