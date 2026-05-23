import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "Tarayıcınız konum servisini desteklemiyor.",
        isLoading: false,
      }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        isLoading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState((s) => ({
        ...s,
        error: error.message,
        isLoading: false,
      }));
    };

    // İsteğe bağlı olarak watchPosition da kullanılabilir ama anlık konum yeterlidir.
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  return state;
}
