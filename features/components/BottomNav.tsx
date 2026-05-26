import { Home, PlusCircle, BarChart2, User, Settings } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
export type TabType = "home" | "add" | "stats" | "profile" | "settings";

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

const BottomNav = ({ activeTab, onChangeTab }: BottomNavProps) => {
  const { t } = useLanguage();
  return (
    <nav className="bottom-nav" aria-label="Navigation">
      <button className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => onChangeTab('home')}>
        <Home className="w-5 h-5" /><span>Bugün</span>
      </button>
      <button className={`bottom-nav-item ${activeTab === 'add' ? 'active' : ''}`} onClick={() => onChangeTab('add')}>
        <PlusCircle className="w-5 h-5" /><span>İlaç Ekle</span>
      </button>
      <button className={`bottom-nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => onChangeTab('stats')}>
        <BarChart2 className="w-5 h-5" /><span>İstatistik</span>
      </button>
      <button className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => onChangeTab('profile')}>
        <User className="w-5 h-5" /><span>Profil</span>
      </button>
      <button className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => onChangeTab('settings')}>
        <Settings className="w-5 h-5" /><span>Ayarlar</span>
      </button>
    </nav>
  );
};
export default BottomNav;
