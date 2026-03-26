# Medoki: Ürün Gereksinim Dokümanı (PRD) 📦

## 1. Genel Bakış
Medoki, görsel, hızlı ve akıllı bir sağlık asistanıdır. Hedefi prospektüsleri okumak, reçetesiz sağlık ürünü tavsiyelerinde bulunmak ve bu bilgiyi son derece kullanıcı dostu bir düzlemde sunmaktır.

## 2. Temel Özellikler (Core Features)

### 🩺 İlaç Analiz Motoru
- **Girdi:** Herhangi bir ilaç ismi.
- **Güvenlik (Gatekeeper):** İlaç "isTypo" ve "isValid" süzgecinden geçirilir; AI halüsinasyonları ve hatalı isimler hardcoded korumalarla engellenir.
- **Çıktı:** İlacın ne işe yaradığı, dozajı, yan etkileri ve internetteki gerçek kullanıcı yorumları.

### 🩹 Semptom Önerisi Motoru
- **Girdi:** Kas ağrısı, boğaz ağrısı vb. genel şikayet.
- **Çıktı:** Yapay zeka eşliğinde, içinde Türkiye piyasasındaki markaların da (Örn: Parol, Arveles vb.) dahil olduğu OTC seçenek önerileri ve "Ne zaman doktora gidilmeli?" uyarıları.

### 🔍 Akıllı Hafıza Arama (Search)
- **Geçmiş:** localStorage üzerinde şifrelenip tutulan ve dinamik olarak güncellenen X ile silinebilir arama hafızası. Sahte ve tıbbi olmayan typo verileri asla bu listeye giremez.
- **Hızlı Çipler:** Tek tıkla "Ağrı Kesici" ve "Vitamin" gibi etiketlere yönlendiren interaktif arama başlatıcılar.

### 📷 Görsel Tarama Algısı (Visual Scan)
- Web veya mobil kamera arayüzü ile ilacın ismini optik tarayıcı (Neon Scanline animasyonları) vasıtasıyla okuma simülasyonu sağlayan bir UX modülü.
