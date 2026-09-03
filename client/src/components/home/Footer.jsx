import { Link } from "react-router-dom";
import { ArrowRight, Cloud } from "lucide-react";

function Footer() {
  return (
    <footer className="px-6 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[32px] border border-stone-200 bg-white/80 px-6 py-8 shadow-[0_15px_50px_rgba(45,32,20,0.05)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#2f1d1d] p-3 text-[#f7efe6]">
            <Cloud size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold text-stone-900">CloudVault</p>
            <p className="text-sm text-stone-500">Thoughtful storage for modern teams.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
          <a href="#features" className="transition hover:text-stone-900">
            Product
          </a>
          <a href="#workflow" className="transition hover:text-stone-900">
            Workflow
          </a>
          <a href="#security" className="transition hover:text-stone-900">
            Security
          </a>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-[#f8f3ea] px-4 py-2 font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
