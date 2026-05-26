import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Pill, Clock, Calendar, Palette } from "lucide-react";

const ICONS = ["💊", "💉", "🩺", "🫀", "🧬", "🌡️", "💆", "🏥"];
const COLORS = ["#34D399", "#60A5FA", "#F472B6", "#FBBF24", "#A78BFA", "#F87171", "#34D399", "#2DD4BF"];

interface Props {
  onBack: () => void;
}

export default function AddMedicationScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("💊");
  const [selectedColor, setSelectedColor] = useState("#34D399");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("İlaç adı zorunludur."); return; }
    if (!user) return;
    setSaving(true);
    const { error: err } = await supabase.from("medications").insert({
      user_id: user.id,
      name: name.trim(),
      dosage: dosage.trim(),
      times_per_day: timesPerDay,
      end_date: endDate || null,
      icon: selectedIcon,
      color: selectedColor,
    });
    setSaving(false);
    if (err) { setError("Kaydedilemedi. Tekrar deneyin."); return; }
    onBack();
  }

  return (
    <div className="flex flex-col gap-5 pb-10 animate-fade-in-up">
      <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
        <h2 className="font-bold text-foreground text-lg">Yeni İlaç Ekle</h2>

        {/* İlaç adı */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">İlaç Adı</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Örn: Majezik, D Vitamini..."
            className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground outline-none text-sm focus:border-primary/40"
          />
        </div>

        {/* Doz bilgisi */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">Doz (opsiyonel)</label>
          <input
            type="text"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            placeholder="Örn: 1 tablet, 500mg..."
            className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground outline-none text-sm focus:border-primary/40"
          />
        </div>

        {/* Günde kaç kez */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">Günde Kaç Kez</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setTimesPerDay(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${timesPerDay === n ? "bg-primary/15 border-primary/35 text-primary" : "bg-muted/40 border-border text-muted-foreground"}`}
              >
                {n}x
              </button>
            ))}
          </div>
        </div>

        {/* Bitiş tarihi */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">Bitiş Tarihi (opsiyonel)</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/50 text-foreground outline-none text-sm focus:border-primary/40"
          />
        </div>

        {/* İkon seç */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">İkon</label>
          <div className="flex gap-2 flex-wrap">
            {ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${selectedIcon === icon ? "border-primary/50 bg-primary/10" : "border-border bg-muted/40"}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Renk seç */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">Renk</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor...</> : "İlacı Kaydet"}
        </button>
      </div>
    </div>
  );
}
