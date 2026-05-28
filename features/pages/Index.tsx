import React, { useState } from 'react';
import BottomNav from '@/components/BottomNav'; 
import TodayScreen from '@/components/TodayScreen';

export default function Index() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    // SafeAreaView ve StyleSheet yerine div ve Tailwind kullanıyoruz
    <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
      
      {/* Header */}
      <header className="h-[100px] flex justify-center items-center">
        {/* Logon burada olacak */}
      </header>

      {/* Ana içerik */}
      <main className="flex-1 px-4">
        {activeTab === 'home' && <TodayScreen />}
      </main>

      {/* Alt navigasyon */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
