import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { loginUser, setAuthToken } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const response = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const { accessToken } = response.data;
      setAuthToken(accessToken);

      toast.success("Signed in successfully.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to sign you in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 text-[var(--cv-text)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-2 text-sm font-medium text-[var(--cv-text-muted)] transition hover:text-[var(--cv-text)]"
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>
      </div>
      <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-8 rounded-[36px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)]/80 p-4 shadow-[0_20px_80px_var(--cv-shadow)] backdrop-blur lg:flex-row lg:p-8">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 rounded-[28px] bg-[var(--cv-surface)] p-8 lg:p-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-2 text-sm font-medium text-[var(--cv-text-muted)]">
            <Sparkles size={16} className="text-[#8c3d3d]" />
            Welcome back to CloudVault
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-[var(--cv-text)] sm:text-5xl">
            Sign in to pick up where you left off.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--cv-text-muted)]">
            Continue organizing your files, sharing work securely, and keeping every project in one
            calm workspace.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Secure access to your files",
              "Simple sharing for clients and teammates",
              "A polished workspace that stays easy to use",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-3 text-sm text-[var(--cv-text-muted)]"
              >
                <ShieldCheck size={16} className="text-[#8c3d3d]" />
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="flex-1 rounded-[28px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cv-text-muted)]">
                Sign in
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--cv-text)]">Access your workspace</h2>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] p-2 text-[#8c3d3d]">
              <Lock size={18} />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--cv-text-muted)]">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3 text-sm text-[var(--cv-text)] outline-none transition focus:border-[#8c3d3d] focus:bg-[var(--cv-surface-card)]"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--cv-text-muted)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3 pr-12 text-sm text-[var(--cv-text)] outline-none transition focus:border-[#8c3d3d] focus:bg-[var(--cv-surface-card)]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--cv-text-muted)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f1d1d] px-5 py-3 text-sm font-semibold text-[#f7efe6] transition hover:bg-[#3f2626] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Continue to dashboard"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-6 text-sm text-[var(--cv-text-muted)]">
            <Link
              to="/forgot-password"
              className="font-semibold text-[#8c3d3d] transition hover:text-[#6f2d2d]"
            >
              Forgot Password?
            </Link>
          </p>
          <p className="mt-3 text-sm text-[var(--cv-text-muted)]">
            New here?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#8c3d3d] transition hover:text-[#6f2d2d]"
            >
              Create an account
            </Link>
          </p>
        </motion.section>
      </div>
    </main>
  );
}

export default Login;
