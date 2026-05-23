import { Home, Search, Camera, User, Settings, Users, BookHeart } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export type TabType = "home" | "search" | "diary" | "family" | "profile" | "settings";

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onScanClick: () => void;
}

const BottomNav = ({ activeTab, onChangeTab, onScanClick }: BottomNavProps) => {
  const { t } = useLanguage();
  return (
    <nav className="bottom-nav relative" aria-label="Navigation">
      {/* Sol Grup (2 İkon) */}
      <div className="flex flex-1 justify-evenly items-center">
        <button 
          className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} 
          aria-label={t("nav.home")}
          onClick={() => onChangeTab('home')}
        >
          <Home className="w-5 h-5" />
          <span>{t("nav.home")}</span>
        </button>
        <button 
          className={`bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`} 
          aria-label={t("nav.search")}
          onClick={() => onChangeTab('search')}
        >
          <Search className="w-5 h-5" />
          <span>{t("nav.search")}</span>
        </button>
        <button 
          className={`bottom-nav-item ${activeTab === 'diary' ? 'active' : ''}`} 
          aria-label="Günlük"
          onClick={() => onChangeTab('diary')}
        >
          <BookHeart className="w-5 h-5" />
          <span>Günlük</span>
        </button>
      </div>

      {/* Merkez Boşluk (Kamera İçin) */}
      <div className="w-[68px] flex-shrink-0" aria-hidden="true" />

      {/* Sağ Grup (3 İkon) */}
      <div className="flex flex-1 justify-evenly items-center">
        <button 
          className={`bottom-nav-item ${activeTab === 'family' ? 'active' : ''}`} 
          aria-label={t("nav.family")}
          onClick={() => onChangeTab('family')}
        >
          <Users className="w-5 h-5" />
          <span>{t("nav.family")}</span>
        </button>
        <button 
          className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`} 
          aria-label={t("nav.profile")}
          onClick={() => onChangeTab('profile')}
        >
          <User className="w-5 h-5" />
          <span>{t("nav.profile")}</span>
        </button>
        <button 
          className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
          aria-label={t("nav.settings")}
          onClick={() => onChangeTab('settings')}
        >
          <Settings className="w-5 h-5" />
          <span>{t("nav.settings")}</span>
        </button>
      </div>

      {/* Kusursuz Merkezlenmiş Kamera Butonu (FAB) */}
      <button 
        className="bottom-nav-scan cursor-pointer !transform-none hover:!scale-105 active:!scale-95 transition-all" 
        aria-label={t("nav.scan")}
        onClick={onScanClick}
        style={{ 
          position: "absolute", 
          left: "50%", 
          transform: "translateX(-50%)", 
          bottom: "24px", 
          zIndex: 10 
        }}
      >
        <Camera className="w-8 h-8" />
      </button>
    </nav>
  );
};

export default BottomNav;
