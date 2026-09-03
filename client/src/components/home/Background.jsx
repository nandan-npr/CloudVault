import { motion } from "framer-motion";

function Background() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#f8f3ea]">
      <motion.div
        animate={{ x: [0, 16, 0], y: [0, -12, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-20 top-10 h-[360px] w-[360px] rounded-full bg-[#ead8c2]/70 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -18, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 top-20 h-[420px] w-[420px] rounded-full bg-[#d9bca0]/45 blur-[140px]"
      />
      <motion.div
        animate={{ y: [0, 18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/3 h-[320px] w-[320px] rounded-full bg-[#e6d2b2]/50 blur-[130px]"
      />

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(47,29,29,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(47,29,29,0.07) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
    </div>
  );
}

export default Background;
