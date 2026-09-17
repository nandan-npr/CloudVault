import { motion } from "framer-motion";
import { Lock, Shield, ShieldCheck } from "lucide-react";

function Security() {
  return (
    <section className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-[var(--cv-border)] bg-[var(--cv-surface-card)] p-8 shadow-[0_4px_40px_var(--cv-shadow)] lg:p-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2 text-sm font-medium text-[var(--cv-text-muted)]">
              <Shield size={14} className="text-[var(--cv-brand)]" />
              Security that stays calm and dependable
            </div>
            <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--cv-text)] sm:text-5xl">
              Privacy, ownership, and reliable storage built in.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--cv-text-muted)]">
              CloudVault is designed to feel reassuring: your files stay protected, your control
              stays clear, and your data remains where you expect it to be.
            </p>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="space-y-4"
          >
            {[
              {
                title: "Your files stay yours",
                description: "You decide what is stored and what stays private.",
                icon: Lock,
              },
              {
                title: "Protected access",
                description: "JWT authentication with secure refresh tokens keeps your session safe.",
                icon: ShieldCheck,
              },
              {
                title: "Reliable cloud storage",
                description: "Files are stored securely via Cloudinary with SHA-256 integrity checks.",
                icon: Shield,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-[20px] border border-[var(--cv-border)] bg-[var(--cv-surface)] p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--cv-surface-card)] text-[var(--cv-brand)]">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--cv-text)]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--cv-text-muted)]">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Security;
