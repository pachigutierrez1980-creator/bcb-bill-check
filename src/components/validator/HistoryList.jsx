import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, Clock, Trash2, Camera, Keyboard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const resultConfig = {
  valid: { icon: CheckCircle2, color: "#007A3D", bg: "rgba(0,122,61,0.1)", border: "rgba(0,122,61,0.25)", label: "Válido" },
  invalid: { icon: XCircle, color: "#D52B1E", bg: "rgba(213,43,30,0.1)", border: "rgba(213,43,30,0.25)", label: "Inhabilitado" },
  no_serie_b: { icon: Info, color: "#b8ab00", bg: "rgba(244,228,0,0.07)", border: "rgba(244,228,0,0.2)", label: "No Serie B" },
};

function HistoryItem({ item, onDelete }) {
  const cfg = resultConfig[item.result] || resultConfig.valid;
  const Icon = cfg.icon;
  const MethodIcon = item.scan_method === "camera" ? Camera : Keyboard;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 p-3.5 rounded-xl group"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon style={{ color: cfg.color }} className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-mono font-bold text-sm tracking-wider truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
            {item.serial_number}
          </p>
          <MethodIcon className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          {item.denomination && item.denomination !== "unknown" && (
            <>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{item.denomination}</span>
            </>
          )}
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span className="text-xs flex items-center gap-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Clock className="w-2.5 h-2.5" />
            {format(new Date(item.created_date), "d MMM, HH:mm", { locale: es })}
          </span>
        </div>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
        style={{ color: "rgba(255,255,255,0.3)" }}
        onMouseEnter={e => e.currentTarget.style.color = "#D52B1E"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function HistoryList({ history, onDelete, onClear }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-14">
        <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No hay consultas previas</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          {history.length} consulta{history.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={onClear}
          className="text-xs font-semibold transition-colors"
          style={{ color: "#D52B1E" }}
        >
          Borrar todo
        </button>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {history.map((item) => (
            <HistoryItem key={item.id} item={item} onDelete={onDelete} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}