import React, { useState, useEffect } from "react";
// react-native yerine standart React/Web kullanıyoruz
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Circle } from "lucide-react"; 

export default function TodayScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ... loadData ve handleCheckIn aynı kalabilir (supabase çağrıları değişmez)

  const takenCount = todayLogs.filter(l => l.status === "taken").length;
  const totalCount = medications.length;
  const progressPercent = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

  if (loading) return <div className="flex justify-center pt-20 text-primary">Yükleniyor...</div>;

  return (
    <div className="flex flex-col gap-6 p-4 bg-[#FDFBF7] min-h-screen">
      
      {/* 1. Dairesel İlerleme (Cycles'tan ilhamla) */}
      <div className="flex flex-col items-center my-6">
        <div className="w-48 h-48 rounded-full bg-[#6B8E23] flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-[#FDFBF7] flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[#6B8E23]">{Math.round(progressPercent)}%</span>
            <span className="text-xs text-gray-400">Tamamlandı</span>
          </div>
        </div>
      </div>

      {/* 2. İlaçlar Listesi */}
      <h2 className="font-bold text-lg text-gray-800">Bugünün İlaçları</h2>
      <div className="flex flex-col gap-3">
        {medications.map((med) => {
          const taken = todayLogs.find((l) => l.medication_id === med.id && l.status === "taken");
          return (
            <div key={med.id} className={`flex items-center justify-between p-4 rounded-2xl border ${taken ? "border-[#6B8E23]/30 bg-[#F9FCF8]" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{med.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800">{med.name}</p>
                  <p className="text-xs text-gray-500">{med.dosage}</p>
                </div>
              </div>
              <button 
                onClick={() => handleCheckIn(med.id)}
                disabled={!!taken}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${taken ? "bg-[#D1D8C0] text-white" : "bg-[#6B8E23] text-white"}`}
              >
                {taken ? "Alındı" : "Aldım"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
