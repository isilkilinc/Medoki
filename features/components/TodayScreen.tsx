import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Circle, Flame, Star, Trophy } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  color: string;
  icon: string;
  times_per_day: number;
}

interface GameStats {
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_taken: number;
  badges: string[];
}

interface TodayLog {
  medication_id: string;
  status: string;
}

export default function TodayScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<TodayLog[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [medsRes, logsRes, statsRes] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", user!.id).eq("is_active", true),
      supabase.from("medication_logs").select("*").eq("user_id", user!.id).eq("scheduled_date", today),
      supabase.from("user_game_stats").select("*").eq("user_id", user!.id).maybeSingle(),
    ]);
    if (medsRes.data) setMedications(medsRes.data);
    if (logsRes.data) setTodayLogs(logsRes.data);
    if (statsRes.data) setGameStats(statsRes.data);
    setLoading(false);
  }

  async function handleCheckIn(medicationId: string) {
    if (!user) return;
    const alreadyTaken = todayLogs.find(l => l.medication_id === medicationId && l.status === "taken");
    if (alreadyTaken) return;

    await supabase.from("medication_logs").insert({
      user_id: user.id,
      medication_id: medicationId,
      scheduled_date: today,
      status: "taken",
    });

    // XP ve streak güncelle
    const currentStats = gameStats || { xp: 0, level: 1, current_streak: 0, longest_streak: 0, total_taken: 0, badges: [] };
    const newXp = currentStats.xp + 10;
    const newLevel = Math.floor(newXp / 100) + 1;
    // Seri Kırılma Mantığı:
    let newStreak = currentStats.current_streak;
    
    if (currentStats.last_check_in) {
      // Önceki giriş ile bugün arasındaki gün farkını bul
      const lastDate = new Date(currentStats.last_check_in);
      const currDate = new Date(today);
      const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1; // Süper! Peş peşe 2. gün, seri artıyor.
      } else if (diffDays > 1) {
        newStreak = 1;  // Eyvah! Aradan gün geçmiş, seri sıfırlandı.
      }
    } else {
      newStreak = 1; // Sisteme ilk defa giriyor.
    }
    
    const newLongest = Math.max(newStreak, currentStats.longest_streak);

    // Rozet kontrolü
    const badges = [...(currentStats.badges || [])];
    if (newStreak === 7 && !badges.includes("7_days")) badges.push("7_days");
    if (newStreak === 30 && !badges.includes("30_days")) badges.push("30_days");
    if (newStreak === 90 && !badges.includes("90_days")) badges.push("90_days");

    await supabase.from("user_game_stats").upsert({
      user_id: user.id,
      xp: newXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongest,
      total_taken: currentStats.total_taken + 1,
      last_check_in: today,
      badges,
      updated_at: new Date().toISOString(),
    });

    loadData();
  }

  const takenCount = todayLogs.filter(l => l.status === "taken").length;
  const totalCount = medications.length;
  const progressPercent = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

  if (!user) return (
    <div className="flex flex-col items-center justify-center pt-20 gap-4 px-6 text-center">
      <Trophy className="w-16 h-16 text-primary/40" />
      <h2 className="text-xl font-bold text-foreground">Medoki'ye Hoş Geldin!</h2>
      <p className="text-sm text-muted-foreground">İlaç takibine başlamak için giriş yap.</p>
    </div>
  );

  if (loading) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-5 pb-10 animate-fade-in-up">
      {/* Oyun istatistikleri */}
      {gameStats && (
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="font-bold text-foreground">{gameStats.current_streak} günlük seri</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-foreground">Seviye {gameStats.level}</span>
              <span className="text-xs text-muted-foreground">{gameStats.xp} XP</span>
            </div>
          </div>
          {/* XP progress bar */}
          <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
              style={{ width: `${(gameStats.xp % 100)}%` }}
            />
          </div>
          {/* Rozetler */}
          {gameStats.badges.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {gameStats.badges.map(b => (
                <span key={b} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {b === "7_days" ? "🏅 7 Gün" : b === "30_days" ? "🥈 30 Gün" : b === "90_days" ? "🥇 90 Gün" : b}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Günlük ilerleme */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-foreground">Bugünkü İlaçlar</h2>
          <span className="text-sm text-muted-foreground">{takenCount}/{totalCount}</span>
        </div>
        <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {medications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Henüz ilaç eklemediniz. Aşağıdan ekleyebilirsiniz.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {medications.map(med => {
              const taken = todayLogs.find(l => l.medication_id === med.id && l.status === "taken");
              return (
                <div key={med.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${taken ? "border-primary/30 bg-primary/5" : "border-border bg-card/60"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{med.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{med.name}</p>
                      {med.dosage && <p className="text-xs text-muted-foreground">{med.dosage}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckIn(med.id)}
                    disabled={!!taken}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${taken ? "bg-primary/20 text-primary cursor-default" : "bg-primary text-white hover:bg-primary/90 active:scale-95"}`}
                  >
                    {taken ? <><CheckCircle className="w-3.5 h-3.5" /> Alındı</> : <><Circle className="w-3.5 h-3.5" /> Aldım</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
