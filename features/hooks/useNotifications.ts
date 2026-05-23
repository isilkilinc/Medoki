import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface MedicationReminder {
  id: string;
  user_id: string;
  target_person: string;
  medication_name: string;
  reminder_time: string; // HH:MM
  is_active: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("medication_reminders")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      if (data) {
        setReminders(data as MedicationReminder[]);
      }
    } catch (err) {
      console.error("Hatırlatıcılar çekilirken hata oluştu:", err);
    }
  }, [user]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Fetch reminders initially
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Set interval to check time and send notifications
  useEffect(() => {
    if (!user || reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;
      const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

      reminders.forEach((reminder) => {
        if (!reminder.is_active) return;

        if (reminder.reminder_time === currentTime) {
          // Check sessionStorage to prevent duplicate notifications in the same minute
          const notifKey = `notif_${reminder.id}_${currentDate}_${currentTime}`;
          const hasNotified = sessionStorage.getItem(notifKey);

          if (!hasNotified) {
            if (Notification.permission === "granted") {
              new Notification("Medoki - İlaç Zamanı!", {
                body: `${reminder.target_person} için ${reminder.medication_name} içme vakti geldi!`,
                icon: "/logo.png",
              });
              sessionStorage.setItem(notifKey, "true");
            }
          }
        }
      });
    }, 60000); // Check every minute

    // Call immediately once just in case the app was opened exactly at the time
    // But usually interval is fine.

    return () => clearInterval(interval);
  }, [reminders, user]);

  return { reminders, fetchReminders, setReminders };
}
