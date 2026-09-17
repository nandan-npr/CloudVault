import { useEffect, useRef, useState } from "react";
import { FolderInput, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createFolder, renameFolder } from "../../services/api";

// Shared shell for small single-input dialogs
function PromptModal({ title, icon: Icon, label, initialValue, submitLabel, busy, onSubmit, onClose }) {
  const [value, setValue] = useState(initialValue || "");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Folder name cannot be empty.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="rounded-xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
              <Icon size={18} />
            </div>
          )}
          <h2 className="text-lg font-semibold text-[var(--cv-text)]">{title}</h2>
        </div>

        <label htmlFor="folder-name-input" className="mt-5 mb-2 block text-sm font-medium text-[var(--cv-text-muted)]">
          {label}
        </label>
        <input
          id="folder-name-input"
          ref={inputRef}
          type="text"
          maxLength={100}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3 text-sm text-[var(--cv-text)] outline-none transition focus:border-[var(--cv-brand)]"
          placeholder="Folder name"
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--cv-border)] px-4 py-2.5 text-sm font-medium text-[var(--cv-text-muted)] transition hover:text-[var(--cv-text)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-70"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function NewFolderModal({ parentFolderId, onCreated, onClose }) {
  const [busy, setBusy] = useState(false);

  const handleCreate = async (name) => {
    setBusy(true);
    try {
      const response = await createFolder({ name, parentFolderId: parentFolderId || null });
      toast.success(`Folder "${response.data.folder.name}" created.`);
      onCreated(response.data.folder);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create the folder.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PromptModal
      title="New Folder"
      icon={FolderInput}
      label="Folder name:"
      submitLabel="Create Folder"
      busy={busy}
      onSubmit={handleCreate}
      onClose={onClose}
    />
  );
}

export function RenameFolderModal({ folder, onRenamed, onClose }) {
  const [busy, setBusy] = useState(false);

  const handleRename = async (name) => {
    setBusy(true);
    try {
      const response = await renameFolder(folder.id, { name });
      toast.success("Folder renamed.");
      onRenamed(response.data.folder);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not rename the folder.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PromptModal
      title="Rename Folder"
      icon={Pencil}
      label="Folder name:"
      initialValue={folder?.name}
      submitLabel="Save"
      busy={busy}
      onSubmit={handleRename}
      onClose={onClose}
    />
  );
}
