import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { resetPassword } from "../services/api";

function ResetPassword() {
  const { token: routeToken } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const token = routeToken || new URLSearchParams(window.location.search).get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    try {
      setLoading(true);
      const response = await resetPassword({ token, password, confirmPassword });
      toast.success(response.data.message);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-6 py-10 text-[#1f1a17]">
      <section className="w-full max-w-md rounded-[28px] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">
          Account recovery
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">Choose a new password</h1>
        {!token ? (
          <p className="mt-4 text-sm text-red-700">This reset link is invalid or incomplete.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label htmlFor="password" className="block text-sm font-medium text-stone-700">
              New password
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength="12"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#8c3d3d] focus:bg-white"
              />
            </label>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700">
              Confirm new password
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength="12"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#8c3d3d] focus:bg-white"
              />
            </label>
            <button
              disabled={loading}
              className="w-full rounded-full bg-[#2f1d1d] px-5 py-3 text-sm font-semibold text-[#f7efe6] disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-[#8c3d3d]">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

export default ResetPassword;
