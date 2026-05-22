import { useRef, useState } from "react";
import { recognizeMedicineFromImage } from "../lib/groq";

interface Props {
  onResult: (medicineName: string) => void;
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

export function ImageScanButton({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(file: File) {
    setStatus("loading");
    setErrorMsg("");

    // Makul üst limit: 20MB ham dosya — canvas sıkıştıracak
    if (file.size > 20_000_000) {
      setErrorMsg("Lütfen 20MB altında bir fotoğraf seçin.");
      setStatus("error");
      return;
    }

    try {
      // Canvas ile sıkıştır → max 800px, JPEG 0.75
      const { base64, mimeType } = await compressImage(file);

      const { medicineName, confidence } = await recognizeMedicineFromImage(base64, mimeType);

      if (!medicineName || confidence === "none") {
        setErrorMsg("İlaç kutusu okunamadı. Lütfen daha net bir fotoğraf deneyin.");
        setStatus("error");
        return;
      }

      if (confidence === "low") {
        const confirmed = window.confirm(
          `"${medicineName}" ilacı mı arıyorsunuz? Onaylamak için Tamam'a basın.`
        );
        if (!confirmed) {
          setStatus("idle");
          return;
        }
      }

      setStatus("idle");
      onResult(medicineName);
    } catch (err) {
      console.error("[ImageScanButton handleFile Hata]", err);
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      setErrorMsg(`Bir hata oluştu: ${msg}`);
      setStatus("error");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
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

      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "loading"}
        style={{ /* mevcut buton stilinle eşleştir */ }}
      >
        {status === "loading" ? "Tanınıyor..." : "📷 Fotoğrafla Ara"}
      </button>

      {status === "error" && (
        <p style={{ color: "red", fontSize: 13, marginTop: 6 }}>{errorMsg}</p>
      )}
    </div>
  );
}
