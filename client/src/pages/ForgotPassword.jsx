import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { requestPasswordReset } from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await requestPasswordReset({ email: email.trim().toLowerCase() });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to request a password reset right now.");
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
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">Reset your password</h1>
        <p className="mt-3 text-stone-600">
          Enter your email and we will send a time-limited reset link.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            Email address
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#8c3d3d] focus:bg-white"
            />
          </label>
          <button
            disabled={loading}
            className="w-full rounded-full bg-[#2f1d1d] px-5 py-3 text-sm font-semibold text-[#f7efe6] disabled:opacity-70"
          >
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-[#8c3d3d]">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

export default ForgotPassword;
