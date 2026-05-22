import { recognizeMedicineFromImage } from "../lib/groq";
import { useState, useRef } from "react";
import { X, Camera, Upload } from "lucide-react";
import { useGamification } from "@/contexts/GamificationContext";

interface ScanOverlayProps {
  onClose: () => void;
  onScan: (text: string) => void;
}

/**
 * Görseli canvas üzerinden sıkıştırır.
 * Maksimum 800px, JPEG kalite 0.75 — API payload limitine takılmamak için.
 */
async function compressImage(file: File): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context alınamadı.")); return; }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG, kalite 0.75 — yeterince küçük & net
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      const base64 = dataUrl.split(",")[1];
      console.log(`[Vision Compress] ${file.name} → ${width}×${height}, base64 uzunluk: ${base64.length}`);
      resolve({ base64, mimeType: "image/jpeg" });
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      console.error("[Vision Compress Hata]", e);
      reject(new Error("Görüntü yüklenemedi."));
    };

    img.src = objectUrl;
  });
}

export default function ScanOverlay({ onClose, onScan }: ScanOverlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { triggerAction } = useGamification();
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErrorMsg("");

    // Makul üst limit: 20MB (ham dosya) — canvas zaten küçültecek
    if (file.size > 20_000_000) {
      setErrorMsg("Lütfen 20MB altında bir fotoğraf seçin.");
      return;
    }

    setIsLoading(true);
    try {
      // Canvas ile sıkıştır → max 800px, JPEG 0.75
      const { base64, mimeType } = await compressImage(file);

      const { medicineName, confidence } = await recognizeMedicineFromImage(base64, mimeType);

      if (!medicineName || confidence === "none") {
        setErrorMsg("İlaç kutusu okunamadı. Daha net bir fotoğraf deneyin.");
        return;
      }
      if (confidence === "low") {
        const confirmed = window.confirm(`"${medicineName}" ilacı mı arıyorsunuz?`);
        if (!confirmed) return;
      }
      
      triggerAction("first_camera");
      onScan(medicineName);
    } catch (err) {
      console.error("[ScanOverlay handleFile Hata]", err);
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      setErrorMsg(`Bir hata oluştu: ${msg}`);
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
