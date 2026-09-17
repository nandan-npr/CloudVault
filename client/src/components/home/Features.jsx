import { motion } from "framer-motion";
import { FileText, FolderOpen, Search, Shield, Smartphone, SlidersHorizontal } from "lucide-react";

const points = [
  {
    title: "Secure file storage",
    description:
      "Keep your documents, images and important files organized in one private workspace. Everything stays yours.",
    icon: Shield,
  },
  {
    title: "Easy organization",
    description:
      "Upload, view, and manage your files with a clean, intuitive interface. No complicated folder structures.",
    icon: FolderOpen,
  },
  {
    title: "Access anywhere",
    description:
      "Your files are available from any device. Move from desktop to mobile without losing your flow.",
    icon: Smartphone,
  },
  {
    title: "File previews",
    description:
      "Preview PDFs and images directly inside CloudVault — no need to download before you can see what's inside.",
    icon: FileText,
  },
  {
    title: "Powerful search and filtering",
    description:
      "Find any file instantly. Search by name, filter by type, size, or date, and sort your way.",
    icon: Search,
  },
  {
    title: "Personal workspace",
    description:
      "Your own private cloud space with storage analytics, profile management, and theme customization.",
    icon: SlidersHorizontal,
  },
];

function Features() {
  return (
    <section id="features" className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cv-brand)]">
            Everything you need
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--cv-text)] sm:text-5xl">
            Everything you need for your files.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--cv-text-muted)]">
            CloudVault gives you a complete personal file management experience — upload, organize,
            preview, and access your files with ease.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.article
                key={point.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="rounded-[24px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-7 shadow-[0_4px_24px_var(--cv-shadow)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--cv-brand)]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--cv-text)]">{point.title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-[var(--cv-text-muted)]">{point.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
