import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

const configs = {
  valid: {
    bg: "rgba(0,122,61,0.15)",
    border: "rgba(0,122,61,0.45)",
    glow: "rgba(0,122,61,0.25)",
    icon: CheckCircle2,
    iconColor: "#00d468",
    titleColor: "#00d468",
    badgeBg: { background: "#007A3D", color: "white" },
    emoji: "✅",
    label: "HABILITADO",
  },
  invalid: {
    bg: "rgba(213,43,30,0.18)",
    border: "rgba(213,43,30,0.55)",
    glow: "rgba(213,43,30,0.3)",
    icon: XCircle,
    iconColor: "#ff4d44",
    titleColor: "#ff4d44",
    badgeBg: { background: "#D52B1E", color: "white" },
    emoji: "❌",
    label: "PROHIBIDO",
  },
  no_serie_b: {
    bg: "rgba(244,228,0,0.08)",
    border: "rgba(244,228,0,0.3)",
    glow: "rgba(244,228,0,0.15)",
    icon: Info,
    iconColor: "#F4E400",
    titleColor: "#F4E400",
    badgeBg: { background: "#F4E400", color: "#0f1a12" },
    emoji: "✅",
    label: "HABILITADO",
  },
  error: {
    bg: "rgba(244,228,0,0.06)",
    border: "rgba(244,228,0,0.2)",
    glow: "transparent",
    icon: AlertCircle,
    iconColor: "#c9bb00",
    titleColor: "#c9bb00",
    badgeBg: { background: "rgba(244,228,0,0.2)", color: "#c9bb00" },
    emoji: "⚠️",
    label: "ERROR",
  },
};

export default function ResultCard({ result }) {
  if (!result) return null;
  const cfg = configs[result.result] || configs.error;
  const Icon = cfg.icon;

  const denomLabel = result.denomination && result.denomination !== 'unknown' ? result.denomination : null;
  const serialLabel = result.serial?.full || null;

  // Summary line: "✅ HABILITADO Bs20 024010560A" or "❌ PROHIBIDO Bs10 7710001B"
  const summaryParts = [cfg.emoji, cfg.label, denomLabel, serialLabel].filter(Boolean);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.result + (result.serial?.full || "")}
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          background: cfg.bg,
          border: `1.5px solid ${cfg.border}`,
          boxShadow: `0 0 24px 0 ${cfg.glow}`,
        }}
        className="w-full rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 220 }}
            className="flex-shrink-0"
          >
            <Icon style={{ color: cfg.iconColor }} className="w-10 h-10" />
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* Main summary line */}
            <p className="font-black text-lg leading-tight tracking-wide" style={{ color: cfg.titleColor }}>
              {summaryParts.join(' ')}
            </p>

            {/* Sub message */}
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              {result.message}
            </p>

            {/* Extra detail for invalid */}
            {result.result === 'invalid' && (
              <p className="text-xs mt-1.5 font-bold uppercase tracking-widest" style={{ color: "#ff4d44", opacity: 0.85 }}>
                NO ESTÁ EN CIRCULACIÓN
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}