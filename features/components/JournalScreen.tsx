import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BookHeart, CheckCircle, Sparkles } from "lucide-react";

const MOODS = [
  { emoji: "😫", label: "Kötü", value: "terrible" },
  { emoji: "😔", label: "Yorgun", value: "tired" },
  { emoji: "😐", label: "Normal", value: "okay" },
  { emoji: "🙂", label: "İyi", value: "good" },
  { emoji: "🤩", label: "Harika", value: "great" },
];

export default function JournalScreen() {
  const { user } = useAuth();
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) checkTodaysJournal();
  }, [user]);

  // Bugün günlük yazılmış mı kontrol et
  async function checkTodaysJournal() {
    const { data } = await supabase
      .from("journals")
      .select("*")
      .eq("user_id", user!.id)
      .eq("entry_date", today)
      .maybeSingle();

    if (data) {
      setMood(data.mood);
      setNote(data.note);
      setIsSaved(true);
    }
  }

  async function handleSave() {
    if (!user || !mood) return;
    setLoading(true);

    try {
      // 1. Günlüğü Kaydet
      await supabase.from("journals").upsert({
        user_id: user.id,
        entry_date: today,
        mood,
        note,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, entry_date' });

      // 2. XP Ekle (Eğer ilk defa kaydediyorsa)
      if (!isSaved) {
        const { data: currentStats } = await supabase
          .from("user_game_stats")
          .select("xp, level")
          .eq("user_id", user.id)
          .maybeSingle();

        if (currentStats) {
          const newXp = currentStats.xp + 15; // Günlük yazma ödülü: 15 XP!
          const newLevel = Math.floor(newXp / 100) + 1;

          await supabase.from("user_game_stats").update({
            xp: newXp,
            level: newLevel,
          }).eq("user_id", user.id);
        }
      }

      setIsSaved(true);
    } catch (error) {
      console.error("Günlük kaydedilemedi:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5 pb-10 animate-fade-in-up">
      {/* Başlık Kartı */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/20 rounded-2xl">
          <BookHeart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Günlüğüm</h2>
          <p className="text-sm text-muted-foreground">Bugün kendini nasıl hissediyorsun?</p>
        </div>
      </div>

      <div className="glass-card p-5 rounded-3xl border border-border/50">
        
        {/* Ruh Hali Seçici */}
        <p className="text-sm font-semibold text-foreground mb-4">Ruh Hali</p>
        <div className="flex justify-between items-center mb-6">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => !isSaved && setMood(m.value)}
              disabled={isSaved}
              className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
                mood === m.value 
                  ? "bg-primary/20 scale-110" 
                  : "hover:bg-muted/30 grayscale opacity-60"
              } ${isSaved && mood !== m.value ? "opacity-20" : "opacity-100"}`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className={`text-[10px] font-medium ${mood === m.value ? "text-primary" : "text-muted-foreground"}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* Not Alanı */}
        <p className="text-sm font-semibold text-foreground mb-3">Günlük Notların</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isSaved}
          placeholder="İlaçların yan etkisi oldu mu? Bugün seni ne gülümsetti? Burası senin güvenli alanın..."
          className="w-full h-32 bg-background/50 border border-border/50 rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-4"
        />

        {/* Kaydet Butonu */}
        {!isSaved ? (
          <button
            onClick={handleSave}
            disabled={!mood || loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Günlüğü Kaydet (+15 XP)
              </>
            )}
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary py-3.5 rounded-2xl font-bold text-sm border border-primary/20">
            <CheckCircle className="w-4 h-4" />
            Bugünün günlüğü kaydedildi
          </div>
        )}
      </div>
    </div>
  );
}
