import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // YENİ: Şifre tekrar state'i
  const [errorMsg, setErrorMsg] = useState(""); // YENİ: Eşleşmeme hatası için state
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword.length < 6) {
      toast.error("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    // YENİ: Şifreler uyuşuyor mu kontrolü
    if (newPassword !== confirmPassword) {
      setErrorMsg("Şifreler eşleşmiyor.");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success("Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.");
      navigate("/login"); 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Şifre güncellenemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col animate-fade-in-up">
        <div className="glass-card flex flex-col gap-5 p-6 rounded-3xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-xl">
          
          <div className="mb-2 text-center">
            <h2 className="text-xl font-bold">Yeni Şifre Belirle</h2>
            <p className="text-sm text-muted-foreground mt-2">Lütfen Medoki hesabınız için yeni bir şifre girin.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            
            {/* Şifre Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Yeni Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(""); }}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="En az 6 karakter"
                  required
                />
              </div>
            </div>

            {/* Şifre Tekrar Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(""); }}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errorMsg
                      ? "border-destructive/70 focus:ring-destructive/40 focus:border-destructive/70"
                      : "border-border focus:ring-primary/50 focus:border-primary/50"
                  }`}
                  placeholder="Şifrenizi tekrar girin"
                  required
                />
              </div>
              {errorMsg && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <span>✕</span> {errorMsg}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full h-11 mt-2 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Şifreyi Güncelle"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
