import { motion } from "framer-motion";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";

function Security() {
  return (
    <section className="px-6 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[36px] border border-stone-200 bg-white/80 p-8 shadow-[0_20px_80px_rgba(45,32,20,0.05)] lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-[#f8f3ea] px-4 py-2 text-sm font-medium text-stone-700">
              <Sparkles size={16} className="text-[#8c3d3d]" />
              Security that stays calm and dependable
            </div>
            <h2 className="text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
              Privacy, ownership, and reliable storage built into the experience.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              CloudVault is designed to feel reassuring: your files stay protected, your control
              stays clear, and your data remains where you expect it to be.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="rounded-[28px] border border-stone-200 bg-[#f8f3ea] p-6"
          >
            <div className="space-y-4">
              {[
                {
                  title: "Your files stay yours",
                  description: "You decide what is shared and with whom.",
                },
                {
                  title: "Protected access",
                  description: "Sensitive files stay behind thoughtful access controls.",
                },
                {
                  title: "A trusted place to keep work",
                  description: "Reliable storage for the documents that matter most.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-stone-200 bg-white/90 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-[#f1e4d4] p-2 text-[#8c3d3d]">
                      <Lock size={16} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-stone-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-stone-200 bg-white/90 p-4">
              <div className="rounded-2xl bg-[#f1e4d4] p-2 text-[#8c3d3d]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Security is a product principle, not an afterthought.
                </p>
                <p className="text-sm text-stone-500">
                  Every interaction stays consistent with that promise.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Security;
