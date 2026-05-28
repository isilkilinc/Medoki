import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from 'expo-haptics'; // Titreşim için

export default function TodayScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (loadData ve handleCheckIn fonksiyonların aynı kalacak, sadece içindeki supabase çağrıları korunacak)

  async function handleCheckIn(medicationId: string) {
    if (!user) return;
    
    // Titreşim (Haptic Feedback)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // ... (Logik aynı, sadece await supabase kısmını koru)
    loadData();
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6B8E23" />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 1. Oyun İstatistikleri (Daha kompakt mobil kutular) */}
      <View style={styles.statsCard}>
        <Text style={styles.streakText}>🔥 {gameStats?.current_streak || 0} Günlük Seri</Text>
        <Text style={styles.levelText}>Seviye {gameStats?.level || 1}</Text>
      </View>

      {/* 2. Bugünkü İlaçlar Listesi */}
      <Text style={styles.sectionTitle}>Bugünün İlaçları</Text>
      
      {medications.map((med) => {
        const taken = todayLogs.find((l) => l.medication_id === med.id && l.status === "taken");
        return (
          <View key={med.id} style={[styles.medCard, taken && styles.medCardTaken]}>
            <View style={styles.medInfo}>
              <Text style={styles.medIcon}>{med.icon}</Text>
              <View>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDosage}>{med.dosage}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.checkButton, taken && styles.checkButtonTaken]}
              onPress={() => handleCheckIn(med.id)}
              disabled={!!taken}
            >
              <Text style={styles.buttonText}>{taken ? "Alındı" : "Aldım"}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#FDFBF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, marginBottom: 20, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  medCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  medCardTaken: { backgroundColor: '#F9FCF8', borderColor: '#6B8E23' },
  medInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medName: { fontWeight: '600', fontSize: 16 },
  medDosage: { color: '#7F8C8D', fontSize: 12 },
  medIcon: { fontSize: 24 },
  checkButton: { backgroundColor: '#6B8E23', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  checkButtonTaken: { backgroundColor: '#D1D8C0' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  streakText: { fontWeight: 'bold', color: '#D35400' },
  levelText: { color: '#6B8E23' }
});
