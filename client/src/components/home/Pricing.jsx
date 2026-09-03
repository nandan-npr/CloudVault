import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Essential",
    price: "$19",
    description: "For thoughtful teams that need structure without complexity.",
    features: ["Secure sharing", "Organized workspaces", "Review-ready folders"],
    featured: false,
  },
  {
    name: "Studio",
    price: "$49",
    description: "For teams moving quickly with more reviews, permissions, and context.",
    features: ["Advanced permissions", "Priority support", "Flexible collaboration"],
    featured: true,
  },
  {
    name: "Scale",
    price: "$99",
    description: "For larger organizations building a premium operating system around their work.",
    features: ["Custom workflows", "Dedicated onboarding", "Expanded control"],
    featured: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="px-6 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-[#f8f3ea] px-4 py-2 text-sm font-medium text-stone-700">
            <Sparkles size={16} className="text-[#8c3d3d]" />
            Pricing designed for focus
          </div>
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
            Choose a plan that matches the way your team works.
          </h2>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            Whether you are organizing a single project or running a wider operation, CloudVault
            stays simple and polished at every step.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
              className={`rounded-[30px] border p-8 shadow-[0_15px_50px_rgba(45,32,20,0.05)] ${plan.featured ? "border-[#d8b79b] bg-[#f8f3ea]" : "border-stone-200 bg-white/80"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-stone-900">{plan.name}</h3>
                {plan.featured ? (
                  <span className="rounded-full border border-[#d8b79b] bg-white/80 px-3 py-1 text-sm font-semibold text-[#8c3d3d]">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-7 text-stone-600">{plan.description}</p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-stone-900">{plan.price}</span>
                <span className="text-stone-500">/month</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-stone-700">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1e4d4] text-[#8c3d3d]">
                      <Check size={16} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
