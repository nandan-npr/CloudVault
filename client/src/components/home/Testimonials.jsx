import { motion } from "framer-motion";
import { BookOpen, BriefcaseBusiness, Sparkles, Users } from "lucide-react";

const audiences = [
  {
    title: "Students",
    description: "Keep notes, references, and project work in one place without juggling scattered downloads and email attachments.",
    icon: BookOpen,
  },
  {
    title: "Professionals",
    description: "Store client documents, reports, and internal files in a workspace that stays easy to navigate every week.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Freelancers",
    description: "Deliver polished work with a simple file system that supports quick sharing and clear organization.",
    icon: Sparkles,
  },
  {
    title: "Remote teams",
    description: "Keep everyone aligned with shared folders, dependable access, and a cleaner flow for collaboration.",
    icon: Users,
  },
];

function Testimonials() {
  return (
    <section className="px-6 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Who it is for</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
            Designed for the people who live inside documents, deadlines, and shared work.
          </h2>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            CloudVault is useful wherever files matter: study, client work, freelance delivery, or day-to-day collaboration across a team.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {audiences.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article key={item.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: index * 0.05 }} className="rounded-[28px] border border-stone-200 bg-white/80 p-8 shadow-[0_15px_50px_rgba(45,32,20,0.05)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e4d4] text-[#8c3d3d]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-stone-600">{item.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
