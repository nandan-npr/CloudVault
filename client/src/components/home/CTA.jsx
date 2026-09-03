import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

function CTA() {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-7xl rounded-[36px] border border-stone-200 bg-white/80 p-8 shadow-[0_20px_80px_rgba(45,32,20,0.05)] sm:p-12"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-[#f8f3ea] px-4 py-2 text-sm font-medium text-stone-700">
              <Sparkles size={16} className="text-[#8c3d3d]" />
              Ready for your next chapter
            </div>
            <h2 className="text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
              Create a workspace that feels as polished as the work inside it.
            </h2>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              Start with a simple setup and give your team a calmer, more reliable way to organize
              and share files.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f1d1d] px-7 py-4 text-lg font-semibold text-[#f7efe6] transition hover:bg-[#3f2626]"
          >
            Start free
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default CTA;
