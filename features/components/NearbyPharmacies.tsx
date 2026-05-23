import { useState, useEffect } from "react";
import { MapPin, Phone, Navigation, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Pharmacy {
  id: string;
  name: string;
  distance: string;
  phone: string;
  address: string;
  city: string;
}

// Demo amaçlı mock data (Gerçek senaryoda API'den çekilir)
const MOCK_PHARMACIES: Pharmacy[] = [
  {
    id: "1",
    name: "Hayat Eczanesi",
    distance: "450 metre yakınınızda",
    phone: "+905551234567",
    address: "Atatürk Mah. İstiklal Cad. No: 12",
    city: "İstanbul",
  },
  {
    id: "2",
    name: "Şifa Eczanesi",
    distance: "800 metre yakınınızda",
    phone: "+905559876543",
    address: "Cumhuriyet Mah. Vatan Sok. No: 4",
    city: "İstanbul",
  },
  {
    id: "3",
    name: "Merkez Eczanesi",
    distance: "1.2 km yakınınızda",
    phone: "+905554567890",
    address: "Yeni Mahalle, Lale Sok. No: 8",
    city: "İstanbul",
  },
];

const NearbyPharmacies = () => {
  const { latitude, longitude, isLoading, error } = useGeolocation();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);

  useEffect(() => {
    // Lokasyon yükleniyorsa bekle
    if (isLoading) return;
    
    // Lokasyon varsa veya hata varsa (demo için hata olsa bile gösteriyoruz)
    setLoadingPharmacies(true);
    
    // Gerçek API isteğini simüle et
    const timer = setTimeout(() => {
      setPharmacies(MOCK_PHARMACIES);
      setLoadingPharmacies(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [latitude, longitude, isLoading]);

  const handleDirections = (pharmacy: Pharmacy) => {
    const query = encodeURIComponent(`${pharmacy.name} ${pharmacy.city}`);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapUrl, "_blank");
  };

  return (
    <div className="w-full mt-8 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4 px-1">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Yakındaki Nöbetçi Eczaneler</h3>
      </div>

      {isLoading || loadingPharmacies ? (
        <div className="flex items-center justify-center p-8 bg-card rounded-3xl border border-border">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground text-sm font-medium">Eczaneler aranıyor...</span>
        </div>
      ) : error && pharmacies.length === 0 ? (
        <div className="p-6 bg-destructive/10 text-destructive rounded-3xl text-sm font-medium border border-destructive/20 text-center">
          Konum alınamadı: {error}
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {pharmacies.map((pharmacy) => (
            <div 
              key={pharmacy.id} 
              className="snap-start flex-none w-[280px] bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Dekoratif Arka Plan Şekli */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full" />
              
              <h4 className="font-bold text-lg text-foreground mb-1 relative z-10">{pharmacy.name}</h4>
              
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-3 relative z-10">
                {pharmacy.distance}
              </p>
              
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2 h-[32px] relative z-10">
                {pharmacy.address}
              </p>
              
              <div className="flex items-center justify-between gap-3 relative z-10">
                <a 
                  href={`tel:${pharmacy.phone}`}
                  className="flex items-center justify-center w-12 h-12 bg-muted text-foreground rounded-2xl hover:bg-muted/80 transition-colors"
                  aria-label="Eczaneyi Ara"
                >
                  <Phone className="w-5 h-5" />
                </a>
                
                <button
                  onClick={() => handleDirections(pharmacy)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 active:scale-[0.98]"
                >
                  <Navigation className="w-4 h-4" />
                  Yol Tarifi Al
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyPharmacies;
