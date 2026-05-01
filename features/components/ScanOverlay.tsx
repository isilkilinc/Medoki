import { recognizeMedicineFromImage } from "../lib/groq";
import { useState, useRef } from "react";
import { X, Camera, Upload } from "lucide-react";

interface ScanOverlayProps {
  onClose: () => void;
  onScan: (text: string) => void;
}

export default function ScanOverlay({ onClose, onScan }: ScanOverlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErrorMsg("");
    if (file.size > 1_000_000) {
      setErrorMsg("Lütfen 1MB altında bir fotoğraf seçin.");
      return;
    }
    setIsLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      const { medicineName, confidence } = await recognizeMedicineFromImage(base64, mimeType);
      if (!medicineName || confidence === "none") {
        setErrorMsg("İlaç kutusu okunamadı. Daha net bir fotoğraf deneyin.");
        return;
      }
      if (confidence === "low") {
        const confirmed = window.confirm(`"${medicineName}" ilacı mı arıyorsunuz?`);
        if (!confirmed) return;
      }
      onScan(medicineName);
    } catch {
      setErrorMsg("Bir hata oluştu. Tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[45] pb-[80px] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-fade-in-up">
      {/* Kapat */}
      <button
        onClick={onClose}
        className="absolute top-[max(1.5rem,env(safe-area-inset-top)+0.5rem)] left-4 sm:left-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-background/90 text-foreground hover:bg-muted transition-colors border border-border/80 z-[60] shadow-lg backdrop-blur-md cursor-pointer active:scale-95 font-semibold text-sm"
      >
        <X className="w-5 h-5" />
        Kapat
      </button>

      {/* İkon ve başlık */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px]" />
          <div className="relative w-28 h-28 rounded-full border-2 border-primary/40 bg-card/60 flex items-center justify-center">
            {isLoading ? (
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Camera className="w-12 h-12 text-primary stroke-[1.5]" />
            )}
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isLoading ? "Tanınıyor..." : "İlaç Fotoğrafı Çek"}
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-[260px]">
          {isLoading
            ? "Yapay zeka ilaç kutusunu analiz ediyor"
            : "İlaç kutusunun üzerindeki yazıyı net görecek şekilde fotoğraf çek"}
        </p>
      </div>

      {/* Gizli inputlar */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Butonlar */}
      <div className="w-full max-w-[400px] px-6 flex flex-col gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.35)] hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2.5"
        >
          <Camera className="w-5 h-5" />
          Kamera ile Çek
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl border-2 border-primary/40 bg-transparent text-primary font-bold text-lg cursor-pointer transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2.5"
        >
          <Upload className="w-5 h-5" />
          Galeriden Seç
        </button>

        {errorMsg && (
          <p className="text-center text-sm text-red-400 mt-1">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
