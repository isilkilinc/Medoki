import { useState } from "react";
import AmbientBackground from "@/components/AmbientBackground";
import BottomNav, { TabType } from "@/components/BottomNav";
import TodayScreen from "@/components/TodayScreen";
import AddMedicationScreen from "@/components/AddMedicationScreen";
import StatsScreen from "@/components/StatsScreen";
import ProfileScreen from "@/components/ProfileScreen";
import SettingsScreen from "@/components/SettingsScreen";
import CommunityScreen from "@/components/CommunityScreen"; // YENİ EKRANI BURAYA IMPORT EDİYORUZ
import { useTheme } from "@/lib/theme";

const Index = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("home");

  return (
    <>
      <AmbientBackground />
      <header className="relative z-[1] pt-7 pb-3 text-center px-4 flex justify-center">
        <img src="/logo.png" alt="Medoki Logo" className="w-auto h-[100px] object-contain drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
      </header>
      <main className="relative z-[1] max-w-[480px] mx-auto px-4 pb-24">
        {activeTab === "home" && <TodayScreen />}
        {activeTab === "add" && <AddMedicationScreen onBack={() => setActiveTab("home")} />}
        {activeTab === "stats" && <StatsScreen />}
        {/* YENİ EKRANI BURAYA EKLİYORUZ */}
        {activeTab === "community" && <CommunityScreen />} 
        {activeTab === "profile" && <ProfileScreen />}
        {activeTab === "settings" && <SettingsScreen />}
      </main>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </>
  );
};

export default Index;
