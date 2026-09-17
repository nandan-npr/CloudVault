import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Loader2, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  changePassword,
  clearAuthToken,
  getFileStats,
  getProfile,
  logoutUser,
  setAuthToken,
  updateProfile,
} from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const emptyProfile = {
  fullName: "",
  email: "",
  dateOfBirth: "",
  phone: "",
  gender: "",
  location: "",
  bio: "",
};

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [account, setAccount] = useState({ createdAt: null, totalFiles: 0, storageUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const handleSessionExpiry = () => navigate("/login", { replace: true });
    window.addEventListener("cloudvault:session-expired", handleSessionExpiry);

    let ignore = false;
    const load = async () => {
      try {
        const [profileResponse, statsResponse] = await Promise.all([
          getProfile(),
          getFileStats(),
        ]);
        if (ignore) return;
        const user = profileResponse.data.user;
        setProfile({
          fullName: user.fullName || "",
          email: user.email || "",
          dateOfBirth: user.dateOfBirth ? toInputDate(user.dateOfBirth) : "",
          phone: user.phone || "",
          gender: user.gender || "",
          location: user.location || "",
          bio: user.bio || "",
        });
        setAccount({
          createdAt: user.createdAt,
          totalFiles: statsResponse.data.stats.totalFiles,
          storageUsed: statsResponse.data.stats.storageUsed,
        });
      } catch {
        if (!ignore) {
          clearAuthToken();
          navigate("/login", { replace: true });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();

    return () => {
      ignore = true;
      window.removeEventListener("cloudvault:session-expired", handleSessionExpiry);
    };
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await updateProfile({
        fullName: profile.fullName.trim(),
        dateOfBirth: profile.dateOfBirth || null,
        phone: profile.phone.trim(),
        gender: profile.gender,
        location: profile.location.trim(),
        bio: profile.bio.trim(),
      });
      const user = response.data.user;
      setProfile((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        dateOfBirth: user.dateOfBirth ? toInputDate(user.dateOfBirth) : "",
        phone: user.phone || "",
        gender: user.gender || "",
        location: user.location || "",
        bio: user.bio || "",
      }));
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.password,
        confirmPassword: passwordForm.confirmPassword,
      });
      // Backend rotates the access token after a password change
      setAuthToken(response.data.accessToken);
      setPasswordForm({ currentPassword: "", password: "", confirmPassword: "" });
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not change your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      clearAuthToken();
      setAuthToken(null);
      navigate("/login", { replace: true });
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3 text-sm text-[var(--cv-text)] outline-none transition focus:border-[var(--cv-brand)] focus:bg-[var(--cv-surface-card)] disabled:opacity-60";
  const labelClass = "mb-2 block text-sm font-medium text-[var(--cv-text-muted)]";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-[var(--cv-text-muted)]">
        Loading your profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--cv-text)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-2 text-sm font-medium text-[var(--cv-text-muted)] transition hover:text-[var(--cv-text)]"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>
          <ThemeToggle onPersist={(theme) => updateProfile({ theme }).catch(() => {})} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-6 flex items-center gap-4 rounded-[28px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-6 shadow-[0_10px_40px_var(--cv-shadow)] sm:p-8"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--cv-brand)]">
            <UserRound size={26} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              {profile.fullName || "Your profile"}
            </h1>
            <p className="truncate text-sm text-[var(--cv-text-muted)]">{profile.email}</p>
          </div>
        </motion.div>

        {/* Account information */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-6 rounded-[28px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-6 sm:p-8"
        >
          <h2 className="text-lg font-semibold">Account information</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-text-muted)]">
                Member since
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--cv-text)]">
                {formatDate(account.createdAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-text-muted)]">
                Total files
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--cv-text)]">
                {account.totalFiles}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-text-muted)]">
                Storage used
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--cv-text)]">
                {formatBytes(account.storageUsed)}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Profile details */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 rounded-[28px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-6 sm:p-8"
        >
          <h2 className="text-lg font-semibold">Profile details</h2>
          <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  value={profile.fullName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email (read-only)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  readOnly
                  disabled
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dateOfBirth" className={labelClass}>
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
                  value={profile.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="gender" className={labelClass}>
                  Gender (optional)
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  maxLength={100}
                  value={profile.location}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className={labelClass}>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                maxLength={500}
                value={profile.bio}
                onChange={handleChange}
                className={inputClass}
                placeholder="A few words about you (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </form>
        </motion.section>

        {/* Change password */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-6 rounded-[28px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-6 sm:p-8"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--muted)] p-2 text-[var(--cv-brand)]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Change password</h2>
              <p className="text-sm text-[var(--cv-text-muted)]">
                Use at least 12 characters with upper/lowercase, a number, and a symbol.
              </p>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
            <div>
              <label htmlFor="currentPassword" className={labelClass}>
                Current password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className={labelClass}>
                  New password
                </label>
                <input
                  id="newPassword"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingPassword ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CalendarDays size={16} />
              )}
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </motion.section>

        {/* Logout */}
        <div className="mt-6 mb-4 flex justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-6 py-3 text-sm font-semibold text-[var(--cv-text)] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}

export default Profile;
