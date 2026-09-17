import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileImage, FileText, FolderOpen, HardDrive, UserRound } from "lucide-react";

import {
  clearAuthToken,
  getFileStats,
  getCurrentUser,
  logoutUser,
  setAuthToken,
} from "../services/api";
import FileManager from "../components/files/FileManager";
import ThemeToggle from "../components/ThemeToggle";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const emptyStats = {
  totalFiles: 0,
  storageUsed: 0,
  pdfFiles: 0,
  imageFiles: 0,
  otherFiles: 0,
};

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    const handleSessionExpiry = () => navigate("/login", { replace: true });
    window.addEventListener("cloudvault:session-expired", handleSessionExpiry);

    let ignore = false;
    const startLoading = async () => {
      try {
        const [userResponse, statsResponse] = await Promise.all([
          getCurrentUser(),
          getFileStats(),
        ]);
        if (!ignore) {
          setUser(userResponse.data.user);
          setStats(statsResponse.data.stats);
        }
      } catch {
        if (!ignore) {
          clearAuthToken();
          navigate("/login", { replace: true });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    startLoading();

    return () => {
      ignore = true;
      window.removeEventListener("cloudvault:session-expired", handleSessionExpiry);
    };
  }, [navigate, refreshKey]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      clearAuthToken();
      setAuthToken(null);
      navigate("/login", { replace: true });
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-10 text-[var(--cv-text-muted)]">
        Loading your workspace...
      </main>
    );
  }

  const statCards = [
    { label: "Total Files", value: String(stats.totalFiles), icon: FolderOpen },
    {
      label: "Storage Used",
      value: `${formatBytes(stats.storageUsed)} / ${formatBytes(user?.storageLimit || 0)}`,
      icon: HardDrive,
    },
    { label: "PDF Files", value: String(stats.pdfFiles), icon: FileText },
    { label: "Image Files", value: String(stats.imageFiles), icon: FileImage },
    { label: "Other Files", value: String(stats.otherFiles), icon: FolderOpen },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--cv-text)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-4 rounded-[28px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-6 shadow-[0_10px_40px_var(--cv-shadow)] sm:p-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-[var(--cv-text-muted)]">Welcome back</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              {user?.fullName || "Your workspace"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--cv-text)] transition hover:bg-[var(--muted)]"
            >
              <UserRound size={16} />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              Sign out
            </button>
          </div>
        </motion.div>

        {/* Storage statistics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {statCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-4"
            >
              <div className="flex items-center gap-2 text-[var(--cv-brand)]">
                <Icon size={16} />
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-text-muted)]">
                  {label}
                </p>
              </div>
              <p className="mt-2 break-words text-lg font-semibold text-[var(--cv-text)] sm:text-xl">
                {value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Files & folders */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-6 rounded-[28px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-5 shadow-[0_10px_40px_var(--cv-shadow)] sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
              <FolderOpen size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--cv-text)]">Your files</p>
              <p className="text-sm text-[var(--cv-text-muted)]">
                Organize with folders, upload, preview, download and manage everything.
              </p>
            </div>
          </div>

          <FileManager onChanged={refreshData} />
        </motion.section>
      </div>
    </main>
  );
}

export default Dashboard;
