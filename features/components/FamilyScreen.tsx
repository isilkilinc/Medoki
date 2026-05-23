import { useState, useEffect } from "react";
import { Plus, User, Pill, X, Loader2, Heart, Trash2, Clock, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { useNotifications, MedicationReminder } from "@/hooks/useNotifications";

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
  
  // Custom hook for notifications
  const { reminders, fetchReminders, setReminders } = useNotifications();

  // Tab state
  const [activeTab, setActiveTab] = useState<"profiles" | "reminders">("profiles");

  // Profile States
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [medicationsStr, setMedicationsStr] = useState("");

  // Reminder States
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [targetPerson, setTargetPerson] = useState("Kendim");
  const [medicationName, setMedicationName] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [isSavingReminder, setIsSavingReminder] = useState(false);

  useEffect(() => {
    if (user) {
      const family = user.user_metadata?.family_profiles || [];
      setProfiles(family);
    }
    setIsLoading(false);
  }, [user]);

  const handleSaveProfile = async () => {
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
      setIsProfileModalOpen(false);
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

  const handleDeleteProfile = async (id: string) => {
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

  const handleSaveReminder = async () => {
    if (!medicationName.trim() || !reminderTime || !user) return;
    setIsSavingReminder(true);

    const newReminder = {
      user_id: user.id,
      target_person: targetPerson,
      medication_name: medicationName.trim(),
      reminder_time: reminderTime,
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from("medication_reminders")
        .insert([newReminder])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setReminders([...reminders, data[0] as MedicationReminder]);
      } else {
        fetchReminders();
      }

      setIsReminderModalOpen(false);
      setMedicationName("");
      setReminderTime("");
      setTargetPerson("Kendim");
    } catch (err) {
      console.error("Hatırlatıcı kaydedilemedi:", err);
      alert("Hatırlatıcı eklenirken bir hata oluştu.");
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleToggleReminder = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    const updatedReminders = reminders.map(r => 
      r.id === id ? { ...r, is_active: !currentStatus } : r
    );
    setReminders(updatedReminders);

    try {
      const { error } = await supabase
        .from("medication_reminders")
        .update({ is_active: !currentStatus })
        .eq("id", id);
        
      if (error) throw error;
    } catch (err) {
      console.error("Hatırlatıcı güncellenemedi:", err);
      // Revert on error
      fetchReminders();
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const confirmDelete = window.confirm("Bu hatırlatıcıyı silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    const updatedReminders = reminders.filter(r => r.id !== id);
    setReminders(updatedReminders);

    try {
      const { error } = await supabase
        .from("medication_reminders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Hatırlatıcı silinemedi:", err);
      fetchReminders();
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in-up">
        <Heart className="w-16 h-16 text-emerald-500 mb-4 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Aile & Hatırlatıcılar</h2>
        <p className="text-muted-foreground mb-6">
          Sevdiklerinizin ilaçlarını ve hatırlatıcıları takip etmek için lütfen giriş yapın.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up pb-24">
      {/* Header and Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {activeTab === "profiles" ? "Yakınlarım" : "Hatırlatıcılar"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === "profiles" 
                ? "Sevdiklerinizin ilaç takibi" 
                : "Düzenli ilaç kullanım bildirimleri"}
            </p>
          </div>
          <button
            onClick={() => activeTab === "profiles" ? setIsProfileModalOpen(true) : setIsReminderModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Yeni Ekle
          </button>
        </div>

        {/* Custom Tab Switcher */}
        <div className="flex p-1 bg-muted rounded-xl w-full">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "profiles"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Profiller
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "reminders"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hatırlatıcılar
          </button>
        </div>
      </div>

      {/* Profiles Tab Content */}
      {activeTab === "profiles" && (
        isLoading ? (
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
                    onClick={() => handleDeleteProfile(profile.id)}
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
        )
      )}

      {/* Reminders Tab Content */}
      {activeTab === "reminders" && (
        reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card rounded-2xl border border-border shadow-sm">
             <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
                <Bell className="w-8 h-8 opacity-50" />
             </div>
            <h3 className="text-lg font-semibold mb-1">Hatırlatıcı bulunamadı</h3>
            <p className="text-sm text-muted-foreground">
              İlaç saatlerini kaçırmamak için yeni bir hatırlatıcı ekleyin.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="group relative bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 ${reminder.is_active ? 'bg-primary/10' : 'bg-muted'}`} />
                
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${reminder.is_active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">{reminder.reminder_time}</h3>
                      <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {reminder.target_person}
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3">
                     <button
                        type="button"
                        onClick={() => handleToggleReminder(reminder.id, reminder.is_active)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${reminder.is_active ? 'bg-primary' : 'bg-input'}`}
                     >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${reminder.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                     </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 bg-muted/30 p-3 rounded-xl border border-border/50">
                   <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-sm">{reminder.medication_name}</span>
                   </div>
                   
                   <button 
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">Yeni Profil Ekle</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
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
                onClick={handleSaveProfile}
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

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">Yeni Hatırlatıcı Ekle</h3>
              <button
                onClick={() => setIsReminderModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Kimin İçin <span className="text-destructive">*</span>
                </label>
                <select
                  value={targetPerson}
                  onChange={(e) => setTargetPerson(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                >
                  <option value="Kendim">Kendim</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Hangi İlaç <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  placeholder="Örn: Parol"
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Saat <span className="text-destructive">*</span>
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="p-5 border-t border-border bg-muted/30">
              <button
                onClick={handleSaveReminder}
                disabled={!medicationName.trim() || !reminderTime || isSavingReminder}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                {isSavingReminder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Hatırlatıcı Kur"
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
