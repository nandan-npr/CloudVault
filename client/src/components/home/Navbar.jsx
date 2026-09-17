import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Cloud, Menu, X } from "lucide-react";

function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { title: "Home", href: "/" },
    { title: "Features", href: "#features" },
  ];

  return (
    <motion.header
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-[var(--cv-border)] bg-[var(--background)]/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#2f1d1d] p-2.5 text-[#f7efe6] shadow-[0_6px_20px_rgba(47,29,29,0.18)] dark:bg-[#e8a87c] dark:text-[#1a1613]">
            <Cloud size={18} />
          </div>
          <span className="text-base font-semibold text-[var(--cv-text)]">CloudVault</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.title}
                to={item.href}
                className="text-sm font-medium text-[var(--cv-text-muted)] transition hover:text-[var(--cv-text)]"
              >
                {item.title}
              </Link>
            ) : (
              <a
                key={item.title}
                href={item.href}
                className="text-sm font-medium text-[var(--cv-text-muted)] transition hover:text-[var(--cv-text)]"
              >
                {item.title}
              </a>
            )
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-[var(--cv-text-muted)] transition hover:bg-[var(--cv-surface)] hover:text-[var(--cv-text)]"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#2f1d1d] px-5 py-2.5 text-sm font-semibold text-[#f7efe6] transition hover:bg-[#3f2626] dark:bg-[#e8a87c] dark:text-[#1a1613] dark:hover:bg-[#d4956a]"
          >
            Create account
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          className="rounded-full p-2 text-[var(--cv-text)] lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-[var(--cv-border)] bg-[var(--background)]/95 px-6 py-5 lg:hidden"
        >
          <div className="space-y-1">
            {links.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.title}
                  to={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--cv-text-muted)] transition hover:bg-[var(--cv-surface)] hover:text-[var(--cv-text)]"
                >
                  {item.title}
                </Link>
              ) : (
                <a
                  key={item.title}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--cv-text-muted)] transition hover:bg-[var(--cv-surface)] hover:text-[var(--cv-text)]"
                >
                  {item.title}
                </a>
              )
            )}
            <div className="pt-2">
              <Link
                to="/login"
                className="block rounded-2xl border border-[var(--cv-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--cv-text)]"
                onClick={() => setMobileMenu(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="mt-2 block rounded-2xl bg-[#2f1d1d] px-4 py-3 text-center text-sm font-semibold text-[#f7efe6] dark:bg-[#e8a87c] dark:text-[#1a1613]"
                onClick={() => setMobileMenu(false)}
              >
                Create account
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

export default Navbar;
