import { motion } from "framer-motion";
import { BookOpen, BriefcaseBusiness, Sparkles, Users } from "lucide-react";

const audiences = [
  {
    title: "Students",
    description:
      "Keep notes, references, and project work in one place without juggling scattered downloads and email attachments.",
    icon: BookOpen,
  },
  {
    title: "Professionals",
    description:
      "Store client documents, reports, and internal files in a workspace that stays easy to navigate every week.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Freelancers",
    description:
      "Deliver polished work with a simple file system that supports quick sharing and clear organization.",
    icon: Sparkles,
  },
  {
    title: "Remote teams",
    description:
      "Keep everyone aligned with shared folders, dependable access, and a cleaner flow for collaboration.",
    icon: Users,
  },
];

function Testimonials() {
  return (
    <section className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cv-brand)]">
            Who it is for
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--cv-text)] sm:text-5xl">
            Built for anyone who works with files.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--cv-text-muted)]">
            CloudVault is useful wherever files matter: study, client work, freelance delivery, or
            day-to-day collaboration.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {audiences.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="rounded-[24px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-7 shadow-[0_4px_24px_var(--cv-shadow)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--cv-brand)]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--cv-text)]">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-[var(--cv-text-muted)]">{item.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
