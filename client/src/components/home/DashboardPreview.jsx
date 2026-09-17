import { motion } from "framer-motion";
import { CheckCircle2, FileText, FolderOpen, UploadCloud } from "lucide-react";

const workflow = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in seconds. Your private workspace is ready immediately.",
  },
  {
    step: "02",
    title: "Upload your files",
    description: "Drag and drop or select files from your device. PDF, DOC, DOCX, images and more.",
  },
  {
    step: "03",
    title: "Access from anywhere",
    description: "Preview, download, and manage your files from any device at any time.",
  },
];

function DashboardPreview() {
  return (
    <section id="workflow" className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cv-brand)]">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--cv-text)] sm:text-5xl">
              A simple flow from upload to access.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--cv-text-muted)]">
              CloudVault keeps the experience straightforward so managing your files never feels
              like a chore. Upload, organize, and access in three easy steps.
            </p>

            <div className="mt-10 space-y-4">
              {workflow.map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 rounded-[20px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--muted)] text-sm font-bold text-[var(--cv-brand)]">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--cv-text)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--cv-text-muted)]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — feature summary cards (no fake UI/mockup) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {[
              {
                icon: UploadCloud,
                title: "Upload",
                description: "Drag and drop or click to upload. PDF, DOC, DOCX, XLS, images, and more — up to 50 MB per file.",
              },
              {
                icon: FileText,
                title: "Preview",
                description: "Open PDFs and images directly in your browser. No downloads needed to confirm the right file.",
              },
              {
                icon: FolderOpen,
                title: "Organize",
                description: "Search by name, filter by type, size, or date. Sort files exactly the way you work.",
              },
              {
                icon: CheckCircle2,
                title: "Manage",
                description: "Download or delete files anytime. Track your storage usage and keep your workspace clean.",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-[20px] border border-[var(--cv-border)] bg-[var(--cv-surface)] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cv-surface-card)] text-[var(--cv-brand)]">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--cv-text)]">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--cv-text-muted)]">{card.description}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
