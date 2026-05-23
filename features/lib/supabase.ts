import { createClient } from "@supabase/supabase-js";

// ─── Client ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    `[Medoki] Supabase ortam değişkenleri EKSİK!
     VITE_SUPABASE_URL algılanan: "${SUPABASE_URL || 'BOŞ/UNDEFINED'}"
     VITE_SUPABASE_ANON_KEY algılanan: "${SUPABASE_ANON_KEY ? 'VAR' : 'BOŞ/UNDEFINED'}"
    `
  );
} else {
  console.log("[Medoki] Supabase ortam değişkenleri başarıyla yüklendi.");
}

// URL boş olunca createClient anında hata fırlatıp tüm web sitesini (siyah ekrana) çökertiyordu.
// Eğer ortam değişkeni henüz Vercel'e eklenmemişse uygulamanın çökmemesi için geçici bir dummy URL veriyoruz.
// Fonksiyonların içindeki (!SUPABASE_URL) kontrolü sayesinde bu dummy URL'ye hiçbir zaman istek atılmayacak.
export const supabase = createClient(
  SUPABASE_URL || "https://dummy.supabase.co", 
  SUPABASE_ANON_KEY || "dummy"
);

// ─── Tablo sabiti ─────────────────────────────────────────────────────────────
const TABLE = "cached_analyses";

// ─── Cache tipi ───────────────────────────────────────────────────────────────
interface CacheRow {
  query_text: string;
  response_data: unknown;
}

// ─── Normalize: arama terimlerini küçük harf + trim ile standartlaştır ────────
function normalizeKey(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
}

/**
 * Supabase'den önbelleğe alınmış sonucu getir.
 * @returns Kayıtlı `response_data` veya `null` (bulunamazsa).
 */
export async function getCachedAnalysis<T>(queryText: string): Promise<T | null> {
  console.log('Supabase Okuma Denemesi (DEVRE DIŞI):', queryText);
  return null; // ÖNBELLEK GEÇİCİ OLARAK KAPATILDI
  /*
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("[Supabase Cache] VITE_SUPABASE_URL eksik, okuma atlandı.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("response_data")
      .eq("query_text", normalizeKey(queryText))
      .maybeSingle();

    if (error) {
      console.warn("[Supabase Cache] Okuma hatası:", error.message);
      return null;
    }

    if (data) {
      console.log(`[Supabase Cache] Veri bulundu:`, queryText);
    } else {
      console.log(`[Supabase Cache] Veri bulunamadı:`, queryText);
    }

    return (data as CacheRow | null)?.response_data as T ?? null;
  } catch (err) {
    console.warn("[Supabase Cache] Beklenmeyen hata:", err);
    return null;
  }
  */
}

/**
 * Analiz sonucunu Supabase önbelleğine yaz.
 * Aynı `query_text` zaten varsa üzerine yazar (upsert).
 */
export async function setCachedAnalysis(
  queryText: string,
  responseData: unknown
): Promise<void> {
  console.log('Supabase Kayıt Denemesi (DEVRE DIŞI):', queryText);
  return; // ÖNBELLEK GEÇİCİ OLARAK KAPATILDI
  /*
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("[Supabase Cache] VITE_SUPABASE_URL eksik, kayıt atlandı.");
    return;
  }

  try {
    const { error } = await supabase.from(TABLE).upsert(
      {
        query_text: normalizeKey(queryText),
        response_data: responseData,
      } satisfies CacheRow,
      { onConflict: "query_text" }
    );

    if (error) {
      console.warn("[Supabase Cache] Yazma hatası oluştu:", error.message, error.details, error.hint);
    } else {
      console.log("[Supabase Cache] Başarıyla kaydedildi:", queryText);
    }
  } catch (err) {
    console.warn("[Supabase Cache] Beklenmeyen hata:", err);
  }
  */
}
// ─── Prospektüs Index ─────────────────────────────────────────────────────────

/**
 * İlaç adına göre Supabase'de prospektüs PDF'i ara.
 * Hem medicine_name hem de brand_names dizisinde arar.
 */
export async function findProspectus(medicineName: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const normalized = medicineName.trim().toLowerCase();

  try {
    // Önce medicine_name'de ara
    const { data, error } = await supabase
      .from("prospectus_index")
      .select("storage_path")
      .ilike("medicine_name", normalized)
      .maybeSingle();

    if (!error && data) return data.storage_path;

    // Bulunamazsa brand_names dizisinde ara
    const { data: data2, error: error2 } = await supabase
      .from("prospectus_index")
      .select("storage_path")
      .contains("brand_names", [normalized])
      .maybeSingle();

    if (!error2 && data2) return data2.storage_path;

    return null;
  } catch {
    return null;
  }
}

/**
 * Supabase Storage'dan PDF'i indir ve metin olarak döndür.
 */
export async function downloadProspectus(storagePath: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const { data, error } = await supabase.storage
      .from("prospectus-pdfs")
      .download(storagePath);

    if (error || !data) return null;

    const arrayBuffer = await data.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const raw = decoder.decode(uint8);

    // PDF metin akışlarını çek
    let text = "";
    const btMatches = raw.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btMatches) {
      const strMatches = block.match(/\(([^)]+)\)/g) || [];
      for (const s of strMatches) {
        text += s.slice(1, -1) + " ";
      }
    }

    text = text.replace(/\s+/g, " ").trim();
    return text.length > 100 ? text.slice(0, 8000) : null;
  } catch {
    return null;
  }
}
