# Tech Stack ⚙️

Medoki'nin mimarisini, inanılmaz derecede hızlı yüklenme, otonom kod jenerasyonu ve akıllı veri madenciliği araçları oluşturur.

## Frontend Mimarisí
- **Vite:** Hızlı geliştirme sunucusu ve HMR özellikli modüler production bundle mimarisi.
- **React 18:** Etkileşimli ve kesintisiz modern UI reaktivitesi sağlayan yapı.
- **Tailwind CSS & Framer Motion:** CSS değişkenleri ve native class'larla tamamen optimize edilmiş Glassmorphism (Cam efekti) ve Neon ışıklandırma / Fade-In animasyonları. Renk paletinde karanlık ve aydınlık mod native varyasyonlarla kontrol edilmiştir.

## UI/UX Jeneratörü
- **Lovable (ve Antigravity Agent):** Uygulama prototipinin görsel kompozisyonunun oluşturulmasında ve pürüzsüz UX/UI (Kullanıcı deneyimi) iyileştirmelerinin (Örn: Typo korumaları, localstorage mapping, neon border geçişleri) entegrasyonunda son derece gelişmiş bir sinerji ile çalışıldı.

## Yapay Zeka Katmanı
- **Groq API (`llama-3.3-70b-versatile`):** Neredeyse anlık denebilecek sürelerde yanıt veren yüksek kapasiteli yapay zeka Llama3 motoru üzerinden JSON prompt pattern'leri ile otonom ilaç analizi sağlandı. Sistem "Gatekeeper" (Doğrulama) mantığı ile hardcode edilmiş bir hallucination-blocking (uydurma engelleme) yeteneğine sahiptir.
