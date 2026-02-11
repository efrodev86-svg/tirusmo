/**
 * Tipos para la integración de Google Maps (Places Autocomplete, Geocoding y Map).
 * Requiere VITE_GOOGLE_MAPS_API_KEY en .env.
 */
declare global {
  interface Window {
    __gmLoaded?: boolean;
    __gmOnLoad?: () => void;
    google?: {
      maps: {
        LatLng: new (lat: number, lng: number) => { lat: () => number; lng: () => number };
        Map: new (el: HTMLElement, opts?: { center?: { lat: number; lng: number }; zoom?: number }) => {
          setCenter: (c: { lat: number; lng: number }) => void;
          setZoom: (z: number) => void;
          addListener: (event: string, callback: (e?: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
        };
        Marker: new (opts?: {
          map?: unknown;
          position?: { lat: number; lng: number };
          draggable?: boolean;
        }) => {
          setMap: (map: unknown) => void;
          setPosition: (p: { lat: number; lng: number }) => void;
          getPosition: () => { lat: () => number; lng: () => number } | null;
          addListener: (event: string, callback: () => void) => void;
        };
        Geocoder: new () => {
          geocode: (
            request: { address?: string; location?: { lat: () => number; lng: () => number } },
            callback: (results: { geometry?: { location: { lat: () => number; lng: () => number } } }[] | null, status: string) => void
          ) => void;
        };
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { types?: string[]; componentRestrictions?: { country: string | string[] } }
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              formatted_address?: string;
              name?: string;
              geometry?: { location: { lat: () => number; lng: () => number } };
            };
          };
        };
      };
    };
  }
}

export {};
