import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Cloud, Menu, X } from "lucide-react";

function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { title: "Product", href: "#features" },
    { title: "Workflow", href: "#workflow" },
    { title: "Security", href: "#security" },
  ];

  return (
    <motion.header
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-stone-200/80 bg-[#f8f3ea]/85 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#2f1d1d] p-3 text-[#f7efe6] shadow-[0_10px_35px_rgba(47,29,29,0.12)]">
            <Cloud size={18} />
          </div>
          <div>
            <p className="text-base font-semibold text-stone-900">CloudVault</p>
            <p className="text-sm text-stone-500">Premium file workspace</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="text-sm font-medium text-stone-600 transition hover:text-stone-900"
            >
              {item.title}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="rounded-full px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
            Login
          </Link>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[#2f1d1d] px-5 py-2.5 text-sm font-semibold text-[#f7efe6] transition hover:bg-[#3f2626]">
            Create account
            <ArrowRight size={16} />
          </Link>
        </div>

        <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-full p-2 text-stone-700 lg:hidden">
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenu && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-stone-200 bg-[#f8f3ea]/95 px-6 py-5 lg:hidden">
          <div className="space-y-2">
            {links.map((item) => (
              <a key={item.title} href={item.href} onClick={() => setMobileMenu(false)} className="block rounded-2xl px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
                {item.title}
              </a>
            ))}
            <Link to="/login" className="mt-3 block rounded-2xl border border-stone-200 px-4 py-3 text-center text-sm font-semibold text-stone-800">
              Login
            </Link>
            <Link to="/register" className="mt-2 block rounded-2xl bg-[#2f1d1d] px-4 py-3 text-center text-sm font-semibold text-[#f7efe6]">
              Create account
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

export default Navbar;