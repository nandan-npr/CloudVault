import { motion } from "framer-motion";
import { CheckCircle2, FileText, FolderOpen, Search, UploadCloud } from "lucide-react";

const workflow = [
  {
    title: "Create a workspace",
    description: "Gather the files, folders, and documents that belong together.",
  },
  {
    title: "Upload and organize",
    description: "Drop in documents, preview them, and place them where your team will find them.",
  },
  {
    title: "Share and access anywhere",
    description: "Keep the right people connected while your files stay available on every device.",
  },
];

function DashboardPreview() {
  return (
    <section id="workflow" className="px-6 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[36px] border border-stone-200 bg-white/80 p-8 shadow-[0_20px_80px_rgba(45,32,20,0.05)] lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
              A simple flow that feels natural from the first upload.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              CloudVault keeps the experience straightforward so planning, sharing, and reviewing
              files never feel like a chore.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="rounded-[28px] border border-stone-200 bg-[#f8f3ea] p-6"
          >
            <div className="rounded-[24px] border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#2f1d1d] p-2 text-[#f7efe6]">
                    <FolderOpen size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Project workspace</p>
                    <p className="text-sm text-stone-500">Shared with your team</p>
                  </div>
                </div>
                <div className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-600">
                  Live
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center gap-2 text-[#8c3d3d]">
                    <UploadCloud size={16} />
                    <span className="text-sm font-semibold">Upload</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    Bring files in from a laptop, tablet, or phone without friction.
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center gap-2 text-[#8c3d3d]">
                    <FileText size={16} />
                    <span className="text-sm font-semibold">Preview</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    Open documents directly so you can confirm the right file quickly.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {workflow.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3"
                  >
                    <div className="mt-0.5 rounded-full bg-[#2f1d1d] p-2 text-[#f7efe6]">
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#8c3d3d]">0{index + 1}</span>
                        <h3 className="text-sm font-semibold text-stone-800">{step.title}</h3>
                      </div>
                      <p className="mt-1 text-sm leading-7 text-stone-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-stone-200 bg-[#fcfaf6] px-3 py-3 text-sm text-stone-600">
                <Search size={16} className="text-[#8c3d3d]" />
                Search for a document, folder, or shared file in seconds.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
