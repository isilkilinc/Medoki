

# Medoki — React'e Dönüşüm Planı

## Uygulama Özeti
Medoki, yapay zeka ile ilaç prospektüslerini sadeleştiren ve semptomlara göre OTC ürün öneren bir sağlık asistanı. Groq API (Llama 3.3) kullanır.

## Yapılacaklar

### 1. Tasarım Sistemi
- Koyu glassmorphism teması: `#0b1220` arka plan, violet/indigo ambient orb efektleri
- Glass kartlar (backdrop-filter blur, yarı saydam kenarlıklar)
- Fade-in-up animasyonları
- Mevcut CSS'deki tüm stiller Tailwind + custom CSS olarak aktarılacak

### 2. Ana Sayfa (Home Screen)
- **Medoki** başlık ve "Sade sağlık asistanı" alt başlık
- İki mod butonu: "İlaç Analizi" (mavi) ve "Semptom Önerisi" (yeşil)
- Metin girişi ve "Analiz Et" butonu (mor)
- Durum mesajı alanı

### 3. Sonuçlar Sayfası (Results Screen)
- "Geri" butonu ile ana sayfaya dönüş
- "Metni Kopyala" butonu
- Sonuç kartları (staggered fade-in animasyonu ile):
  - **İlaç modu**: Kullanım amacı, doz, yan etkiler, uyarılar, özet, tıbbi not, kullanıcı deneyimleri
  - **Semptom modu**: Şikayet özeti, OTC önerileri (etken madde + marka), genel öneriler, doktora başvuru, tıbbi not, kullanıcı deneyimleri
- "Topluluk Analizi" özel kartı (mor vurgulu)
- Paylaş FAB butonu (Web Share API + clipboard fallback)

### 4. Groq API Entegrasyonu
- `VITE_GROQ_API_KEY` environment variable ile API anahtarı
- İlaç analizi ve semptom önerisi için ayrı prompt'lar
- JSON yanıt parse etme ve hata yönetimi
- Yükleme durumu gösterimi

### 5. Bileşen Yapısı
- `HomeScreen` — mod seçimi ve form
- `ResultsScreen` — sonuç kartları ve aksiyonlar
- `ResultCard` — tekrar kullanılabilir kart bileşeni
- `UserExperiencesCard` — topluluk analizi kartı
- `AmbientBackground` — dekoratif orb efektleri

