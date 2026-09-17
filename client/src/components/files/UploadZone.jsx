import { useRef, useState } from "react";
import { toast } from "sonner";
import { CloudUpload, Loader2 } from "lucide-react";
import { uploadFile } from "../../services/api";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function UploadZone({ onUploaded, folderId }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;

    if (!ALLOWED_MIME.has(file.type)) {
      toast.error("Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 50 MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append("files", file);
    if (folderId) formData.append("folderId", folderId);

    try {
      const response = await uploadFile(formData, (progressEvent) => {
        if (progressEvent.total) {
          setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        }
      });
      toast.success(`Uploaded "${response.data.file.originalName}".`);
      onUploaded?.(response.data.file);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-6 text-center transition hover:border-stone-400 hover:bg-white"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleSelect}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={22} className="animate-spin text-[#8c3d3d]" />
          <p className="text-sm font-medium text-stone-700">Uploading... {progress}%</p>
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-[#8c3d3d] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <CloudUpload size={22} className="text-[#8c3d3d]" />
          <p className="text-sm font-medium text-stone-700">Choose a file to upload</p>
          <p className="text-xs text-stone-500">
            PDF, DOC, DOCX, JPG, JPEG, PNG &middot; up to 50 MB
          </p>
        </div>
      )}
    </div>
  );
}

export default UploadZone;
