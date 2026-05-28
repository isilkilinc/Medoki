// Index.tsx (Mobil / Native sürümü için başlangıç)
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

// Artık web bileşenleri yerine native bileşenler import edeceğiz
import BottomNav from '@/components/BottomNav'; 
import TodayScreen from '@/components/TodayScreen';
// Diğer ekranları da bu şekilde native olarak import edeceğiz

export default function Index() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Web'deki header yerine View kullanıyoruz */}
      <View style={styles.header}>
        {/* Logon burada olacak */}
      </View>

      {/* Ana içerik alanı - Cycles esintisi buraya gelecek */}
      <View style={styles.main}>
        {activeTab === 'home' && <TodayScreen />}
        {/* Diğer tablar... */}
      </View>

      {/* Alt navigasyon */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' }, // Krem arka plan
  header: { height: 100, justifyContent: 'center', alignItems: 'center' },
  main: { flex: 1, paddingHorizontal: 16 }
});
