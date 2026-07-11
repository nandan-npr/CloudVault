import { motion } from "framer-motion";
import { ArrowRight, FileText, FolderOpen, Search, Share2, Smartphone } from "lucide-react";

const points = [
  {
    title: "A single place for important files",
    description: "Keep contracts, notes, briefs, and creative assets together so nothing is scattered across inboxes and desktop folders.",
    icon: FolderOpen,
  },
  {
    title: "Share without the mess",
    description: "Send a clean link, keep the context with the file, and avoid forwarding the same attachment over and over again.",
    icon: Share2,
  },
  {
    title: "Find what you need quickly",
    description: "Search by name, content, or workspace and get back to the right file without digging through layers of folders.",
    icon: Search,
  },
  {
    title: "Work from laptop or mobile",
    description: "Move from a desk to a train to a coffee shop without interrupting your flow or losing access to your files.",
    icon: Smartphone,
  },
  {
    title: "Preview documents before opening",
    description: "Open PDFs, images, and shared files without switching tools or downloading everything locally.",
    icon: FileText,
  },
];

function Features() {
  return (
    <section id="why-cloudvault" className="px-6 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Why CloudVault?</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
            Because work gets easier when files live in one thoughtful place.
          </h2>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            Local folders and long email chains are not a system. CloudVault gives you a practical home for documents, approvals, and shared work that stays clear as projects grow.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {points.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.article key={point.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: index * 0.04 }} className="rounded-[28px] border border-stone-200 bg-white/80 p-8 shadow-[0_15px_50px_rgba(45,32,20,0.05)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e4d4] text-[#8c3d3d]">
                  <Icon size={22} />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-stone-900">{point.title}</h3>
                <p className="mt-3 text-base leading-7 text-stone-600">{point.description}</p>
              </motion.article>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="mt-12 rounded-[32px] border border-stone-200 bg-[#f8f3ea] p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Built for real work</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-stone-900 sm:text-4xl">
                Bring structure to the files you actually rely on every day.
              </h3>
            </div>
            <a href="#workflow" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 transition hover:gap-3">
              See how it works <ArrowRight size={16} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Features;
