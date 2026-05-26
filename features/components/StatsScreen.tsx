import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Flame, Trophy, Target, TrendingUp } from "lucide-react";

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => { if (user) loadStats(); }, [user]);

  async function loadStats() {
    const [statsRes, logsRes] = await Promise.all([
      supabase.from("user_game_stats").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("medication_logs").select("*").eq("user_id", user!.id).gte("scheduled_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (logsRes.data) {
      // Son 7 günü hazırla
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayLogs = logsRes.data!.filter((l: any) => l.scheduled_date === dateStr);
        return {
          date: dateStr,
          day: d.toLocaleDateString("tr-TR", { weekday: "short" }),
          taken: dayLogs.filter((l: any) => l.status === "taken").length,
        };
      });
      setWeeklyData(days);
    }
  }

  if (!user) return <div className="flex justify-center pt-20 text-muted-foreground text-sm">Giriş yapmanız gerekiyor.</div>;
  if (!stats) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const adherenceRate = stats.total_taken + stats.total_skipped > 0
    ? Math.round((stats.total_taken / (stats.total_taken + stats.total_skipped)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 pb-10 animate-fade-in-up">
      <h2 className="font-bold text-foreground text-lg">İstatistiklerim</h2>

      {/* Ana istatistikler */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Flame className="w-5 h-5 text-orange-400" />, label: "Mevcut Seri", value: `${stats.current_streak} gün`, bg: "bg-orange-500/10 border-orange-500/20" },
          { icon: <Trophy className="w-5 h-5 text-yellow-400" />, label: "En Uzun Seri", value: `${stats.longest_streak} gün`, bg: "bg-yellow-500/10 border-yellow-500/20" },
          { icon: <Target className="w-5 h-5 text-primary" />, label: "Uyum Oranı", value: `%${adherenceRate}`, bg: "bg-primary/10 border-primary/20" },
          { icon: <TrendingUp className="w-5 h-5 text-blue-400" />, label: "Toplam Alınan", value: `${stats.total_taken}`, bg: "bg-blue-500/10 border-blue-500/20" },
        ].map((item, i) => (
          <div key={i} className={`glass-card p-4 rounded-2xl border ${item.bg} flex flex-col gap-2`}>
            {item.icon}
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Seviye ve XP */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-foreground">Seviye {stats.level}</span>
          <span className="text-sm text-muted-foreground">{stats.xp} XP</span>
        </div>
        <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: `${stats.xp % 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Sonraki seviye: {100 - (stats.xp % 100)} XP</p>
      </div>

      {/* Son 7 gün */}
      <div className="glass-card p-4 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-3">Son 7 Gün</h3>
        <div className="flex items-end gap-2 h-24">
          {weeklyData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-primary/20 relative" style={{ height: "100%" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-lg bg-primary transition-all"
                  style={{ height: day.taken > 0 ? "100%" : "4px", opacity: day.taken > 0 ? 1 : 0.3 }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rozetler */}
      {stats.badges && stats.badges.length > 0 && (
        <div className="glass-card p-4 rounded-2xl">
          <h3 className="font-semibold text-foreground mb-3">Rozetlerim</h3>
          <div className="flex gap-3 flex-wrap">
            {stats.badges.map((b: string) => (
              <div key={b} className="flex flex-col items-center gap-1">
                <span className="text-3xl">{b === "7_days" ? "🏅" : b === "30_days" ? "🥈" : "🥇"}</span>
                <span className="text-xs text-muted-foreground">{b === "7_days" ? "7 Gün" : b === "30_days" ? "30 Gün" : "90 Gün"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
