import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, ArrowRight, Loader2, Sun, Moon, X, UserRound, ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { session, signInWithGoogle } = useAuth();
  const { isDark, setIsDark } = useTheme();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // YENİ: Şifremi unuttum ekranı için
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [modalType, setModalType] = useState<"kvkk" | "sozlesme" | null>(null);

  // Zaten giriş yapmışsa Ana Sayfaya yönlendir
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  // Normal Giriş/Kayıt Fonksiyonu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!isLogin) {
      if (!fullName.trim()) {
        toast.error("Lütfen adınızı ve soyadınızı giriniz.");
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError("Şifreler eşleşmiyor.");
        return;
      }
    }

    if (!email || !password) {
      toast.error("Lütfen tüm alanları doldurunuz.");
      return;
    }
    
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
            toast.error(
              "Lütfen giriş yapmadan önce e-postanıza gönderilen onay linkine tıklayarak hesabınızı aktifleştirin.",
              { duration: 6000 }
            );
          } else {
            toast.error("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
          }
          return;
        }
        toast.success("Başarıyla giriş yapıldı.");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;
        toast.success(`Hoş geldin, ${fullName.split(" ")[0]}! Hesabın oluşturuldu 🎉`);
        navigate("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // YENİ: Şifre Sıfırlama Fonksiyonu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Lütfen kayıtlı e-posta adresinizi giriniz.");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`, // Yönlendirme adresi
      });
      if (error) throw error;
      toast.success("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!");
      setIsForgotPassword(false); // Başarılı olunca giriş ekranına dön
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sıfırlama linki gönderilemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error("Google ile giriş yapılamadı.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      {/* Üst Kısım: Tema Değiştirici */}
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-full bg-muted/40 text-foreground shadow-sm border border-border/50 hover:bg-muted/80 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col animate-fade-in-up">
        {/* Logo/Başlık Alanı */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img 
            src="/logo.png" 
            alt="Medoki Logo" 
            className="w-auto h-[144px] object-contain relative z-10 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)] -mb-2" 
          />
          <div className="text-center flex flex-col items-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Medoki</h1>
            <p className="text-xs font-bold text-primary/80 tracking-widest uppercase mt-0.5">Akıllı Sağlık Rehberiniz</p>
          </div>
        </div>

        {
