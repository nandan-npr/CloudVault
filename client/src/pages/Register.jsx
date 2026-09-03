import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Sparkles, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";

import { registerUser, setAuthToken } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      formData.password.length < 12 ||
      !/[a-z]/.test(formData.password) ||
      !/[A-Z]/.test(formData.password) ||
      !/\d/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      toast.error("Password must be 12+ characters with upper/lowercase, a number, and a symbol.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      const { accessToken } = response.data;
      setAuthToken(accessToken);

      toast.success("Account created successfully.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-10 text-[#1f1a17] sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[36px] border border-stone-200 bg-white/80 p-4 shadow-[0_20px_80px_rgba(45,32,20,0.05)] backdrop-blur lg:flex-row lg:p-8">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 rounded-[28px] bg-[#f8f3ea] p-8 lg:p-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700">
            <Sparkles size={16} className="text-[#8c3d3d]" />
            Start with a calmer way to manage files
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
            Create an account and bring structure to your work.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
            CloudVault helps you keep important documents organized, easy to share, and ready
            whenever you need them.
          </p>

          <div className="mt-8 rounded-[24px] border border-stone-200 bg-white/80 p-5 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">What you get</p>
            <ul className="mt-3 space-y-2">
              <li>â€¢ One workspace for your most important files</li>
              <li>â€¢ Clear access controls for sharing and review</li>
              <li>â€¢ A dependable place to keep work moving forward</li>
            </ul>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="flex-1 rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">
                Create account
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-stone-900">Join CloudVault</h2>
            </div>
            <div className="rounded-2xl bg-[#f1e4d4] p-2 text-[#8c3d3d]">
              <UserRoundPlus size={18} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-stone-700">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#8c3d3d] focus:bg-white"
                placeholder="Jordan Lee"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-stone-700">
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
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#8c3d3d] focus:bg-white"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 pr-12 text-sm text-stone-800 outline-none transition focus:border-[#8c3d3d] focus:bg-white"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-stone-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#8c3d3d] focus:bg-white"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f1d1d] px-5 py-3 text-sm font-semibold text-[#f7efe6] transition hover:bg-[#3f2626] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create my account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-sm text-stone-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#8c3d3d] transition hover:text-[#6f2d2d]"
            >
              Sign in
            </Link>
          </p>
        </motion.section>
      </div>
    </main>
  );
}

export default Register;
