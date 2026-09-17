import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Search, Shield, Upload } from "lucide-react";

const highlights = [
  { icon: Upload, label: "Upload files instantly" },
  { icon: Search, label: "Search and filter" },
  { icon: Lock, label: "Private by default" },
  { icon: Shield, label: "Secure storage" },
];

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center px-6 pt-28 pb-20 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-2 text-sm font-medium text-[var(--cv-text-muted)] shadow-sm"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--cv-brand)]" />
          Personal cloud storage — private, simple, powerful
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-5xl font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--cv-text)] sm:text-6xl lg:text-7xl"
        >
          CloudVault
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14 }}
          className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.02em] text-[var(--cv-text)] sm:text-4xl lg:text-5xl"
        >
          Your files.{" "}
          <span className="text-[var(--cv-brand)]">Your space.</span>{" "}
          Your control.
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[var(--cv-text-muted)]"
        >
          Securely store, organize and access your important files from anywhere.
          Create your private digital workspace for documents, images and important files.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.26 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            id="hero-create-account"
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#2f1d1d] px-7 py-3.5 text-sm font-semibold text-[#f7efe6] shadow-[0_4px_20px_rgba(47,29,29,0.18)] transition hover:bg-[#3f2626] dark:bg-[#e8a87c] dark:text-[#1a1613] dark:hover:bg-[#d4956a]"
          >
            Create Account
            <ArrowRight size={16} />
          </Link>
          <Link
            id="hero-login"
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-7 py-3.5 text-sm font-semibold text-[var(--cv-text)] transition hover:bg-[var(--cv-surface)]"
          >
            Login
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.34 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
        >
          {highlights.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-4 py-2 text-sm text-[var(--cv-text-muted)]"
            >
              <Icon size={14} className="text-[var(--cv-brand)]" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-16 h-px max-w-xs bg-gradient-to-r from-transparent via-[var(--cv-border)] to-transparent"
        />
      </div>
    </section>
  );
}

export default Hero;
