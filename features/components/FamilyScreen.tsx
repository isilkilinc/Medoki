import { useState, useEffect } from "react";
import { Plus, User, Pill, Activity, X, Loader2, Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export interface FamilyProfile {
  id: string;
  name: string;
  age: string;
  medications: string[];
}

const FamilyScreen = () => {
  const { user } = useAuth();
  const { triggerAction } = useGamification();
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [medicationsStr, setMedicationsStr] = useState("");

  useEffect(() => {
    if (user) {
      const family = user.user_metadata?.family_profiles || [];
      setProfiles(family);
    }
    setIsLoading(false);
  }, [user]);

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setIsSaving(true);

    const medsArray = medicationsStr
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const newProfile: FamilyProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      age: age.trim(),
      medications: medsArray,
    };

    const updatedProfiles = [...profiles, newProfile];

    try {
      const { error } = await supabase.auth.updateUser({
        data: { family_profiles: updatedProfiles },
      });

      if (error) throw error;

      setProfiles(updatedProfiles);
      setIsModalOpen(false);
      setName("");
      setAge("");
      setMedicationsStr("");
      
      triggerAction("first_family");
    } catch (err) {
      console.error("Profil kaydedilemedi:", err);
      alert("Kayıt sırasında bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("Bu profili silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    const updatedProfiles = profiles.filter((p) => p.id !== id);
    setProfiles(updatedProfiles); // optimistic update

    try {
      await supabase.auth.updateUser({
        data: { family_profiles: updatedProfiles },
      });
    } catch (err) {
      console.error("Silme hatası:", err);
      setProfiles(profiles); // revert
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in-up">
        <Heart className="w-16 h-16 text-emerald-500 mb-4 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Yakınlarım</h2>
        <p className="text-muted-foreground mb-6">
          Sevdiklerinizin ilaçlarını takip etmek için lütfen giriş yapın.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Yakınlarım</h2>
          <p className="text-sm text-muted-foreground">Sevdiklerinizin ilaç takibi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Yeni Ekle
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card rounded-2xl border border-border shadow-sm">
          <UsersIconEmpty />
          <h3 className="text-lg font-semibold mb-1">Henüz profil eklenmedi</h3>
          <p className="text-sm text-muted-foreground">
            Ailenizden veya sevdiklerinizden birini ekleyerek ilaçlarını kaydetmeye başlayın.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="group relative bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{profile.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      {profile.age && (
                        <>
                          <span>{profile.age} Yaş</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                        </>
                      )}
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Pill className="w-3 h-3" />
                        {profile.medications.length} İlaç
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(profile.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {profile.medications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/50"
                    >
                      {med}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Düzenli ilaç kaydı yok.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">Yeni Profil Ekle</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Yakınlık Derecesi veya İsim <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Annem, Babam, Ali..."
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Yaş</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Örn: 55"
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Düzenli Kullandığı İlaçlar
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  İlaç isimlerini virgül ile ayırarak yazabilirsiniz.
                </p>
                <textarea
                  value={medicationsStr}
                  onChange={(e) => setMedicationsStr(e.target.value)}
                  placeholder="Örn: Tansiyon ilacı, Parol, Arveles..."
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-y"
                />
              </div>
            </div>

            <div className="p-5 border-t border-border bg-muted/30">
              <button
                onClick={handleSave}
                disabled={!name.trim() || isSaving}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG component for empty state
function UsersIconEmpty() {
  return (
    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
      <User className="w-8 h-8 opacity-50" />
    </div>
  );
}

export default FamilyScreen;
