import { useRef, useState, useEffect, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { Camera, X, Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { detectDenomination, extractSerialCandidates } from "@/components/validationRanges";

function extractFromOCR(text) {
  const denomination = detectDenomination(text);
  const serials = extractSerialCandidates(text);
  // Preferir serial con letra B
  const serialB = serials.find(s => s.letter === 'B');
  const serial = serialB || serials[0] || null;
  return { denomination, serial };
}

export default function CameraScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const intervalRef = useRef(null);

  const [status, setStatus] = useState("initializing");
  const [statusMsg, setStatusMsg] = useState("Iniciando cámara...");
  const [detected, setDetected] = useState(null); // { serial, denomination }

  const stopAll = useCallback(() => {
    clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (workerRef.current) workerRef.current.terminate();
  }, []);

  const captureAndOCR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Recortar zona central donde suele estar el serial
    const cropX = canvas.width * 0.03;
    const cropY = canvas.height * 0.25;
    const cropW = canvas.width * 0.94;
    const cropH = canvas.height * 0.5;
    const imageData = ctx.getImageData(cropX, cropY, cropW, cropH);
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    cropCanvas.getContext("2d").putImageData(imageData, 0, 0);

    const { data: { text } } = await workerRef.current.recognize(cropCanvas);
    const { denomination, serial } = extractFromOCR(text);

    if (serial) {
      const result = { serial: serial.full, denomination };
      setDetected(result);
      setStatus("detected");
      const denomLabel = denomination || "?";
      setStatusMsg(`${denomLabel} · ${serial.full}`);
      stopAll();
      setTimeout(() => onDetected(serial.full, denomination), 700);
    }
  }, [onDetected, stopAll]);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const worker = await createWorker("eng", 1, { logger: () => {} });
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ",
          tessedit_pageseg_mode: "6",
        });
        if (!active) { worker.terminate(); return; }
        workerRef.current = worker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("scanning");
        setStatusMsg("Enfoca el billete — detectando automáticamente...");
        intervalRef.current = setInterval(captureAndOCR, 1500);
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setStatusMsg(err.name === "NotAllowedError"
          ? "Permiso de cámara denegado. Use ingreso manual."
          : "Error al iniciar cámara. Use ingreso manual.");
      }
    }

    init();
    return () => { active = false; stopAll(); };
  }, [captureAndOCR, stopAll]);

  const statusConfig = {
    initializing: { color: "bg-gray-800/80 text-gray-100", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    scanning: { color: "bg-blue-900/80 text-blue-100", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    detected: { color: "bg-emerald-800/80 text-emerald-100", icon: <Zap className="w-4 h-4" /> },
    error: { color: "bg-amber-800/80 text-amber-100", icon: <AlertCircle className="w-4 h-4" /> },
  };
  const cfg = statusConfig[status] || statusConfig.scanning;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">Escanear Billete</span>
        </div>
        <button
          onClick={() => { stopAll(); onClose(); }}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[88%] h-[26%] relative">
            {["tl","tr","bl","br"].map((pos) => (
              <div key={pos} className={`absolute w-7 h-7 border-white border-2
                ${pos === "tl" ? "top-0 left-0 border-r-0 border-b-0 rounded-tl-sm" : ""}
                ${pos === "tr" ? "top-0 right-0 border-l-0 border-b-0 rounded-tr-sm" : ""}
                ${pos === "bl" ? "bottom-0 left-0 border-r-0 border-t-0 rounded-bl-sm" : ""}
                ${pos === "br" ? "bottom-0 right-0 border-l-0 border-t-0 rounded-br-sm" : ""}
              `} />
            ))}
            {status === "scanning" && (
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-green-400/80 shadow-[0_0_8px_2px_rgba(74,222,128,0.6)]"
                animate={{ top: ["5%", "95%", "5%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
            {status === "detected" && (
              <div className="absolute inset-0 border-2 border-emerald-400 rounded-sm"
                style={{ boxShadow: "0 0 20px 4px rgba(52,211,153,0.5)" }} />
            )}
          </div>
        </div>

        {/* Dim overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 6%, transparent 94%, rgba(0,0,0,0.55) 100%), linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 37%, transparent 63%, rgba(0,0,0,0.55) 100%)"
          }}
        />
      </div>

      {/* Status bar */}
      <div className="px-4 pb-8 pt-3 bg-black/80 backdrop-blur-sm">
        <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${cfg.color}`}>
          {cfg.icon}
          <span className="text-sm font-semibold">{statusMsg}</span>
        </div>
        <p className="text-center text-gray-500 text-xs mt-2">
          Apunta al número de serie y denominación del billete
        </p>
      </div>
    </motion.div>
  );
}