# Medoki: Akıllı Sağlık Rehberi 💙

Medoki, sıklıkla tıbbi dilden dolayı kafa karıştıran uzun ilaç prospektüslerini ve basit semptom/rahatsızlık ihtiyaçlarını saniyeler içerisinde **halkın anlayacağı temizlikte** özetleyen, otonom ve modern bir sağlık asistanıdır.

## 🏆 Buildathon 2026 Submission

Bu repo, *Lovable* ve *Groq AI* altyapısı kullanılarak geliştirilmiş, UX (Kullanıcı deneyimi) odaklı, hem hafif, hem görseli zengin (Gece/Gündüz modlu Neon Glassmorphism), hem de yanılma/yanlış cevap üretme payı (Hallucination) "Doğrulama (Validation)" kalkanıyla sıfıra indirilmiş mükemmel bir sağlık çözümüdür.

## 🚀 Başlangıç ve Kurulum

Öncelikle yapay zeka motorunun çalışması için bir **Groq API** anahtarına ihtiyacınız var:
1. Sitemizde kök dizinde `.env` (env var) adında bir dosya oluşturun ve içine geçerli bir anahtar girin: 
   \`VITE_GROQ_API_KEY=gsk_sizin_anahtariniz_muko_bir_sey\`
2. Standart bağımlılıkları terminal üzerinden yükleyin:
   ```bash
   npm install
   ```
3. Yerel sunucuyu HMR (Hot Module Replacement) modunda başlatın:
   ```bash
   npm run dev
   ```

## 📁 Teknik Belgeler (Sistem Mimarisi)
Buildathon jürisi ve geliştiriciler için özel hazırlanmış Markdown modüllerini okuyarak projenin scope/vizyon derinliğini inceleyebilirsiniz:
- [Proje Fikri, Hedef Kitle ve USP (idea.md)](./idea.md)
- [Teknik Ürün İsterleri (prd.md)](./prd.md)
- [Kullanıcı Akış Sistemi (user-flow.md)](./user-flow.md)
- [Teknoloji Stack'i (tech-stack.md)](./tech-stack.md)

*Lovable Agent ve Antigravity partnerliği ile Buildathon için kodlanmıştır.*
