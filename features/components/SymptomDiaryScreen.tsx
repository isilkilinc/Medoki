import { useState } from "react";
import { Loader2, BookHeart, Activity, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { checkSideEffect } from "@/lib/groq";
import NearbyPharmacies from "@/components/NearbyPharmacies";

const SymptomDiaryScreen = () => {
  const { user } = useAuth();
  const [medicineName, setMedicineName] = useState("");
  const [symptomsText, setSymptomsText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim() || !symptomsText.trim()) return;

    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const aiFeedback = await checkSideEffect(medicineName, symptomsText);
      setFeedback(aiFeedback);

      if (user) {
        // Yalnızca Supabase hatasını görmezden gel, kullanıcı analiz sonucunu alsın
        try {
          await supabase.from("symptom_logs").insert([
            {
              user_id: user.id,
              medicine_name: medicineName,
              symptoms_text: symptomsText,
              ai_feedback: aiFeedback,
            }
          ]);
        } catch (dbErr) {
          console.warn("Supabase kayıt hatası (tablo olmayabilir):", dbErr);
        }
      } else {
        // Local state fallback if not logged in
        const logs = JSON.parse(localStorage.getItem("medoki_symptom_logs") || "[]");
        logs.push({
          id: Date.now().toString(),
          medicine_name: medicineName,
          symptoms_text: symptomsText,
          ai_feedback: aiFeedback,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("medoki_symptom_logs", JSON.stringify(logs));
      }
    } catch (err) {
      console.error(err);
      alert("Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setMedicineName("");
    setSymptomsText("");
    setFeedback(null);
  };

  return (
    <div className="w-full animate-fade-in-up pb-24">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <BookHeart className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Günlük</h2>
          <p className="text-sm text-muted-foreground">Yan etki ve semptom takibi</p>
        </div>
      </div>

      {!feedback && !isAnalyzing && (
        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Hangi ilacı kullanıyorsun?
              </label>
              <input
                type="text"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                placeholder="Örn: Parol, Majezik, Augmentin..."
                className="w-full bg-background border border-input rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Nasıl hissediyorsun? Şikayetlerini yaz...
              </label>
              <textarea
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                placeholder="Örn: İlacı içtikten sonra midem bulandı ve başım dönmeye başladı..."
                className="w-full bg-background border border-input rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] resize-y"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!medicineName.trim() || !symptomsText.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl font-bold text-[15px] disabled:opacity-50 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
            >
              <Send className="w-5 h-5" />
              Semptomları Analiz Et
            </button>
          </form>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-pulse">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
            <Activity className="w-10 h-10 text-primary absolute animate-ping opacity-20" />
            <Activity className="w-10 h-10 text-primary relative z-10" />
          </div>
          <h3 className="text-xl font-bold mb-2">Yapay Zeka Analiz Ediyor...</h3>
          <p className="text-muted-foreground text-sm max-w-[280px]">
            Semptomlarınızın ilacın bilinen yan etkilerinden olup olmadığı inceleniyor. Lütfen bekleyin.
          </p>
        </div>
      )}

      {feedback && !isAnalyzing && (
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 mx-auto text-emerald-600 dark:text-emerald-400">
             <BookHeart className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-center mb-4 text-foreground">Analiz Sonucu</h3>
          <p className="text-base text-foreground/90 leading-relaxed text-center mb-8">
            {feedback}
          </p>
          <button
            onClick={resetForm}
            className="w-full py-3.5 rounded-xl font-semibold bg-background border border-border shadow-sm hover:bg-muted transition-all active:scale-[0.98]"
          >
            Yeni Giriş Ekle
          </button>
        </div>
      )}

      {/* Nöbetçi Eczaneler Modülü */}
      <NearbyPharmacies />
    </div>
  );
};


export default SymptomDiaryScreen;
