import { getCachedAnalysis, setCachedAnalysis } from "./supabase";

const API_KEY = (import.meta.env.VITE_GROQ_API_KEY || "").trim();

function stripCodeFences(value: string): string {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
}

async function groqCompletion(prompt: string, maxTokens: number): Promise<string> {
  if (!API_KEY) throw new Error("API anahtarı bulunamadı.");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Groq hatası: ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

// İlaç takibi için motivasyon mesajı üret
export async function generateMotivationMessage(
  streakDays: number,
  medicationName: string,
  language: "tr" | "en" = "tr"
): Promise<string> {
  const prompt = language === "tr"
    ? `Bir ilaç takip uygulamasında kullanıcı "${medicationName}" ilacını ${streakDays} gün üst üste düzenli aldı. Kısa, samimi ve motive edici bir tebrik mesajı yaz. Maksimum 2 cümle. Emoji kullanabilirsin.`
    : `In a medication tracking app, the user has taken "${medicationName}" for ${streakDays} consecutive days. Write a short, sincere motivational congratulation message. Maximum 2 sentences. You can use emojis.`;

  const cacheKey = `motivation_${streakDays}_${medicationName.toLowerCase()}_${language}`;
  const cached = await getCachedAnalysis<string>(cacheKey);
  if (cached) return cached;

  const message = await groqCompletion(prompt, 150);
  void setCachedAnalysis(cacheKey, message);
  return message;
}

// Streak kırılınca cesaretlendirici mesaj
export async function generateEncouragementMessage(
  medicationName: string,
  language: "tr" | "en" = "tr"
): Promise<string> {
  const prompt = language === "tr"
    ? `Bir ilaç takip uygulamasında kullanıcı "${medicationName}" ilacını almayı unuttu ve serisi kırıldı. Cesaretlendirici, yargılamayan kısa bir mesaj yaz. Maksimum 2 cümle. Emoji kullanabilirsin.`
    : `In a medication tracking app, the user forgot to take "${medicationName}" and their streak broke. Write a short, encouraging, non-judgmental message. Maximum 2 sentences. You can use emojis.`;

  return groqCompletion(prompt, 150);
}
