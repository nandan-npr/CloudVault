import { Link } from "react-router-dom";
import { Cloud } from "lucide-react";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 pb-10 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[32px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] px-6 py-8 shadow-[0_15px_50px_var(--cv-shadow)] sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#2f1d1d] p-3 text-[#f7efe6] dark:bg-[#e8a87c] dark:text-[#1a1613]">
              <Cloud size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--cv-text)]">CloudVault</p>
              <p className="text-sm text-[var(--cv-text-muted)]">
                Private cloud storage for your important files.
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-[var(--cv-text-muted)]">
            <a href="#features" className="transition hover:text-[var(--cv-text)]">
              Features
            </a>
            <Link to="/login" className="transition hover:text-[var(--cv-text)]">
              Login
            </Link>
            <Link to="/register" className="transition hover:text-[var(--cv-text)]">
              Create account
            </Link>
          </nav>
        </div>
        <div className="border-t border-[var(--cv-border)] pt-5 text-center text-sm text-[var(--cv-text-muted)] sm:text-left">
          &copy; {year} CloudVault. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
