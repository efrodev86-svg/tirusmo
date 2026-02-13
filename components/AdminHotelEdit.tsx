import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === 'undefined' || !GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('No API key'));
  if (window.__gmLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=__gmOnLoad`;
    script.async = true;
    window.__gmOnLoad = () => {
      window.__gmLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Error cargando Google Maps'));
    document.head.appendChild(script);
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await res.json();
      const addr = data?.results?.[0]?.formatted_address;
      if (addr) return addr;
    } catch {
      // fallback to Nominatim
    }
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
    headers: { Accept: 'application/json' },
  });
  const data = await res.json();
  return data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

/** Geocodifica una dirección a coordenadas (para mostrar en el mapa). */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      const loc = data?.results?.[0]?.geometry?.location;
      if (loc?.lat != null && loc?.lng != null) return { lat: Number(loc.lat), lng: Number(loc.lng) };
    } catch {
      // ignore
    }
  }
  return null;
}

const MEAL_PLAN_OPTIONS: { type: string; label: string }[] = [
  { type: 'desayuno', label: 'Desayuno' },
  { type: 'comida', label: 'Comida' },
  { type: 'cena', label: 'Cena' },
  { type: 'todo_incluido', label: 'Todo incluido' },
];

type MealPlanItem = { type: string; cost: number };

type HotelForm = {
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  stars: number;
  description: string;
  tags: string[];
  isSoldOut: boolean;
  check_in_time: string;
  check_out_time: string;
  meal_plans: MealPlanItem[];
};

interface AdminHotelEditProps {
  hotelId: string;
  onBack: () => void;
}

export const AdminHotelEdit: React.FC<AdminHotelEditProps> = ({ hotelId, onBack }) => {
  const [form, setForm] = useState<HotelForm>({
    name: '',
    location: '',
    price: 0,
    rating: 0,
    reviews: 0,
    image: '',
    amenities: [],
    stars: 5,
    description: '',
    tags: [],
    isSoldOut: false,
    check_in_time: '15:00',
    check_out_time: '11:00',
    meal_plans: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [autocompleteReady, setAutocompleteReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerInstanceRef = useRef<unknown>(null);
  const didGeocodeInitialRef = useRef(false);

  const idNum = Number(hotelId);
  const validId = !Number.isNaN(idNum) && idNum > 0;

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      setError('ID de hotel inválido');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('hotels')
        .select('id, name, location, price, rating, reviews, image, amenities, stars, description, tags, "isSoldOut", check_in_time, check_out_time, meal_plans')
        .eq('id', idNum)
        .single();
      if (err || !data) {
        if (!cancelled) setError(err?.message || 'Hotel no encontrado');
        setLoading(false);
        return;
      }
      if (!cancelled) {
        setForm({
          name: data.name || '',
          location: data.location || '',
          price: Number(data.price) || 0,
          rating: Number(data.rating) || 0,
          reviews: Number(data.reviews) || 0,
          image: data.image || '',
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          stars: Number(data.stars) || 5,
          description: data.description || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          isSoldOut: Boolean(data.isSoldOut),
          check_in_time: data.check_in_time || '15:00',
          check_out_time: data.check_out_time || '11:00',
          meal_plans: Array.isArray(data.meal_plans) ? data.meal_plans.map((m: { type?: string; cost?: number }) => ({ type: String(m?.type ?? ''), cost: Number(m?.cost ?? 0) })) : [],
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [idNum, validId]);

  // Geocodificar la ubicación inicial del hotel (solo una vez al cargar) para el mapa
  useEffect(() => {
    if (loading || !form.location.trim() || !GOOGLE_MAPS_API_KEY || didGeocodeInitialRef.current) return;
    didGeocodeInitialRef.current = true;
    let cancelled = false;
    geocodeAddress(form.location).then((coords) => {
      if (!cancelled && coords) setMapCenter(coords);
    });
    return () => { cancelled = true; };
  }, [loading, form.location]);

  // Precargar script de Google Maps al montar (si hay API key) para tener autocompletado listo antes
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    loadGoogleMapsScript().catch(() => {});
  }, [GOOGLE_MAPS_API_KEY]);

  // Inicializar Autocomplete cuando el formulario esté visible y el script cargado
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || loading) return;
    const input = locationInputRef.current;
    if (!input || !window.google?.maps?.places) return;
    let cancelled = false;
    if (window.__gmLoaded) {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['establishment', 'geocode'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place?.formatted_address) setForm((f) => ({ ...f, location: place.formatted_address! }));
          const loc = place?.geometry?.location;
          if (loc) setMapCenter({ lat: loc.lat(), lng: loc.lng() });
        });
        if (!cancelled) setAutocompleteReady(true);
      } catch {
        // API no disponible o error de configuración
      }
      return;
    }
    loadGoogleMapsScript()
      .then(() => {
        if (cancelled || !locationInputRef.current || !window.google?.maps?.places) return;
        const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
          types: ['establishment', 'geocode'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place?.formatted_address) setForm((f) => ({ ...f, location: place.formatted_address! }));
          const loc = place?.geometry?.location;
          if (loc) setMapCenter({ lat: loc.lat(), lng: loc.lng() });
        });
        setAutocompleteReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [GOOGLE_MAPS_API_KEY, loading]);

  // Actualizar dirección desde coordenadas (clic en mapa o arrastrar marcador)
  const updateLocationFromCoords = React.useCallback(async (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    try {
      const address = await reverseGeocode(lat, lng);
      setForm((f) => ({ ...f, location: address }));
    } catch {
      setForm((f) => ({ ...f, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
    }
  }, []);

  // Crear o actualizar el mapa cuando hay coordenadas y el script está cargado
  useEffect(() => {
    if (!mapCenter || !GOOGLE_MAPS_API_KEY || !window.__gmLoaded || !window.google?.maps) return;
    const container = mapContainerRef.current;
    if (!container) return;

    const center = { lat: mapCenter.lat, lng: mapCenter.lng };
    const { Map: GMap, Marker: GMarker } = window.google.maps;

    if (mapInstanceRef.current && markerInstanceRef.current) {
      (mapInstanceRef.current as { setCenter: (c: { lat: number; lng: number }) => void }).setCenter(center);
      (markerInstanceRef.current as { setPosition: (p: { lat: number; lng: number }) => void }).setPosition(center);
      return;
    }

    const map = new GMap(container, { center, zoom: 15 });
    const marker = new GMarker({ position: center, map, draggable: true });

    // Clic en el mapa: colocar marcador y actualizar dirección
    map.addListener('click', (e: { latLng?: { lat: () => number; lng: () => number } }) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      updateLocationFromCoords(lat, lng);
    });

    // Arrastrar el marcador: actualizar dirección al soltar
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) updateLocationFromCoords(pos.lat(), pos.lng());
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;
  }, [mapCenter, GOOGLE_MAPS_API_KEY, updateLocationFromCoords]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    setLocationLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
          const address = await reverseGeocode(latitude, longitude);
          setForm((f) => ({ ...f, location: address }));
        } catch (e) {
          setError('No se pudo obtener la dirección');
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setError('No se pudo obtener tu ubicación. Comprueba los permisos del navegador.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validId || !form.name.trim() || !form.location.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('hotels')
        .update({
          name: form.name.trim(),
          location: form.location.trim(),
          price: form.price,
          rating: form.rating,
          reviews: form.reviews,
          image: form.image.trim() || null,
          amenities: form.amenities,
          stars: form.stars,
          description: form.description.trim() || null,
          tags: form.tags,
          isSoldOut: form.isSoldOut,
          check_in_time: form.check_in_time.trim() || '15:00',
          check_out_time: form.check_out_time.trim() || '11:00',
          meal_plans: form.meal_plans,
        })
        .eq('id', idNum);
      if (err) throw err;
      onBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const amenitiesText = form.amenities.join(', ');
  const tagsText = form.tags.join(', ');

  if (!validId || loading) {
    return (
      <div className="p-8">
        {loading && <p className="text-gray-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">Volver</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] leading-tight">Editar información del hotel</h1>
            <p className="text-xs text-gray-400 font-medium">ID: #{hotelId}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 max-w-2xl">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ubicación *</label>
              <div className="flex gap-2">
                <input
                  ref={locationInputRef}
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={GOOGLE_MAPS_API_KEY ? 'Escribe la dirección o el nombre del lugar...' : 'Dirección o ciudad del hotel'}
                  required
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 whitespace-nowrap"
                  title="Usar mi ubicación actual"
                >
                  <span className="material-symbols-outlined text-[20px]">my_location</span>
                  {locationLoading ? '...' : 'Mi ubicación'}
                </button>
              </div>
              {GOOGLE_MAPS_API_KEY && !autocompleteReady && (
                <p className="text-xs text-gray-500 mt-1">Escribe y aparecerán sugerencias de Google Maps.</p>
              )}
              {GOOGLE_MAPS_API_KEY && autocompleteReady && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Autocompletado activo</p>
              )}
              {!GOOGLE_MAPS_API_KEY && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  El mapa y el autocompletado de direcciones no se muestran porque no está configurada la variable de entorno <code className="bg-amber-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> en el entorno de producción. Configúrala en tu plataforma de despliegue (Vercel, Netlify, etc.) y vuelve a desplegar.
                </p>
              )}
              {GOOGLE_MAPS_API_KEY && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">touch_app</span>
                    Haz clic en el mapa o arrastra el marcador para elegir la ubicación. La dirección se actualizará al instante.
                  </p>
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100" style={{ minHeight: 220 }}>
                    {mapCenter ? (
                      <div ref={mapContainerRef} className="w-full h-[220px] cursor-crosshair" />
                    ) : (
                      <div className="w-full h-[220px] flex items-center justify-center text-gray-500 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[24px]">location_on</span>
                          La ubicación se verá aquí al elegir una dirección o usar Mi ubicación
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Precio</label>
                <input type="number" min="0" step="0.01" value={form.price || ''} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estrellas</label>
                <select value={form.stars} onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rating</label>
                <input type="number" min="0" max="5" step="0.1" value={form.rating || ''} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nº reviews</label>
                <input type="number" min="0" value={form.reviews || ''} onChange={(e) => setForm((f) => ({ ...f, reviews: Number(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL imagen</label>
                <input type="url" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Amenidades (separadas por coma)</label>
              <input type="text" value={amenitiesText} onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Wifi, Alberca, Spa" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tags (separados por coma)</label>
              <input type="text" value={tagsText} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="playa, lujo" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Check-in (hora)</label>
                <input type="text" value={form.check_in_time} onChange={(e) => setForm((f) => ({ ...f, check_in_time: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="15:00" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Check-out (hora)</label>
                <input type="text" value={form.check_out_time} onChange={(e) => setForm((f) => ({ ...f, check_out_time: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="11:00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Planes de comida</label>
              <p className="text-xs text-gray-500 mb-2">Marca los que ofrece el hotel e indica el costo adicional por persona/noche (0 = incluido).</p>
              <div className="space-y-2">
                {MEAL_PLAN_OPTIONS.map((opt) => {
                  const current = form.meal_plans.find((m) => m.type === opt.type);
                  const offered = !!current;
                  const cost = current?.cost ?? 0;
                  return (
                    <div key={opt.type} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`meal-${opt.type}`}
                        checked={offered}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((f) => ({ ...f, meal_plans: [...f.meal_plans.filter((m) => m.type !== opt.type), { type: opt.type, cost: 0 }] }));
                          } else {
                            setForm((f) => ({ ...f, meal_plans: f.meal_plans.filter((m) => m.type !== opt.type) }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`meal-${opt.type}`} className="text-sm font-medium text-gray-700 min-w-[100px]">{opt.label}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offered ? cost : ''}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          meal_plans: f.meal_plans.some((m) => m.type === opt.type)
                            ? f.meal_plans.map((m) => (m.type === opt.type ? { ...m, cost: Number(e.target.value) || 0 } : m))
                            : [...f.meal_plans, { type: opt.type, cost: Number(e.target.value) || 0 }],
                        }))}
                        className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                        placeholder="Costo"
                        disabled={!offered}
                      />
                      <span className="text-xs text-gray-400">MXN</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isSoldOut" checked={form.isSoldOut} onChange={(e) => setForm((f) => ({ ...f, isSoldOut: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="isSoldOut" className="text-sm font-medium text-gray-700">Agotado / Sin disponibilidad</label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
            <button type="button" onClick={onBack} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 shadow-md shadow-blue-200">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
