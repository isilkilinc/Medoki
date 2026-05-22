import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export interface GamificationData {
  xp: number;
  level: number;
  badges: string[];
  search_count: number;
  triggers: Record<string, boolean>;
}

const DEFAULT_GAMIFICATION: GamificationData = {
  xp: 0,
  level: 1,
  badges: [],
  search_count: 0,
  triggers: {},
};

export const BADGES = {
  HEALTH_APPRENTICE: { id: "health_apprentice", name: "Sağlık Çırağı", desc: "İlk ilacını başarıyla analiz edenlere." },
  SHARP_EYE: { id: "sharp_eye", name: "Keskin Göz", desc: "Kamera ile ilk kez ilaç tanıtanlara." },
  FAMILY_PROTECTOR: { id: "family_protector", name: "Aile Reisi / Koruyucu", desc: "İlk aile profilini ekleyenlere." },
  CONSCIOUS_CONSUMER: { id: "conscious_consumer", name: "Bilinçli Tüketici", desc: "Toplanda 5 ilaç analiz edenlere." },
};

interface GamificationContextType {
  data: GamificationData;
  addXP: (amount: number) => Promise<void>;
  awardBadge: (badgeId: string) => Promise<void>;
  incrementSearchCount: () => Promise<void>;
  triggerAction: (actionId: string) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [data, setData] = useState<GamificationData>(DEFAULT_GAMIFICATION);

  useEffect(() => {
    if (user) {
      const stored = user.user_metadata?.gamification as GamificationData | undefined;
      if (stored) {
        setData({ ...DEFAULT_GAMIFICATION, ...stored });
      } else {
        setData(DEFAULT_GAMIFICATION);
      }
    } else {
      setData(DEFAULT_GAMIFICATION);
    }
  }, [user]);

  const saveToSupabase = async (newData: GamificationData) => {
    if (!user) return;
    try {
      await supabase.auth.updateUser({
        data: { gamification: newData }
      });
    } catch (err) {
      console.error("Failed to save gamification data", err);
    }
  };

  const addXP = async (amount: number) => {
    setData((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let leveledUp = false;

      // Her 100 XP'de 1 seviye atlar
      while (newXp >= newLevel * 100) {
        newLevel += 1;
        leveledUp = true;
      }

      const newData = { ...prev, xp: newXp, level: newLevel };
      saveToSupabase(newData);

      if (leveledUp) {
        toast.success(`Tebrikler! Seviye ${newLevel} oldunuz! 🎉`);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#ffffff", "#f59e0b"]
        });
      }

      return newData;
    });
  };

  const awardBadge = async (badgeId: string) => {
    setData((prev) => {
      if (prev.badges.includes(badgeId)) return prev; // Zaten varsa dön
      
      const newData = { ...prev, badges: [...prev.badges, badgeId] };
      saveToSupabase(newData);
      
      const badgeInfo = Object.values(BADGES).find(b => b.id === badgeId);
      if (badgeInfo) {
        toast.success(`Yeni Rozet Açıldı: ${badgeInfo.name} 🏅`);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#fbbf24", "#f59e0b"]
        });
      }
      
      return newData;
    });
  };

  const incrementSearchCount = async () => {
    if (!user) return;
    
    setData((prev) => {
      const newCount = prev.search_count + 1;
      const newData = { ...prev, search_count: newCount };
      saveToSupabase(newData);
      
      // Tetikleyiciler (Triggers)
      if (newCount === 1 && !prev.badges.includes(BADGES.HEALTH_APPRENTICE.id)) {
        setTimeout(() => {
          addXP(10);
          awardBadge(BADGES.HEALTH_APPRENTICE.id);
        }, 500);
      }
      
      if (newCount === 5 && !prev.badges.includes(BADGES.CONSCIOUS_CONSUMER.id)) {
        setTimeout(() => {
          awardBadge(BADGES.CONSCIOUS_CONSUMER.id);
        }, 500);
      }

      return newData;
    });
  };

  const triggerAction = async (actionId: "first_camera" | "first_family") => {
    if (!user) return;
    
    setData((prev) => {
      if (prev.triggers[actionId]) return prev; // Zaten tetiklenmişse dön

      const newTriggers = { ...prev.triggers, [actionId]: true };
      const newData = { ...prev, triggers: newTriggers };
      saveToSupabase(newData);

      setTimeout(() => {
        if (actionId === "first_camera") {
          addXP(20);
          awardBadge(BADGES.SHARP_EYE.id);
        } else if (actionId === "first_family") {
          addXP(30);
          awardBadge(BADGES.FAMILY_PROTECTOR.id);
        }
      }, 500);

      return newData;
    });
  };

  return (
    <GamificationContext.Provider value={{ data, addXP, awardBadge, incrementSearchCount, triggerAction }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
};
