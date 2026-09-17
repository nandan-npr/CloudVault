import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  FolderInput,
  FolderPlus,
  FolderSymlink,
  Home,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  deleteFolder,
  getFolder,
  listFolders,
} from "../../services/api";
import { NewFolderModal, RenameFolderModal } from "./FolderModals";
import MoveModal from "./MoveModal";
import RecycleBin from "./RecycleBin";
import FileList from "./FileList";

function FileManager({ onChanged }) {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [view, setView] = useState("files"); // "files" | "recycle"
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [movingFolder, setMovingFolder] = useState(null);
  const [contentKey, setContentKey] = useState(0);

  const refreshFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const response = await listFolders(currentFolderId);
      setFolders(response.data.folders);

      if (currentFolderId) {
        const details = await getFolder(currentFolderId);
        setBreadcrumb(details.data.folder.breadcrumb);
      } else {
        setBreadcrumb([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load folders.");
    } finally {
      setLoadingFolders(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    // Deferred so the fetch's setState calls don't run synchronously in the effect body
    const timer = setTimeout(refreshFolders, 0);
    return () => clearTimeout(timer);
  }, [refreshFolders]);

  const refreshAll = useCallback(() => {
    refreshFolders();
    setContentKey((key) => key + 1);
    onChanged?.();
  }, [refreshFolders, onChanged]);

  const openFolder = (folderId) => {
    setCurrentFolderId(folderId);
    setView("files");
  };

  const handleDeleteFolder = async (folder) => {
    if (
      !window.confirm(
        `Move "${folder.name}" and everything inside it to the Recycle Bin?`
      )
    )
      return;
    try {
      await deleteFolder(folder.id);
      toast.success(`Folder "${folder.name}" moved to the Recycle Bin.`);
      refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete the folder.");
    }
  };

  return (
    <div>
      {/* Toolbar: breadcrumbs + tabs + New Folder */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Folder breadcrumbs"
            className="flex flex-wrap items-center gap-1 text-sm"
          >
            <button
              onClick={() => openFolder(null)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                currentFolderId === null
                  ? "bg-[var(--muted)] text-[var(--cv-text)]"
                  : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
              }`}
            >
              <Home size={15} />
              My Files
            </button>
            {breadcrumb.map((node, index) => (
              <span key={node.id} className="flex items-center gap-1">
                <ChevronRight size={13} className="text-[var(--cv-text-muted)]" />
                <button
                  onClick={() => openFolder(node.id)}
                  className={`max-w-[10rem] truncate rounded-lg px-2.5 py-1.5 transition ${
                    index === breadcrumb.length - 1
                      ? "bg-[var(--muted)] font-semibold text-[var(--cv-text)]"
                      : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                  }`}
                >
                  {node.name}
                </button>
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("files")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                view === "files"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border border-[var(--cv-border)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
              }`}
            >
              My Files
            </button>
            <button
              onClick={() => setView("recycle")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                view === "recycle"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border border-[var(--cv-border)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
              }`}
            >
              <Trash2 size={14} />
              Recycle Bin
            </button>
            {view === "files" && (
              <button
                onClick={() => setShowNewFolder(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
              >
                <FolderPlus size={15} />
                New Folder
              </button>
            )}
          </div>
        </div>
      </div>

      {view === "recycle" ? (
        <RecycleBin onChanged={onChanged} />
      ) : (
        <>
          {/* Folders */}
          {loadingFolders ? (
            <div className="flex items-center justify-center py-6 text-[var(--cv-text-muted)]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : folders.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-4 transition hover:border-[var(--cv-brand)]"
                >
                  <button
                    onClick={() => openFolder(folder.id)}
                    className="flex w-full items-center gap-3 text-left"
                    aria-label={`Open folder ${folder.name}`}
                  >
                    <div className="shrink-0 rounded-xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
                      <FolderInput size={18} />
                    </div>
                    <p className="min-w-0 flex-1 truncate pr-16 text-sm font-semibold text-[var(--cv-text)]">
                      {folder.name}
                    </p>
                  </button>
                  <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={() => setRenamingFolder(folder)}
                      className="rounded-lg p-1.5 text-[var(--cv-text-muted)] transition hover:bg-[var(--muted)] hover:text-[var(--cv-text)]"
                      aria-label={`Rename ${folder.name}`}
                      title="Rename"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setMovingFolder(folder)}
                      className="rounded-lg p-1.5 text-[var(--cv-text-muted)] transition hover:bg-[var(--muted)] hover:text-[var(--cv-text)]"
                      aria-label={`Move ${folder.name}`}
                      title="Move"
                    >
                      <FolderSymlink size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder)}
                      className="rounded-lg p-1.5 text-[var(--cv-text-muted)] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      aria-label={`Delete ${folder.name}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Files of the current folder (upload included) */}
          <FileList
            key={`${currentFolderId}-${contentKey}`}
            folderId={currentFolderId}
            onChanged={refreshAll}
            showUpload={!loadingFolders}
          />
        </>
      )}

      {showNewFolder && (
        <NewFolderModal
          parentFolderId={currentFolderId}
          onCreated={refreshAll}
          onClose={() => setShowNewFolder(false)}
        />
      )}
      {renamingFolder && (
        <RenameFolderModal
          folder={renamingFolder}
          onRenamed={refreshAll}
          onClose={() => setRenamingFolder(null)}
        />
      )}
      {movingFolder && (
        <MoveModal
          folder={movingFolder}
          onMoved={refreshAll}
          onClose={() => setMovingFolder(null)}
        />
      )}
    </div>
  );
}

export default FileManager;
