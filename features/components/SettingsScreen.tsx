import { useState } from "react";
import {
  Moon, Sun, Globe, ChevronRight, ChevronDown,
  User, Mail, Lock, Save, Loader2,
  Shield, FileText, ScrollText,
  AlertTriangle, Trash2, Eye, EyeOff,
  Camera, Phone
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Ortak stil sabitleri ─────────────────────────────────────────────────────
const INPUT =
  "w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/40 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";

const COUNTRY_CODES = [
  { code: "+90", flag: "🇹🇷", label: "Turkey" },
  { code: "+1", flag: "🇺🇸", label: "US/Canada" },
  { code: "+44", flag: "🇬🇧", label: "UK" },
  { code: "+49", flag: "🇩🇪", label: "Germany" },
  { code: "+33", flag: "🇫🇷", label: "France" },
  { code: "+39", flag: "🇮🇹", label: "Italy" },
];

// ─── Açılır Kapanır (Accordion) Elemanı ──────────────────────────────────────
function AccordionItem({
  icon, title, subtitle, isOpen, onToggle, isDanger = false, children
}: {
  icon: React.ReactNode; title: string; subtitle?: string;
  isOpen: boolean; onToggle: () => void; isDanger?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`glass-card flex flex-col rounded-2xl border backdrop-blur-xl shadow-lg transition-colors overflow-hidden ${isDanger ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-background/60"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 px-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${isDanger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {icon}
          </div>
          <div>
            <h3 className={`font-bold text-sm ${isDanger ? "text-destructive" : "text-foreground"}`}>{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-90" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="p-5 pt-3 border-t border-border/10 flex flex-col gap-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { isDark, setIsDark } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();

  // ── Hesap Bilgilerim ──
  const [displayName, setDisplayName] = useState(
    (user?.user_metadata?.full_name as string) || ""
  );

  const initialSavedPhone = (user?.user_metadata?.phone as string) || "";
  let initialCountry = "+90";
  let initialLocalPhone = "";
  if (initialSavedPhone) {
    const matchedCode = COUNTRY_CODES.find(c => initialSavedPhone.startsWith(c.code));
    if (matchedCode) {
      initialCountry = matchedCode.code;
      initialLocalPhone = initialSavedPhone.slice(matchedCode.code.length);
    } else {
      initialLocalPhone = initialSavedPhone;
    }
  }

  const [countryCode, setCountryCode] = useState(initialCountry);
  const [phoneNumber, setPhoneNumber] = useState(initialLocalPhone);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // ── Güvenlik / Şifre ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isSavingPw, setIsSavingPw]           = useState(false);
  const [pwError, setPwError]                 = useState("");

  // ── Hesap Sil ──
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting]       = useState(false);

  // ── Legal Modal ──
  const [legalModal, setLegalModal] = useState<"kvkk" | "gizlilik" | "sozlesme" | null>(null);

  // ── Accordion State ──
  const [openPreferences, setOpenPreferences] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [openSecurity, setOpenSecurity] = useState(false);
  const [openLegal, setOpenLegal] = useState(false);
  const [openDanger, setOpenDanger] = useState(false);

  // ─── Hesap Bilgilerini Güncelle ────────────────────────────────────────────
  const handleSaveAccount = async () => {
    if (!user) return;
    setIsSavingAccount(true);
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: displayName.trim(),
        phone: phoneNumber.trim() ? `${countryCode}${phoneNumber.trim()}` : null 
      },
    });
    setIsSavingAccount(false);
    if (error) toast.error(t("results.error"));
    else toast.success(t("settings.update_success"));
  };

  // ─── Şifre Güncelle ───────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    setPwError("");
    if (!newPassword || !confirmPassword) {
      setPwError(t("settings.new_password_req"));
      return;
    }
    if (newPassword.length < 6) {
      setPwError(t("settings.new_password_req"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t("settings.results.error") || "Şifreler eşleşmiyor");
      return;
    }
    setIsSavingPw(true);
    // Önce mevcut şifreyle oturum doğrula
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });
    if (signInErr) {
      setIsSavingPw(false);
      setPwError("Mevcut şifre hatalı.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSavingPw(false);
    if (error) {
      setPwError("Hata: " + error.message);
    } else {
      toast.success(t("settings.update_password"));
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
  };

  // ─── Hesabı Sil ───────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== t("settings.delete_placeholder")) {
      toast.error("Hatalı metin.");
      return;
    }
    setIsDeleting(true);
    // Not: Supabase client-side'da kendi hesabını silmek için admin API gerekir.
    // Şimdilik kullanıcıyı bilgilendiriyoruz.
    await new Promise(r => setTimeout(r, 800));
    setIsDeleting(false);
    toast.error("Bu işlem için destek ekibimizle iletişime geçin: destek@medoki.app", { duration: 7000 });
    setDeleteConfirm("");
  };

  // ─── Legal modal içeriği ────────────────────────────────────────────────────
  const LEGAL_CONTENT: Record<string, { title: string; body: string[] }> = {
    kvkk: {
      title: t("settings.legal_kvkk"),
      body: [
        language === "tr" ? "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmış aydınlatma metnidir." : "This text is the clarification text prepared within the scope of the Personal Data Protection Law.",
        language === "tr" ? "Medoki olarak topladığımız e-posta adresiniz yalnızca hesap doğrulama ve hizmet bildirimleri amacıyla kullanılmaktadır." : "The email address we collect as Medoki is only used for account verification and service notifications.",
        language === "tr" ? "⚙️ Bu metin yakında tamamlanacaktır." : "⚙️ This text will be completed soon.",
      ],
    },
    gizlilik: {
      title: t("settings.legal_privacy"),
      body: [
        language === "tr" ? "Medoki, kullanıcı verilerini üçüncü şahıslarla paylaşmaz." : "Medoki does not share user data with third parties.",
        language === "tr" ? "Tüm veriler şifrelenmiş kanallar üzerinden iletilir ve Supabase altyapısında saklanır." : "All data is transmitted through encrypted channels and stored in the Supabase infrastructure.",
        language === "tr" ? "⚙️ Bu metin yakında tamamlanacaktır." : "⚙️ This text will be completed soon.",
      ],
    },
    sozlesme: {
      title: t("settings.legal_tos"),
      body: [
        language === "tr" ? "Medoki platformunu kullanarak bu sözleşme koşullarını kabul etmiş sayılırsınız." : "By using the Medoki platform, you accept these agreement conditions.",
        language === "tr" ? "Uygulama; sağlık bilgisi sağlama amacıyla tasarlanmış olup tıbbi tavsiye niteliği taşımamaktadır." : "The application is designed to provide health information and does not constitute medical advice.",
        language === "tr" ? "⚙️ Bu metin yakında tamamlanacaktır." : "⚙️ This text will be completed soon.",
      ],
    },
  };

  // ─── Şifre Input Yardımcısı ────────────────────────────────────────────────
  const PwInput = ({
    label, value, onChange, show, onToggle, placeholder,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; placeholder?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => { onChange(e.target.value); setPwError(""); }}
          className={INPUT + " pr-10"}
          placeholder={placeholder ?? "••••••••"}
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-12 animate-fade-in-up w-full">
      <h2 className="text-xl font-bold text-center text-foreground">{t("settings.management")}</h2>

      {/* ── KART 0: Tercihler (mevcut tema + dil) ── */}
      <AccordionItem
        icon={<Globe className="w-5 h-5" />}
        title={t("settings.preferences")}
        subtitle={t("settings.preferences_desc")}
        isOpen={openPreferences}
        onToggle={() => setOpenPreferences(!openPreferences)}
      >
        {/* Tema */}
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? "bg-indigo-500/15 text-indigo-400" : "bg-orange-500/15 text-orange-500"}`}>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold">{isDark ? t("settings.night_mode") : t("settings.day_mode")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.mode_desc")}</p>
            </div>
          </div>
          <div
            className={`w-11 h-6 rounded-full transition-colors relative shadow-inner cursor-pointer ${isDark ? "bg-primary" : "bg-muted-foreground/30"}`}
            onClick={() => setIsDark(!isDark)}
          >
            <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-transform shadow-md ${isDark ? "translate-x-[1.375rem]" : "translate-x-1"}`} />
          </div>
        </label>

        {/* Dil */}
        <div
          className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("settings.language")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.language_change")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-sm font-medium">{language === "tr" ? "Türkçe" : "English"}</span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </div>
        </div>
      </AccordionItem>

      {/* ── KART 1: Hesap Bilgilerim ── */}
      {user && (
        <AccordionItem
          icon={<User className="w-5 h-5" />}
          title={t("settings.account_info")}
          subtitle={t("settings.account_info_desc")}
          isOpen={openAccount}
          onToggle={() => setOpenAccount(!openAccount)}
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-[0_0_20px_rgba(52,211,153,0.2)] flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {(displayName || user.email || "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.photo_upload_soon")}</p>
          </div>

          {/* Ad Soyad */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.full_name")}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className={INPUT}
                placeholder={t("settings.full_name_placeholder")}
                autoComplete="name"
              />
            </div>
          </div>

          {/* E-posta (readonly) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={user.email ?? ""}
                readOnly
                className={INPUT + " opacity-60 cursor-not-allowed select-none"}
              />
            </div>
            <p className="text-xs text-muted-foreground/60">{t("settings.email_readonly_desc")}</p>
          </div>

          {/* Telefon Numarası (Opsiyonel) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.phone")}</label>
            <div className="relative flex items-center w-full h-11 rounded-xl border border-border bg-muted/40 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all overflow-hidden">
              <Phone className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              
              <div className="relative h-full flex items-center border-r border-border/60 pl-9">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="appearance-none bg-transparent h-full pl-1 pr-6 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-0 z-10"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code} className="bg-background text-foreground">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <input
                type="tel"
                value={phoneNumber}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPhoneNumber(val);
                }}
                className="flex-1 h-full px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                placeholder={t("settings.phone_placeholder")}
                autoComplete="tel-national"
              />
            </div>
          </div>

          <button
            onClick={handleSaveAccount}
            disabled={isSavingAccount}
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-primary/20"
          >
            {isSavingAccount
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t("settings.updating")}</>
              : <><Save className="w-4 h-4" />{t("settings.update_button")}</>
            }
          </button>
        </AccordionItem>
      )}

      {/* ── KART 2: Güvenlik ve Şifre ── */}
      {user && (
        <AccordionItem
          icon={<Shield className="w-5 h-5" />}
          title={t("settings.security")}
          subtitle={t("settings.security_desc")}
          isOpen={openSecurity}
          onToggle={() => setOpenSecurity(!openSecurity)}
        >
          <PwInput label={t("settings.current_password")} value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
          <PwInput label={t("settings.new_password")} value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(v => !v)} placeholder={t("settings.new_password_req")} />
          <PwInput label={t("settings.new_password_confirm")} value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />

          {pwError && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
              <span>✕</span> {pwError}
            </p>
          )}

          <button
            onClick={handleSavePassword}
            disabled={isSavingPw}
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-primary/20"
          >
            {isSavingPw
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t("settings.updating")}</>
              : <><Lock className="w-4 h-4" />{t("settings.update_password")}</>
            }
          </button>
        </AccordionItem>
      )}

      {/* ── KART 3: Yasal İzinler ── */}
      <AccordionItem
        icon={<FileText className="w-5 h-5" />}
        title={t("settings.legal")}
        isOpen={openLegal}
        onToggle={() => setOpenLegal(!openLegal)}
      >
        <div className="flex flex-col border border-border/30 rounded-xl overflow-hidden bg-muted/10">
          {(["kvkk", "gizlilik", "sozlesme"] as const).map((key, i) => {
            const ICONS = [<ScrollText className="w-4 h-4" />, <Shield className="w-4 h-4" />, <FileText className="w-4 h-4" />];
            const LABELS = [t("settings.legal_kvkk"), t("settings.legal_privacy"), t("settings.legal_tos")];
            const DESCS  = [t("settings.legal_kvkk_desc"), t("settings.legal_privacy_desc"), t("settings.legal_tos_desc")];
            return (
              <button
                key={key}
                onClick={() => setLegalModal(key)}
                className={`flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group ${i < 2 ? "border-b border-border/30" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground group-hover:text-primary transition-colors">
                    {ICONS[i]}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{LABELS[i]}</p>
                    <p className="text-xs text-muted-foreground">{DESCS[i]}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </AccordionItem>

      {/* ── KART 4: Tehlikeli Bölge ── */}
      {user && (
        <AccordionItem
          icon={<AlertTriangle className="w-5 h-5" />}
          title={t("settings.danger_zone")}
          subtitle={t("settings.danger_zone_desc")}
          isOpen={openDanger}
          onToggle={() => setOpenDanger(!openDanger)}
          isDanger
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground leading-relaxed" 
               dangerouslySetInnerHTML={{ __html: language === "tr" ? 'Hesabınızı silmek için aşağıya tam olarak <span class="font-mono font-bold text-destructive/80">hesabımı sil</span> yazın ve butona basın.' : 'To delete your account, type exactly <span class="font-mono font-bold text-destructive/80">hesabımı sil</span> below.' }}
            />
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-destructive/30 bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40 focus:border-destructive/50 transition-all font-mono"
              placeholder={t("settings.delete_placeholder")}
            />
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirm !== t("settings.delete_placeholder")}
              className="w-full h-11 rounded-xl border border-destructive/50 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/10 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting
                ? <><Loader2 className="w-4 h-4 animate-spin" />{t("settings.processing")}</>
                : <><Trash2 className="w-4 h-4" />{t("settings.delete_button")}</>
              }
            </button>
          </div>
        </AccordionItem>
      )}

      {/* ── Legal Modal ── */}
      {legalModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="relative w-full max-w-sm bg-background/95 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl p-8 flex flex-col gap-5 animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLegalModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
            <div className="pr-6">
              <h3 className="text-base font-bold text-foreground">{LEGAL_CONTENT[legalModal].title}</h3>
              <p className="text-xs text-primary/70 font-medium tracking-wide uppercase mt-0.5">Medoki · {new Date().getFullYear()}</p>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed max-h-64 overflow-y-auto pr-1">
              {LEGAL_CONTENT[legalModal].body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <button
              onClick={() => setLegalModal(null)}
              className="w-full h-10 rounded-xl bg-primary/90 hover:bg-primary text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-md shadow-primary/20"
            >
              {t("settings.got_it")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
