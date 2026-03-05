import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Search, History, Banknote, X, ArrowLeft } from "lucide-react";
import { validateBillete } from "@/components/validationRanges";
import ResultCard from "@/components/validator/ResultCard";
import CameraScanner from "@/components/validator/CameraScanner";
import HistoryList from "@/components/validator/HistoryList";

const ScanHistory = base44.entities.ScanHistory;

// Bolivia flag stripe accent component
function FlagStripe() {
  return (
    <div className="flex h-1 w-full rounded-full overflow-hidden">
      <div className="flex-1 bg-[#D52B1E]" />
      <div className="flex-1 bg-[#F4E400]" />
      <div className="flex-1 bg-[#007A3D]" />
    </div>
  );
}

export default function Home() {
  const [serialInput, setSerialInput] = useState("");
  const [result, setResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const loadHistory = useCallback(async () => {
    const records = await ScanHistory.list("-created_date", 50);
    setHistory(records);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleVerify = async (serial = serialInput, denomination = null) => {
    const input = serial.trim().toUpperCase();
    if (!input) return;
    setIsVerifying(true);
    const validation = validateBillete(input, denomination);
    setResult(validation);
    setSerialInput(input);
    if (validation.result !== "error") {
      await ScanHistory.create({
        serial_number: input,
        result: validation.result,
        denomination: validation.denomination || "unknown",
        scan_method: denomination !== null ? "camera" : "manual",
        notes: validation.message,
      });
      loadHistory();
    }
    setIsVerifying(false);
  };

  const handleCameraDetected = async (serial, denomination) => {
    setShowCamera(false);
    setSerialInput(serial);
    await handleVerify(serial, denomination);
  };

  const handleDelete = async (id) => {
    await ScanHistory.delete(id);
    loadHistory();
  };

  const handleClearAll = async () => {
    await Promise.all(history.map((h) => ScanHistory.delete(h.id)));
    setHistory([]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setSerialInput(val);
    if (val.length >= 7) {
      setResult(validateBillete(val));
    } else if (val.length === 0) {
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #D52B1E 0%, #b02218 18%, #8a1a10 30%, #2a1200 42%, #1a2200 50%, #003318 62%, #007A3D 78%, #005a2d 88%, #c9a800 100%)" }}>
      {/* Camera overlay */}
      <AnimatePresence>
        {showCamera && (
          <CameraScanner
            onDetected={handleCameraDetected}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-5 pt-12 pb-5 sticky top-0 z-40" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
            {/* Logo with flag colors */}
            <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg"
              style={{ background: "linear-gradient(135deg, #D52B1E, #F4E400 50%, #007A3D)" }}>
              <Banknote className="w-6 h-6 text-white drop-shadow" />
            </div>
            <h1 className="font-black text-white text-2xl tracking-wide uppercase drop-shadow-lg">VALIDABILLETE</h1>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={showHistory
                ? { background: "#F4E400", color: "#0f1a12" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {showHistory ? <ArrowLeft className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
              {showHistory ? "Volver" : "Historial"}
              {!showHistory && history.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "#D52B1E", color: "white" }}>
                  {history.length}
                </span>
              )}
            </button>
          </div>
          <FlagStripe />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
            >
              <HistoryList
                history={history}
                onDelete={handleDelete}
                onClear={handleClearAll}
              />
            </motion.div>
          ) : (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Subtitle */}
              <p className="text-sm leading-relaxed px-1" style={{ color: "rgba(255,255,255,0.75)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                Verifica si un billete boliviano pertenece a la{" "}
                <span style={{ color: "#F4E400", fontWeight: 600 }}>Serie B inhabilitada</span>{" "}
                por el BCB.
              </p>

              {/* Camera button — primary CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCamera(true)}
                className="w-full rounded-2xl py-5 px-5 flex items-center gap-4 shadow-xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #D52B1E 0%, #b02218 100%)" }}
              >
                {/* subtle shine */}
                <div className="absolute inset-0 opacity-20"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-base">Escanear con Cámara</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>OCR automático del número de serie</p>
                </div>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>O INGRESA MANUALMENTE</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Manual input card */}
              <div className="rounded-2xl overflow-hidden shadow-xl"
                style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="px-5 pt-5 pb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-3"
                    style={{ color: "#007A3D" }}>
                    Número de Serie
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={serialInput}
                      onChange={handleInputChange}
                      placeholder="ej: 67250001B"
                      maxLength={12}
                      className="w-full font-mono text-2xl font-black bg-transparent border-none outline-none tracking-widest pr-8"
                      style={{ color: "white", caretColor: "#F4E400" }}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    {serialInput && (
                      <button
                        onClick={() => { setSerialInput(""); setResult(null); }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Formato: dígitos + letra (ej: 67250001B)
                  </p>
                </div>

                {/* Verify button */}
                <button
                  onClick={() => handleVerify()}
                  disabled={!serialInput.trim() || isVerifying}
                  className="w-full py-4 flex items-center justify-center gap-2 font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: serialInput.trim() ? "#007A3D" : "rgba(0,122,61,0.3)",
                    color: "white",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    letterSpacing: "0.03em",
                  }}
                >
                  <Search className="w-4 h-4" />
                  {isVerifying ? "Verificando..." : "Verificar Billete"}
                </button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ResultCard result={result} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer info */}
              <div className="rounded-xl px-4 py-3 flex items-center justify-center gap-2"
                style={{ background: "rgba(244,228,0,0.06)", border: "1px solid rgba(244,228,0,0.12)" }}>
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-3 rounded-sm bg-[#D52B1E]" />
                  <div className="w-1.5 h-3 rounded-sm bg-[#F4E400]" />
                  <div className="w-1.5 h-3 rounded-sm bg-[#007A3D]" />
                </div>
                <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                  100% offline · Rangos BCB almacenados localmente
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}