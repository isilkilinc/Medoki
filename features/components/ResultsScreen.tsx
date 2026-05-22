import { useState, useRef } from "react";
import { Copy, Upload, ArrowLeft, CheckCircle, ImageDown, Loader2 } from "lucide-react";
import ResultCard from "./ResultCard";
import type { MedicineResult, SymptomResult } from "@/lib/groq";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import type { ReactNode } from "react";
import html2canvas from "html2canvas";

const STAGGER_STEP = 100;

interface ResultsScreenProps {
  mode: "medicine" | "symptom";
  result: MedicineResult | SymptomResult | null;
  error: ReactNode | null;
  query: string;
  onBack: () => void;
  isProspectusAnalysis?: boolean;
}

const ResultsScreen = ({ mode, result, error, query, onBack, isProspectusAnalysis }: ResultsScreenProps) => {
  const [statusMsg, setStatusMsg] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Temaya göre snapshot renk paleti
  const snapBg       = isDark ? "#0f172a" : "#ffffff";
  const snapBorder   = isDark ? "#1e293b" : "#e2e8f0";
  const snapSubText  = isDark ? "rgba(255,255,255,0.30)" : "rgba(15,23,42,0.35)";
  const snapDivider  = isDark ? "#1e293b" : "#e2e8f0";
  const snapGlow     = isDark ? "rgba(0,220,200,0.06)" : "rgba(0,220,200,0.04)";

  const getResultsText = () => containerRef.current?.innerText?.trim() || "";

  const handleCopy = async () => {
    const text = getResultsText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg(t("results.copied"));
      setTimeout(() => setStatusMsg((s) => s === t("results.copied") ? "" : s), 2200);
    } catch {
      setStatusMsg(t("results.copy_failed"));
    }
  };

  const handleShare = async () => {
    const text = getResultsText();
    if (!text) return;

    const shortSummary = mode === "medicine"
      ? (result as MedicineResult)?.summary?.slice(0, 500) || ""
      : (result as SymptomResult)?.intro?.slice(0, 500) || "";

    const modeLabel = mode === "medicine" ? "İlaç / sorgu" : "Şikayet";
    const shareText = `Medoki — ${modeLabel}: ${query}\n\nKısa özet: ${shortSummary}\n\n— Medoki analizi (genel bilgilendirme; tıbbi tavsiye değildir)`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Medoki analizi", text: shareText, url: window.location.href });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setStatusMsg(t("results.share_fallback"));
      setTimeout(() => setStatusMsg((s) => s === t("results.share_fallback") ? "" : s), 2400);
    } catch {
      setStatusMsg(t("results.copy_failed"));
    }
  };

  const handleDownloadImage = async () => {
    if (!resultCardRef.current || isCapturing) return;
    setIsCapturing(true);
    setStatusMsg("Görsel hazırlanıyor…");

    try {
      const canvas = await html2canvas(resultCardRef.current, {
        // Aktif temaya göre arka plan — şeffaf yerine solid renk
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        scale: 2.5,
        useCORS: true,
        logging: false,
        scrollY: -window.scrollY,
        windowWidth: resultCardRef.current.scrollWidth,
        onclone: (clonedDoc) => {
          const root = clonedDoc.querySelector("[data-capture-root]") as HTMLElement | null;
          if (!root) return;
          // Tema bağlı metin rengi güçlendirme
          root.querySelectorAll<HTMLElement>("p, li, span, h3").forEach((el) => {
            const color = window.getComputedStyle(el).color;
            if (isDark) {
              // Dark: düşük-opacity beyazları daha opaklı yap
              if (color.includes("rgba") && color.includes("255, 255, 255")) {
                el.style.color = "rgba(255,255,255,0.88)";
              }
            } else {
              // Light: düşük-opacity siyahları daha opaklı yap
              if (color.includes("rgba") && (color.includes("15, 23") || color.includes("0, 0, 0"))) {
                el.style.color = "rgba(15,23,42,0.85)";
              }
            }
          });
        },
      });

      const link = document.createElement("a");
      link.download = "Medoki-Ozet.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      setStatusMsg("✓ Görsel indirildi!");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch {
      setStatusMsg("Görsel oluşturulamadı.");
      setTimeout(() => setStatusMsg(""), 2500);
    } finally {
      setIsCapturing(false);
    }
  };

  const hasContent = !!result || !!error;

  const renderCards = () => {
    if (error) {
      return (
        <ResultCard title="İşlem tamamlanamadı" className="animate-fade-in-up">
          <p className="text-foreground/75 leading-relaxed m-0 text-sm">{error}</p>
        </ResultCard>
      );
    }

    if (!result) return null;

    if (mode === "medicine") {
      const r = result as MedicineResult;
      const cards: Array<{ title: string; content: React.ReactNode; muted?: boolean; className?: string }> = [
        { title: "Ne İşe Yarar?", content: <p className="text-foreground/75 leading-relaxed m-0 text-sm">{r.purpose}</p> },
        { title: "Önerilen Doz", content: <p className="text-foreground/75 leading-relaxed m-0 text-sm">{r.dosage}</p> },
        { title: "Sık Görülen Yan Etkiler", content: <ul className="list-disc pl-5 text-foreground/75 grid gap-1.5 text-sm">{r.sideEffects.map((s, i) => <li key={i}>{s}</li>)}</ul> },
        { title: "Kritik Uyarılar", content: <ul className="list-disc pl-5 text-foreground/75 grid gap-1.5 text-sm">{r.warnings.map((s, i) => <li key={i}>{s}</li>)}</ul> },
      ];

      if (r.sensitivityWarnings && r.sensitivityWarnings.length > 0) {
        cards.push({
          title: "Hassasiyet ve İçerik Uyarıları",
          content: (
            <div className="text-foreground/80 grid gap-2.5 text-sm font-medium">
              {r.sensitivityWarnings.map((s, i) => (
                <p key={i} className="m-0 leading-relaxed">{s}</p>
              ))}
            </div>
          )
        });
      }

      if (r.foodInteractions) {
        cards.push({
          title: "Besin ve Takviye Etkileşimi",
          className: "border-amber-500/30 bg-amber-500/5 shadow-[0_4px_24px_rgba(245,158,11,0.05)]",
          content: (
            <p className="text-foreground/85 leading-relaxed m-0 text-sm font-medium">
              {r.foodInteractions}
            </p>
          )
        });
      }

      cards.push({ title: "Sade Özet", content: <p className="text-foreground/75 leading-relaxed m-0 text-sm">{r.summary}</p> });
      cards.push({ title: "Tıbbi Not", content: <p className="text-foreground/75 leading-relaxed m-0 text-sm">{r.disclaimer}</p>, muted: true });

      return (
        <>
          {/* AI badge */}
         <div className="flex items-center gap-2 mb-3 animate-fade-in-up flex-wrap">
            {isProspectusAnalysis ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Prospektüsten Analiz Edildi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                <CheckCircle className="w-3.5 h-3.5" />
                AI Tarafından Sadeleştirildi
              </span>
            )}
          </div>
          
          {/* Prospektüs yönlendirme veya Analiz Bilgisi */}
          {isProspectusAnalysis ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-green-500/20 bg-green-500/5 animate-fade-in-up mb-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bu bilgiler, yüklediğiniz orijinal prospektüs PDF'inden yapay zeka ile analiz edilerek özetlenmiştir.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 animate-fade-in-up mb-1">
              <p className="text-xs text-muted-foreground">
                Bu bilgileri doğrulamak ister misiniz?
              </p>
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 shrink-0 transition-colors"
              >
                Prospektüs yükle →
              </button>
            </div>
          )}
          
          {cards.map((card, i) => (
            <ResultCard
              key={i}
              title={card.title}
              muted={card.muted}
              className={`animate-fade-in-up ${card.className || ""}`}
              style={{ animationDelay: `${i * STAGGER_STEP}ms` }}
            >
              {card.content}
            </ResultCard>
          ))}
        </>
      );
    }

    // Symptom mode
    const r = result as SymptomResult;
    let cardIndex = 0;
    const isRedFlag = r.intro?.includes("KRİTİK UYARI");

    return (
      <>
        {/* AI badge */}
        <div className="flex items-center gap-2 mb-3 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
            <CheckCircle className="w-3.5 h-3.5" />
            AI Tarafından Önerildi
          </span>
        </div>

        <ResultCard title="Şikayet Özeti" className="animate-fade-in-up" style={{ animationDelay: `${cardIndex++ * STAGGER_STEP}ms` }}>
          <p className="text-foreground/75 leading-relaxed m-0 text-sm">{r.intro}</p>
        </ResultCard>

        {!isRedFlag && (
          <>
            <ResultCard title="Önerilen Reçetesiz Çözümler" className="animate-fade-in-up" style={{ animationDelay: `${cardIndex++ * STAGGER_STEP}ms` }}>
              <p className="text-xs text-muted-foreground m-0">
                Aşağıdakiler genel bilgilendirme içindir; eczacı veya doktor onayı olmadan kullanmayın.
              </p>
            </ResultCard>

            {r.products.map((p, i) => (
              <ResultCard
                key={i}
                title={p.labelLine}
                className="animate-fade-in-up"
                style={{ animationDelay: `${cardIndex++ * STAGGER_STEP}ms` }}
              >
                {p.form && <p className="text-xs text-muted-foreground mb-2">{p.form}</p>}
                <p className="text-foreground/75 leading-relaxed m-0 text-sm"><strong className="font-bold text-foreground">Neden uygun:</strong> {p.whyItHelps || "—"}</p>
                <p className="text-foreground/75 leading-relaxed m-0 mt-1 text-sm"><strong className="font-bold text-foreground">Tipik kullanım:</strong> {p.typicalUse || "Prospektüs veya eczacıya danışın."}</p>
                {p.cautions.length > 0 && (
                  <>
                    <p className="text-foreground/75 leading-relaxed m-0 mt-1 text-sm"><strong className="font-bold text-foreground">Dikkat:</strong></p>
                    <ul className="list-disc pl-5 text-foreground/75 grid gap-1.5 text-sm">{p.cautions.map((c, j) => <li key={j}>{c}</li>)}</ul>
                  </>
                )}
              </ResultCard>
            ))}

            <ResultCard title="Genel Öneriler" className="animate-fade-in-up" style={{ animationDelay: `${cardIndex++ * STAGGER_STEP}ms` }}>
              <ul className="list-disc pl-5 text-foreground/75 grid gap-1.5 text-sm">{r.generalTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </ResultCard>

            <ResultCard title="Ne Zaman Doktora Başvurmalı?" className="animate-fade-in-up" style={{ animationDelay: `${cardIndex++ * STAGGER_STEP}ms` }}>
              <ul className="list-disc pl-5 text-foreground/75 grid gap-1.5 text-sm">{r.whenToSeeDoctor.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </ResultCard>
          </>
        )}

        <ResultCard title="Tıbbi Not" muted className="animate-fade-in-up" style={{ animationDelay: `${cardIndex++ * STAGGER_STEP}ms` }}>
          <p className="text-foreground/75 leading-relaxed m-0 text-sm">{r.disclaimer}</p>
        </ResultCard>
      </>
    );
  };

  return (
    <section className="glass-card relative pb-24">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground flex-1 min-w-0 m-0">
            {result ? (result as MedicineResult | SymptomResult).correctedTerm || query : query}
          </h2>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-2xl px-3 py-2.5 min-h-[40px] text-sm font-medium border border-border bg-muted/40 text-muted-foreground cursor-pointer shrink-0 transition-colors hover:bg-muted/60 hover:text-foreground active:translate-y-px"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("results.back")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasContent}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 text-xs font-semibold rounded-2xl px-3 py-2.5 min-h-[42px] border border-border bg-muted/40 text-muted-foreground cursor-pointer transition-all hover:bg-muted/60 hover:text-foreground active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4 opacity-80" />
            {t("results.copy")}
          </button>

          {/* ── Görsel İndir / Paylaş Butonu ── */}
          <button
            type="button"
            id="download-image-btn"
            onClick={handleDownloadImage}
            disabled={!hasContent || isCapturing}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 text-xs font-semibold rounded-2xl px-3 py-2.5 min-h-[42px] border border-primary/30 bg-primary/10 text-primary cursor-pointer transition-all hover:bg-primary/20 hover:border-primary/50 hover:shadow-[0_0_16px_rgba(0,220,200,0.15)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Görsel olarak indir"
            title="Özeti PNG olarak indir"
          >
            {isCapturing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ImageDown className="w-4 h-4 opacity-90" />
            }
            {isCapturing ? "Hazırlanıyor…" : "Görsel İndir"}
          </button>
        </div>
      </div>

      {/* ── Snapshot alınacak alan (resultCardRef) ── Butonlar DIŞARIDA ── */}
      <div
        ref={resultCardRef}
        data-capture-root
        style={{
          backgroundColor: snapBg,
          borderRadius: "24px",
          padding: "40px",
          border: `1px solid ${snapBorder}`,
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)"
            : "0 10px 40px -8px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle aksan ışığı — temaya göre */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${snapGlow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Sonuç kartları */}
        <div ref={containerRef} className="grid gap-3">
          {renderCards()}
        </div>

        {/* ── Minimal Footer Branding ── */}
        <div
          style={{
            marginTop: "28px",
            paddingTop: "16px",
            borderTop: `1px solid ${snapDivider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Sol: Logo + İsim */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", opacity: 0.75 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                background: "rgba(0,220,200,0.15)",
                border: "1px solid rgba(0,220,200,0.30)",
                fontSize: "11px",
                lineHeight: 1,
              }}
            >
              💊
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "13px",
                color: "#00c4b4",
                letterSpacing: "-0.2px",
              }}
            >
              Medoki
            </span>
            <span
              style={{
                fontSize: "11px",
                color: snapSubText,
                fontWeight: 400,
              }}
            >
              · Akıllı Sağlık Rehberi
            </span>
          </div>

          {/* Sağ: Uyarı notu */}
          <span
            style={{
              fontSize: "9px",
              color: snapSubText,
              maxWidth: "180px",
              textAlign: "right",
              lineHeight: 1.4,
            }}
          >
            Tıbbi tavsiye değildir.
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 text-xs text-muted-foreground min-h-[18px]" role="status" aria-live="polite">
        {statusMsg}
      </div>

      {/* Share FAB */}
      <button
        type="button"
        onClick={handleShare}
        disabled={!hasContent}
        className="btn-share-fab absolute z-[3] right-3.5 bottom-4"
        aria-label={t("results.share")}
        title={t("results.share")}
      >
        <Upload className="w-5 h-5 opacity-95 shrink-0" />
        <span className="whitespace-nowrap max-[400px]:sr-only text-xs">{t("results.share")}</span>
      </button>
    </section>
  );
};

export default ResultsScreen;
