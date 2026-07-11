import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Cloud, FolderOpen, ImagePlus, Search, ShieldCheck, Sparkles } from "lucide-react";

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center px-6 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">
            <Sparkles size={16} className="text-[#8c3d3d]" />
            A secure home for the files that move your work forward
          </div>

          <h1 className="text-5xl font-semibold leading-tight tracking-[-0.03em] text-stone-900 sm:text-6xl lg:text-7xl">
            CloudVault keeps your documents organized, accessible, and ready to share.
          </h1>

          <p className="mt-6 text-lg leading-8 text-stone-600 sm:text-xl">
            Stop losing work inside email threads and scattered folders. CloudVault gives you one calm place to store, review, and share files from any device.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[#2f1d1d] px-6 py-3 text-sm font-semibold text-[#f7efe6] transition hover:bg-[#3f2626]">
              Create account
              <ArrowRight size={16} />
            </Link>
            <a href="#why-cloudvault" className="inline-flex items-center rounded-full border border-stone-300 bg-white/80 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
              Why CloudVault?
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="rounded-[32px] border border-stone-200 bg-white/80 p-5 shadow-[0_20px_80px_rgba(45,32,20,0.08)] backdrop-blur">
          <div className="rounded-[24px] border border-stone-200 bg-[#f8f3ea] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Product preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900">Central workspace</h2>
              </div>
              <div className="rounded-2xl bg-[#2f1d1d] p-3 text-[#f7efe6]">
                <FolderOpen size={20} />
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-stone-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
                <Search size={16} className="text-stone-500" />
                <span className="text-sm text-stone-500">Search files and folders</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-800">Design files</p>
                    <FolderOpen size={16} className="text-[#8c3d3d]" />
                  </div>
                  <p className="mt-2 text-sm text-stone-500">Shared with the studio</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-800">Client brief</p>
                    <ImagePlus size={16} className="text-[#8c3d3d]" />
                  </div>
                  <p className="mt-2 text-sm text-stone-500">PDF preview ready</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-[#fcfaf6] p-4 text-center">
                <p className="text-sm font-semibold text-stone-800">Drag and drop files here</p>
                <p className="mt-1 text-sm text-stone-500">Upload from laptop or mobile in seconds</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-[22px] border border-stone-200 bg-white/90 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#f1e4d4] p-2 text-[#8c3d3d]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">Private by default</p>
                  <p className="text-sm text-stone-500">You choose what is shared</p>
                </div>
              </div>
              <CheckCircle2 size={18} className="text-[#8c3d3d]" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;