# Medoki User Flow (Kullanıcı Akışı) 🗺️

1. **Ana Ekrana (Home) Giriş:** 
   - Kullanıcı karanlık veya aydınlık temalı o cam arayüzle (glassmorphism) karşılaşır.
   - İki veri moddan birini seçer: "İlaç Analizi" (Turkuaz renk) veya "Semptom Önerisi" (Neon Yeşil renk).

2. **Arama ve Doğrulama (Typo & Gatekeeping):**
   - Kullanıcı arama kutusuna yazmaya başladığında arka planda akıllı AI bekçisi 700ms debounce loop'u ile kelimeyi değerlendirir.
   - "Analiz Et" tuşuna basıldığında, kelimenin gerçekten bir tıbbi ürün olup olmadığını Groq AI anlık sorgular. Hatalıysa veya bir yazım kayması varsa analiz raporu engellenip mükemmel düzeltilmiş buton ("Majezik mi demek istediniz?") aktiflenir.

3. **Yapay Zeka Servisi (Processing):**
   - Groq API (`llama-3.3-70b-versatile`) saniyeler içinde JSON tabanlı, son derece güvenilir, halk diline indirgenmiş medikal özet çıktısını oluşturur.

4. **Sonuç Ekranı (Results):**
   - Kullanıcı net, liste formunda, "AI Tarafından Sadeleştirildi" mühürlü ResultCards dizisini görür.
   - İstediği bilgiyi PWA ortamında panoya kopyalayabilir veya direkt platform dışı arkadaşlarıyla native "Share" modülüyle paylaşabilir.
