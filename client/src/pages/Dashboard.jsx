import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FolderOpen, LogOut, ShieldCheck, Sparkles } from "lucide-react";

import { clearAuthToken, getCurrentUser, logoutUser, setAuthToken } from "../services/api";
import UploadZone from "../components/files/UploadZone";
import FileList from "../components/files/FileList";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshUser = () => setRefreshKey((key) => key + 1);

  useEffect(() => {
    const handleSessionExpiry = () => navigate("/login", { replace: true });
    window.addEventListener("cloudvault:session-expired", handleSessionExpiry);

    let ignore = false;
    const startLoading = async () => {
      try {
        const response = await getCurrentUser();
        if (!ignore) setUser(response.data.user);
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
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-6 py-10 text-stone-700">
        Loading your workspace...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-10 text-[#1f1a17] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[36px] border border-stone-200 bg-white/80 p-6 shadow-[0_20px_80px_rgba(45,32,20,0.05)] backdrop-blur lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-6 rounded-[28px] border border-stone-200 bg-[#f8f3ea] p-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700">
              <Sparkles size={16} className="text-[#8c3d3d]" />
              Welcome back
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-stone-900">
              {user?.fullName || "Your workspace"}
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-stone-600">
              Your documents stay organized, shared securely, and ready whenever your work needs
              momentum.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#f1e4d4] p-2 text-[#8c3d3d]">
                <FolderOpen size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Your files</p>
                <p className="text-sm text-stone-500">Everything is kept in one calm place.</p>
              </div>
            </div>

            <div className="mt-6">
              <UploadZone onUploaded={refreshUser} />
              <FileList key={refreshKey} onChanged={refreshUser} />
            </div>

            <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-900">Storage overview</p>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <span>Files in your workspace</span>
                <span className="font-semibold text-stone-900">{user?.totalFiles ?? 0}</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <span>Storage used</span>
                <span className="font-semibold text-stone-900">
                  {user?.storageUsed ?? 0} / {user?.storageLimit ?? 0}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#f1e4d4] p-2 text-[#8c3d3d]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Secure access</p>
                <p className="text-sm text-stone-500">
                  Your work stays protected and easy to manage.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                "Private workspace by default",
                "Controlled sharing for reviews and approvals",
                "Reliable access across devices",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
