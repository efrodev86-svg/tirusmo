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

type ReverseGeocodeResult = { address: string; municipality: string; state: string; country: string };

function parseAddressComponents(components: { long_name: string; types: string[] }[]): { municipality: string; state: string; country: string } {
  let municipality = '';
  let state = '';
  let country = '';
  for (const c of components || []) {
    if (c.types?.includes('administrative_area_level_2')) municipality = c.long_name || municipality;
    if (c.types?.includes('locality') && !municipality) municipality = c.long_name || municipality;
    if (c.types?.includes('administrative_area_level_1')) state = c.long_name || state;
    if (c.types?.includes('country')) country = c.long_name || country;
  }
  return { municipality, state, country };
}

async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await res.json();
      const first = data?.results?.[0];
      if (first?.formatted_address) {
        const { municipality, state, country } = parseAddressComponents(first.address_components || []);
        return { address: first.formatted_address, municipality, state, country };
      }
    } catch {
      // fallback to Nominatim
    }
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
    headers: { Accept: 'application/json' },
  });
  const data = await res.json();
  const displayName = data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  const municipality = data?.address?.municipality ?? data?.address?.city ?? data?.address?.county ?? '';
  const state = data?.address?.state ?? data?.address?.region ?? '';
  const country = data?.address?.country ?? '';
  return { address: displayName, municipality, state, country };
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
  { type: 'todo_incluido', label: 'Todo incluido' },
];

const TRAVEL_STYLE_OPTIONS = ['Romántico', 'Pareja', 'Amigos', 'Familiar'] as const;

const AMENITY_CATEGORY_LABELS: Record<string, string> = {
  conectividad: 'Conectividad',
  alberca_wellness: 'Alberca y bienestar',
  comida_bebida: 'Comida y bebida',
  habitacion: 'Habitación',
  servicios: 'Servicios',
  familia_mascotas: 'Familia y mascotas',
  deportes: 'Deportes',
  accesibilidad: 'Accesibilidad',
  general: 'General',
};

const LADA_COUNTRIES: { code: string; flag: string; name: string }[] = [
  { code: '+52', flag: '🇲🇽', name: 'México' },
  { code: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: '+34', flag: '🇪🇸', name: 'España' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+53', flag: '🇨🇺', name: 'Cuba' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', flag: '🇵🇦', name: 'Panamá' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+49', flag: '🇩🇪', name: 'Alemania' },
  { code: '+33', flag: '🇫🇷', name: 'Francia' },
  { code: '+39', flag: '🇮🇹', name: 'Italia' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil' },
];

function parsePhone(phone: string): { lada: string; local: string } {
  const raw = (phone || '').trim();
  if (!raw) return { lada: '+52', local: '' };
  const withPlus = raw.startsWith('+') ? raw : '+' + raw.replace(/\D/g, '');
  const sorted = [...LADA_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (withPlus === c.code || withPlus.startsWith(c.code)) {
      const local = raw.startsWith('+') ? raw.slice(c.code.length).trim() : raw.replace(/^\D*/, '').replace(new RegExp('^' + c.code.replace(/\+/, '\\+')), '').trim();
      return { lada: c.code, local: local.replace(/\s/g, ' ') };
    }
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 2) {
    for (const c of sorted) {
      const codeDigits = c.code.replace(/\D/g, '');
      if (digits.startsWith(codeDigits)) {
        const local = digits.slice(codeDigits.length).replace(/(\d{2})(?=\d)/g, '$1 ').trim();
        return { lada: c.code, local };
      }
    }
  }
  return { lada: '+52', local: raw };
}

type AmenityCatalogItem = { id: number; slug: string; label: string; category: string; sort_order: number };

type MealPlanItem = { type: string; cost: number; cost_children?: number };

type PlanInclusionItem = { title: string; description: string };

type HotelForm = {
  name: string;
  phone: string;
  location: string;
  municipality: string;
  state: string;
  country: string;
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
  travel_styles: string[];
  pet_friendly: boolean;
  plan_inclusions: PlanInclusionItem[];
};

interface AdminHotelEditProps {
  /** Si es null, se muestra el formulario en modo "Registrar hotel" (insert). Si es string, modo "Editar" (update). */
  hotelId: string | null;
  onBack: () => void;
  /** Se llama tras guardar correctamente en modo creación (opcional). */
  onSuccess?: () => void;
}

export const AdminHotelEdit: React.FC<AdminHotelEditProps> = ({ hotelId, onBack, onSuccess }) => {
  const [form, setForm] = useState<HotelForm>({
    name: '',
    phone: '',
    location: '',
    municipality: '',
    state: '',
    country: '',
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
    travel_styles: [],
    pet_friendly: false,
    plan_inclusions: [],
  });
  const isCreateMode = hotelId == null || hotelId === '';
  const idNum = hotelId ? Number(hotelId) : 0;
  const validId = !isCreateMode && !Number.isNaN(idNum) && idNum > 0;

  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  /** true = hotel no ofrece planes de alimentos (meal_plans vacío) */
  const [sinPlanAlimentos, setSinPlanAlimentos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [autocompleteReady, setAutocompleteReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [amenityCatalog, setAmenityCatalog] = useState<AmenityCatalogItem[]>([]);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerInstanceRef = useRef<unknown>(null);
  const didGeocodeInitialRef = useRef(false);
  const [phoneLada, setPhoneLada] = useState('+52');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [ladaOpen, setLadaOpen] = useState(false);
  const ladaInputRef = useRef<HTMLInputElement>(null);
  const [galleryImages, setGalleryImages] = useState<{ id: number; url: string; sort_order: number; description: string | null; url_medium?: string | null; url_small?: string | null }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [deleteConfirmImage, setDeleteConfirmImage] = useState<{ id: number; url: string; url_medium?: string | null; url_small?: string | null } | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const hotelImagesHasDescriptionRef = useRef<boolean | null>(null);

  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropPct, setCropPct] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [cropNatural, setCropNatural] = useState<{ w: number; h: number } | null>(null);
  const [cropDisplay, setCropDisplay] = useState<{ w: number; h: number } | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const cropDragRef = useRef<{ active: boolean; startX: number; startY: number; startLeft: number; startTop: number }>({ active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  const BUCKET_HOTEL_IMAGES = 'hotel-images';

  const CROP_ASPECT = 4 / 3;
  const CROP_PREVIEW_MAX = { w: 640, h: 480 };
  // Misma proporción 720:480 (3:2) en grande y mediano; pequeño cuadrado para miniatura
  const CROP_OUTPUT_SIZES = [
    { w: 720, h: 480 },
    { w: 420, h: 280 },
    { w: 50, h: 50 },
  ] as const;
  const WEBP_QUALITY = 0.88;

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('amenity_catalog')
      .select('id, slug, label, category, sort_order')
      .order('category')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setAmenityCatalog(data as AmenityCatalogItem[]);
      });
    return () => { cancelled = true; };
  }, []);

  const amenitiesNormalizedRef = useRef(false);
  useEffect(() => {
    if (isCreateMode || amenityCatalog.length === 0 || amenitiesNormalizedRef.current) return;
    amenitiesNormalizedRef.current = true;
    setForm((f) => ({
      ...f,
      amenities: f.amenities
        .map((a) => {
          const s = String(a).trim();
          const bySlug = amenityCatalog.find((c) => c.slug === s);
          if (bySlug) return bySlug.slug;
          const byLabel = amenityCatalog.find((c) => c.label === s);
          if (byLabel) return byLabel.slug;
          return null;
        })
        .filter((x): x is string => x != null),
    }));
  }, [isCreateMode, amenityCatalog]);

  useEffect(() => {
    if (isCreateMode) {
      setLoading(false);
      return;
    }
    if (!validId) {
      setLoading(false);
      setError('ID de hotel inválido');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('hotels')
        .select('id, name, phone, location, municipality, state, country, price, rating, reviews, image, amenities, stars, description, tags, "isSoldOut", check_in_time, check_out_time, meal_plans, travel_styles, pet_friendly, plan_inclusions')
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
          phone: data.phone || '',
          location: data.location || '',
          municipality: data.municipality ?? '',
          state: data.state ?? '',
          country: data.country ?? '',
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
          meal_plans: Array.isArray(data.meal_plans) ? data.meal_plans.filter((m: { type?: string }) => m?.type === 'desayuno' || m?.type === 'todo_incluido').map((m: { type?: string; cost?: number; cost_children?: number }) => ({ type: String(m?.type ?? ''), cost: Number(m?.cost ?? 0), cost_children: Number(m?.cost_children ?? 0) })) : [],
          travel_styles: Array.isArray(data.travel_styles) ? data.travel_styles : [],
          pet_friendly: Boolean(data.pet_friendly),
          plan_inclusions: Array.isArray(data.plan_inclusions)
            ? data.plan_inclusions.map((x: { title?: string; description?: string }) => ({ title: String(x?.title ?? ''), description: String(x?.description ?? '') }))
            : [],
        });
          setSinPlanAlimentos(
          !Array.isArray(data.meal_plans) ||
          data.meal_plans.filter((m: { type?: string }) => m?.type === 'desayuno' || m?.type === 'todo_incluido').length === 0
        );
        const { lada, local } = parsePhone(data.phone || '');
        setPhoneLada(lada);
        setPhoneLocal(local);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [idNum, validId, isCreateMode]);

  // Cargar galería de imágenes (solo en edición). Si falta columna description, se reintenta sin ella.
  useEffect(() => {
    if (isCreateMode || !validId || idNum <= 0) {
      setGalleryImages([]);
      return;
    }
    let cancelled = false;
    setGalleryLoading(true);
    const selectFull = 'id, url, sort_order, description, url_medium, url_small';
    const selectMinimal = 'id, url, sort_order';
    supabase
      .from('hotel_images')
      .select(selectFull)
      .eq('hotel_id', idNum)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error && /description|url_medium|url_small|column.*schema cache/i.test(String(error.message))) {
          hotelImagesHasDescriptionRef.current = false;
          supabase
            .from('hotel_images')
            .select(selectMinimal)
            .eq('hotel_id', idNum)
            .order('sort_order', { ascending: true })
            .then(({ data: data2, error: err2 }) => {
              if (cancelled) return;
              if (err2) {
                setGalleryImages([]);
                return;
              }
              const rows = (data2 as { id: number; url: string; sort_order: number }[]) || [];
              setGalleryImages(rows.map((r) => ({ ...r, description: null, url_medium: null, url_small: null })));
            })
            .finally(() => { if (!cancelled) setGalleryLoading(false); });
          return;
        }
        if (error) {
          setGalleryImages([]);
          setGalleryLoading(false);
          return;
        }
        hotelImagesHasDescriptionRef.current = true;
        const rows = (data as { id: number; url: string; sort_order: number; description?: string | null; url_medium?: string | null; url_small?: string | null }[]) || [];
        setGalleryImages(rows.map((r) => ({ ...r, description: r.description ?? null, url_medium: r.url_medium ?? null, url_small: r.url_small ?? null })));
      })
      .finally(() => { if (!cancelled) setGalleryLoading(false); });
    return () => { cancelled = true; };
  }, [idNum, validId, isCreateMode]);

  const openCropStep = (file: File) => {
    setUploadError(null);
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceFile(file);
    setCropSourceUrl(URL.createObjectURL(file));
    setCropPct(null);
    setCropNatural(null);
    setCropDisplay(null);
  };

  const closeCropStep = () => {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceFile(null);
    setCropSourceUrl(null);
    setCropPct(null);
    setCropNatural(null);
    setCropDisplay(null);
  };

  const onCropImageLoad = () => {
    const img = cropImageRef.current;
    if (!img || !cropSourceUrl) return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;
    const aspect = nw / nh;
    const width = aspect >= CROP_ASPECT ? (CROP_ASPECT / aspect) : 1;
    const height = aspect >= CROP_ASPECT ? 1 : (1 / CROP_ASPECT) * aspect;
    const left = (1 - width) / 2;
    const top = (1 - height) / 2;
    setCropNatural({ w: nw, h: nh });
    const scale = Math.min(CROP_PREVIEW_MAX.w / nw, CROP_PREVIEW_MAX.h / nh, 1);
    setCropDisplay({ w: Math.round(nw * scale), h: Math.round(nh * scale) });
    setCropPct({ left, top, width, height });
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cropPct) return;
    cropDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startLeft: cropPct.left, startTop: cropPct.top };
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropDragRef.current.active || !cropPct || !cropDisplay) return;
    const dx = (e.clientX - cropDragRef.current.startX) / cropDisplay.w;
    const dy = (e.clientY - cropDragRef.current.startY) / cropDisplay.h;
    const newLeft = Math.max(0, Math.min(1 - cropPct.width, cropDragRef.current.startLeft + dx));
    const newTop = Math.max(0, Math.min(1 - cropPct.height, cropDragRef.current.startTop + dy));
    setCropPct((p) => p ? { ...p, left: newLeft, top: newTop } : null);
    cropDragRef.current.startLeft = newLeft;
    cropDragRef.current.startTop = newTop;
    cropDragRef.current.startX = e.clientX;
    cropDragRef.current.startY = e.clientY;
  };

  const handleCropMouseUp = () => {
    cropDragRef.current.active = false;
  };

  const handleCropAccept = async () => {
    const img = cropImageRef.current;
    if (!img || !cropPct || !cropNatural || !validId || idNum <= 0) return;
    setUploadLoading(true);
    setUploadError(null);
    try {
      const { w: nw, h: nh } = cropNatural;
      const sx = cropPct.left * nw;
      const sy = cropPct.top * nh;
      const sw = cropPct.width * nw;
      const sh = cropPct.height * nh;

      const drawToBlob = (outW: number, outH: number): Promise<Blob | null> => {
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return Promise.resolve(null);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        return new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY);
        });
      };

      const blobs = await Promise.all(
        CROP_OUTPUT_SIZES.map((size) => drawToBlob(size.w, size.h))
      );
      if (blobs.some((b) => !b)) throw new Error('No se pudo generar alguna imagen');

      const uuid = crypto.randomUUID();
      const paths = [
        `${idNum}/${uuid}.webp`,
        `${idNum}/${uuid}-m.webp`,
        `${idNum}/${uuid}-s.webp`,
      ];
      for (let i = 0; i < 3; i++) {
        const { error: upErr } = await supabase.storage.from(BUCKET_HOTEL_IMAGES).upload(paths[i], blobs[i]!, {
          contentType: 'image/webp',
          upsert: false,
        });
        if (upErr) throw upErr;
      }
      const publicUrl = supabase.storage.from(BUCKET_HOTEL_IMAGES).getPublicUrl(paths[0]).data.publicUrl;
      const publicUrlMedium = supabase.storage.from(BUCKET_HOTEL_IMAGES).getPublicUrl(paths[1]).data.publicUrl;
      const publicUrlSmall = supabase.storage.from(BUCKET_HOTEL_IMAGES).getPublicUrl(paths[2]).data.publicUrl;

      const maxOrder = galleryImages.length === 0 ? 0 : Math.max(...galleryImages.map((i) => i.sort_order), 0);
      const basePayload = { hotel_id: idNum, url: publicUrl, sort_order: maxOrder + 1 };
      const payloadWithSizes = { ...basePayload, url_medium: publicUrlMedium, url_small: publicUrlSmall };
      if (hotelImagesHasDescriptionRef.current !== false) (payloadWithSizes as { description?: null }).description = null;
      const selectFull = hotelImagesHasDescriptionRef.current === false
        ? 'id, url, sort_order, url_medium, url_small'
        : 'id, url, sort_order, description, url_medium, url_small';
      let { data: row, error: insErr } = await supabase.from('hotel_images').insert(payloadWithSizes).select(selectFull).single();
      if (insErr && (/description|url_medium|url_small|schema cache/i.test(String(insErr.message)))) {
        hotelImagesHasDescriptionRef.current = /description/i.test(String(insErr.message)) ? false : hotelImagesHasDescriptionRef.current;
        const fallbackPayload = /url_medium|url_small/i.test(String(insErr.message))
          ? basePayload
          : { ...basePayload, url_medium: publicUrlMedium, url_small: publicUrlSmall };
        if (hotelImagesHasDescriptionRef.current !== false && !/url_medium|url_small/i.test(String(insErr.message))) (fallbackPayload as { description?: null }).description = null;
        const selectFallback = hotelImagesHasDescriptionRef.current === false ? 'id, url, sort_order' : 'id, url, sort_order, description';
        const res = await supabase.from('hotel_images').insert(fallbackPayload).select(selectFallback).single();
        insErr = res.error;
        row = res.data;
      }
      if (insErr) throw insErr;
      const r = row as { id: number; url: string; sort_order: number; description?: string | null; url_medium?: string | null; url_small?: string | null };
      setGalleryImages((prev) => [...prev, {
        id: r.id,
        url: publicUrl,
        sort_order: r.sort_order,
        description: r.description ?? null,
        url_medium: r.url_medium ?? null,
        url_small: r.url_small ?? null,
      }]);
      closeCropStep();
    } catch (err: unknown) {
      setUploadError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Error al guardar');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validId || idNum <= 0) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpeg', 'jpg', 'png', 'webp'].includes(ext)) {
      setUploadError('Formato no válido. Usa JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar 5 MB.');
      return;
    }
    openCropStep(file);
  };

  useEffect(() => {
    if (!cropSourceUrl) return;
    const onMove = (e: MouseEvent) => {
      if (!cropDragRef.current.active || !cropPct || !cropDisplay) return;
      const dx = (e.clientX - cropDragRef.current.startX) / cropDisplay.w;
      const dy = (e.clientY - cropDragRef.current.startY) / cropDisplay.h;
      const newLeft = Math.max(0, Math.min(1 - cropPct.width, cropDragRef.current.startLeft + dx));
      const newTop = Math.max(0, Math.min(1 - cropPct.height, cropDragRef.current.startTop + dy));
      setCropPct((p) => p ? { ...p, left: newLeft, top: newTop } : null);
      cropDragRef.current.startLeft = newLeft;
      cropDragRef.current.startTop = newTop;
      cropDragRef.current.startX = e.clientX;
      cropDragRef.current.startY = e.clientY;
    };
    const onUp = () => { cropDragRef.current.active = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [cropSourceUrl, cropPct?.width, cropPct?.height, cropDisplay]);

  const getStoragePathFromUrl = (url: string): string | null => {
    const match = url.match(/\/object\/public\/hotel-images\/(.+)$/);
    return match?.[1] ?? null;
  };

  /** Paths a borrar en Storage: grande, mediano (-m) y pequeño (-s). Usa URLs si existen, si no deriva -m y -s del path grande. */
  const getStoragePathsToRemove = (imageUrl: string, urlMedium?: string | null, urlSmall?: string | null): string[] => {
    const paths: string[] = [];
    const p1 = getStoragePathFromUrl(imageUrl);
    if (p1) {
      paths.push(p1);
      const hasMedium = urlMedium && getStoragePathFromUrl(urlMedium);
      const hasSmall = urlSmall && getStoragePathFromUrl(urlSmall);
      if (!hasMedium && p1.endsWith('.webp')) paths.push(p1.replace(/\.webp$/, '-m.webp'));
      if (!hasSmall && p1.endsWith('.webp')) paths.push(p1.replace(/\.webp$/, '-s.webp'));
    }
    if (urlMedium) { const p = getStoragePathFromUrl(urlMedium); if (p && !paths.includes(p)) paths.push(p); }
    if (urlSmall) { const p = getStoragePathFromUrl(urlSmall); if (p && !paths.includes(p)) paths.push(p); }
    return paths;
  };

  const openDeleteConfirm = (imageId: number, imageUrl: string, urlMedium?: string | null, urlSmall?: string | null) => {
    setDeleteConfirmImage({ id: imageId, url: imageUrl, url_medium: urlMedium ?? null, url_small: urlSmall ?? null });
  };

  const handleGalleryDeleteConfirm = async () => {
    if (!deleteConfirmImage) return;
    const { id: imageId, url: imageUrl, url_medium: urlMedium, url_small: urlSmall } = deleteConfirmImage;
    setDeleteConfirmImage(null);
    try {
      const { error: delErr } = await supabase.from('hotel_images').delete().eq('id', imageId);
      if (delErr) throw delErr;
      setGalleryImages((prev) => prev.filter((i) => i.id !== imageId));
      const paths = getStoragePathsToRemove(imageUrl, urlMedium ?? undefined, urlSmall ?? undefined);
      if (paths.length) await supabase.storage.from(BUCKET_HOTEL_IMAGES).remove(paths);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Error al eliminar');
    }
  };

  const handleGalleryDescriptionChange = async (imageId: number, description: string) => {
    setGalleryImages((prev) => prev.map((i) => (i.id === imageId ? { ...i, description: description || null } : i)));
    const { error: upErr } = await supabase.from('hotel_images').update({ description: description.trim() || null }).eq('id', imageId);
    if (upErr && !/description|schema cache/i.test(upErr.message)) setError(upErr.message);
  };

  const handleSetAsMainImage = async (imageId: number) => {
    const selected = galleryImages.find((i) => i.id === imageId);
    const currentFirst = galleryImages[0];
    if (!selected || selected.id === currentFirst.id) return;
    try {
      const newSortSelected = currentFirst.sort_order - 1;
      const { error: e1 } = await supabase.from('hotel_images').update({ sort_order: newSortSelected }).eq('id', imageId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('hotel_images').update({ sort_order: selected.sort_order }).eq('id', currentFirst.id);
      if (e2) throw e2;
      setGalleryImages((prev) => {
        const idx = prev.findIndex((i) => i.id === imageId);
        if (idx <= 0) return prev;
        const selectedImg = prev[idx];
        const rest = prev.filter((i) => i.id !== imageId);
        const restWithNewSort = rest.map((i) => (i.id === currentFirst.id ? { ...i, sort_order: selected.sort_order } : i));
        const sortedRest = restWithNewSort.sort((a, b) => a.sort_order - b.sort_order);
        return [{ ...selectedImg, sort_order: newSortSelected }, ...sortedRest];
      });
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Error al cambiar imagen principal');
    }
  };

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
          const comps = (place as { address_components?: { long_name: string; types: string[] }[] })?.address_components;
          if (comps?.length) {
            const { municipality, state, country } = parseAddressComponents(comps);
            setForm((f) => ({ ...f, municipality, state, country }));
          }
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
          const comps = (place as { address_components?: { long_name: string; types: string[] }[] })?.address_components;
          if (comps?.length) {
            const { municipality, state, country } = parseAddressComponents(comps);
            setForm((f) => ({ ...f, municipality, state, country }));
          }
          const loc = place?.geometry?.location;
          if (loc) setMapCenter({ lat: loc.lat(), lng: loc.lng() });
        });
        setAutocompleteReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [GOOGLE_MAPS_API_KEY, loading]);

  // Actualizar dirección, estado y país desde coordenadas (clic en mapa o arrastrar marcador)
  const updateLocationFromCoords = React.useCallback(async (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    try {
      const { address, municipality, state, country } = await reverseGeocode(lat, lng);
      setForm((f) => ({ ...f, location: address, municipality, state, country }));
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
          const { address, municipality, state, country } = await reverseGeocode(latitude, longitude);
          setForm((f) => ({ ...f, location: address, municipality, state, country }));
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
    if (!form.name.trim() || !form.location.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const phoneFull = [phoneLada.trim(), phoneLocal.trim()].filter(Boolean).join(' ').trim() || null;
      const payload = {
        name: form.name.trim(),
        phone: phoneFull,
        location: form.location.trim(),
        municipality: form.municipality.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        price: form.price,
        rating: form.rating,
        reviews: form.reviews,
        image: galleryImages.length > 0 ? galleryImages[0].url : (form.image.trim() || null),
        amenities: form.amenities,
        stars: form.stars,
        description: form.description.trim() || null,
        tags: form.tags,
        isSoldOut: form.isSoldOut,
        check_in_time: form.check_in_time.trim() || '15:00',
        check_out_time: form.check_out_time.trim() || '11:00',
        meal_plans: form.meal_plans,
        travel_styles: form.travel_styles,
        pet_friendly: form.pet_friendly,
        plan_inclusions: form.plan_inclusions,
      };
      if (isCreateMode) {
        const { error: err } = await supabase.from('hotels').insert(payload);
        if (err) throw err;
        onSuccess?.();
        onBack();
      } else {
        const { error: err } = await supabase.from('hotels').update(payload).eq('id', idNum);
        if (err) throw err;
        onBack();
      }
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e
        ? String((e as { message: string }).message)
        : e instanceof Error ? e.message : 'Error al guardar';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const tagsText = form.tags.join(', ');
  const amenityByCategory = amenityCatalog.reduce<Record<string, AmenityCatalogItem[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});
  const amenityCategories = [...new Set(amenityCatalog.map((a) => a.category))].sort();
  const toggleAmenity = (slug: string) => {
    setForm((f) =>
      f.amenities.includes(slug)
        ? { ...f, amenities: f.amenities.filter((x) => x !== slug) }
        : { ...f, amenities: [...f.amenities, slug] }
    );
  };

  if (!isCreateMode && !validId) {
    return (
      <div className="p-8">
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">Volver</button>
      </div>
    );
  }

  if (!isCreateMode && loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Cargando...</p>
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
            <h1 className="text-2xl font-bold text-[#111827] leading-tight">{isCreateMode ? 'Registrar hotel' : 'Editar información del hotel'}</h1>
            {!isCreateMode && <p className="text-xs text-gray-400 font-medium">ID: #{hotelId}</p>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 max-w-2xl">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" required />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono de contacto</label>
              <div className="flex rounded-lg border border-gray-200 overflow-visible bg-white">
                <div className="flex items-center bg-gray-100 border-r border-gray-200 px-2 min-w-[100px]">
                  <span className="text-2xl mr-2 select-none" title={LADA_COUNTRIES.find((c) => c.code === phoneLada) ?? LADA_COUNTRIES.find((c) => phoneLada !== '+' && c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, '')))?.name}>
                    {(LADA_COUNTRIES.find((c) => c.code === phoneLada) ?? LADA_COUNTRIES.find((c) => phoneLada !== '+' && c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))))?.flag ?? '🌐'}
                  </span>
                  <input
                    ref={ladaInputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="+52"
                    value={phoneLada}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const norm = raw.trim().startsWith('+') ? raw : '+' + raw.replace(/\D/g, '');
                      setPhoneLada(norm || '+');
                    }}
                    onFocus={() => setLadaOpen(true)}
                    onBlur={() => setTimeout(() => setLadaOpen(false), 200)}
                    className="w-14 bg-transparent text-sm font-medium outline-none text-gray-800 py-2.5"
                  />
                </div>
                {ladaOpen && (
                  <div className="absolute z-50 mt-1 left-0 right-0 md:right-auto md:w-80 max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1 top-full">
                    {LADA_COUNTRIES.filter((c) => !phoneLada || phoneLada === '+' || c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))).slice(0, 12).map((c) => (
                      <button
                        key={c.code + c.name}
                        type="button"
                        onClick={() => { setPhoneLada(c.code); setLadaOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-800"
                      >
                        <span className="text-xl">{c.flag}</span>
                        <span className="font-medium">{c.code}</span>
                        <span className="text-gray-500">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="Ej. 55 1234 5678"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800 border-0 rounded-r-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ubicación <span className="text-red-500">*</span></label>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Municipio</label>
                <input type="text" value={form.municipality} onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Ej. Querétaro, Benito Juárez" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                <input type="text" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Ej. Querétaro, CDMX" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">País</label>
                <input type="text" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Ej. México" />
              </div>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Imagen principal del hotel</label>
                {galleryImages.length > 0 ? (
                  <p className="text-sm text-gray-600">Se usa la primera imagen de la galería como imagen principal.</p>
                ) : (
                  <input type="url" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="https://... o añade una imagen en Gestionar galería" />
                )}
              </div>
            </div>
            {!isCreateMode && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Galería de imágenes</label>
                <p className="text-xs text-gray-500 mb-2">Imágenes del hotel en Supabase Storage. JPEG, PNG o WebP, máx. 5 MB.</p>
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_library</span>
                  Gestionar galería
                  {galleryImages.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{galleryImages.length}</span>
                  )}
                </button>
              </div>
            )}
            {!isCreateMode && galleryModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => { closeCropStep(); setDeleteConfirmImage(null); setGalleryModalOpen(false); }}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Galería de imágenes del hotel</h3>
                    <button type="button" onClick={() => { closeCropStep(); setDeleteConfirmImage(null); setGalleryModalOpen(false); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                      <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                  </div>
                  <div className="p-6 overflow-auto flex-1">
                    <input
                      id="gallery-file-input"
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleGalleryUpload}
                      disabled={uploadLoading}
                      className="hidden"
                      aria-hidden
                    />
                    {uploadError && <p className="text-sm text-red-600 mb-3">{uploadError}</p>}
                    {cropSourceUrl ? (
                      <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-600">Ajusta el recorte (arrastra el marco punteado). Se guardará en formato WebP.</p>
                        <div
                          className="inline-block mx-auto"
                          style={cropDisplay ? { width: cropDisplay.w, height: cropDisplay.h } : undefined}
                          onMouseMove={handleCropMouseMove}
                          onMouseUp={handleCropMouseUp}
                          onMouseLeave={handleCropMouseUp}
                        >
                          <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
                            <img
                              ref={cropImageRef}
                              src={cropSourceUrl}
                              alt="Recorte"
                              className="block w-full h-full object-contain"
                              style={cropDisplay ? { width: cropDisplay.w, height: cropDisplay.h } : undefined}
                              onLoad={onCropImageLoad}
                              draggable={false}
                            />
                            {cropPct && (
                              <div
                                role="presentation"
                                className="absolute border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
                                style={{
                                  left: `${cropPct.left * 100}%`,
                                  top: `${cropPct.top * 100}%`,
                                  width: `${cropPct.width * 100}%`,
                                  height: `${cropPct.height * 100}%`,
                                }}
                                onMouseDown={handleCropMouseDown}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={closeCropStep}
                            disabled={uploadLoading}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleCropAccept}
                            disabled={uploadLoading || !cropPct}
                            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium text-sm disabled:opacity-50"
                          >
                            {uploadLoading ? 'Guardando...' : 'Aceptar'}
                          </button>
                        </div>
                      </div>
                    ) : galleryLoading ? (
                      <p className="text-sm text-gray-500 py-8 text-center">Cargando galería...</p>
                    ) : galleryImages.length === 0 ? (
                      <label htmlFor="gallery-file-input" className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 min-h-[280px] cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors">
                        {uploadLoading ? (
                          <span className="text-sm text-gray-500">Subiendo...</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[48px] text-gray-400 mb-2">add_photo_alternate</span>
                            <span className="text-sm font-medium text-gray-600">Añadir imagen</span>
                            <span className="text-xs text-gray-400 mt-1">JPEG, PNG o WebP, máx. 5 MB</span>
                          </>
                        )}
                      </label>
                    ) : (
                      <div className="flex flex-col gap-5">
                        <div className="flex gap-4 items-start">
                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <p className="text-sm font-bold text-gray-700">Imagen principal</p>
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
                              <img src={galleryImages[0].url} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(galleryImages[0].id, galleryImages[0].url, galleryImages[0].url_medium, galleryImages[0].url_small)}
                                className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-red-500 text-white opacity-90 hover:opacity-100 shadow"
                                title="Eliminar imagen"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={galleryImages[0].description ?? ''}
                              onChange={(e) => setGalleryImages((prev) => prev.map((i) => (i.id === galleryImages[0].id ? { ...i, description: e.target.value } : i)))}
                              onBlur={(e) => handleGalleryDescriptionChange(galleryImages[0].id, e.target.value)}
                              placeholder="Descripción de la imagen"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <label htmlFor="gallery-file-input" className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 min-w-[140px] h-[140px] cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors shrink-0">
                            {uploadLoading ? (
                              <span className="text-xs text-gray-500">Subiendo...</span>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[32px] text-gray-400 mb-1">add_photo_alternate</span>
                                <span className="text-xs font-medium text-gray-600 text-center px-2">Añadir otra imagen</span>
                              </>
                            )}
                          </label>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Otras imágenes</p>
                          <div className="grid grid-cols-4 gap-4">
                            {galleryImages.slice(1).map((img) => (
                              <div key={img.id} className="flex flex-col gap-1.5">
                                <div className="relative aspect-square max-w-[180px] w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                  <img src={img.url_medium || img.url} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => openDeleteConfirm(img.id, img.url, img.url_medium, img.url_small)}
                                    className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                                    title="Eliminar"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetAsMainImage(img.id)}
                                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white shadow hover:bg-blue-600"
                                    title="Establecer como imagen principal"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={img.description ?? ''}
                                  onChange={(e) => setGalleryImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, description: e.target.value } : i)))}
                                  onBlur={(e) => handleGalleryDescriptionChange(img.id, e.target.value)}
                                  placeholder="Descripción"
                                  className="w-full px-1.5 py-1 border border-gray-200 rounded text-[10px] placeholder:text-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button type="button" onClick={() => setGalleryModalOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700">
                      Cerrar
                    </button>
                  </div>
                </div>
                {deleteConfirmImage && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 rounded-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
                      <p className="text-gray-800 font-medium mb-4">¿Eliminar esta imagen de la galería?</p>
                      <div className="flex justify-center gap-3">
                        <button type="button" onClick={() => setDeleteConfirmImage(null)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">
                          Cancelar
                        </button>
                        <button type="button" onClick={handleGalleryDeleteConfirm} className="px-4 py-2.5 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estilo de Viaje</label>
              <p className="text-xs text-gray-500 mb-2">Pueden seleccionar una o todas.</p>
              <div className="flex flex-wrap gap-4">
                {TRAVEL_STYLE_OPTIONS.map((style) => (
                  <label key={style} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.travel_styles.includes(style)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm((f) => ({ ...f, travel_styles: [...f.travel_styles, style] }));
                        } else {
                          setForm((f) => ({ ...f, travel_styles: f.travel_styles.filter((s) => s !== style) }));
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">{style}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pet_friendly" checked={form.pet_friendly} onChange={(e) => setForm((f) => ({ ...f, pet_friendly: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="pet_friendly" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">pets</span>
                Pet friendly
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Amenidades</label>
              <p className="text-xs text-gray-500 mb-3">Selecciona de la lista del catálogo. Gestiona el catálogo en Hoteles → Amenidades.</p>
              {amenityCatalog.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Cargando catálogo...</p>
              ) : (
                <div className="space-y-4">
                  {amenityCategories.map((cat) => (
                    <div key={cat} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{AMENITY_CATEGORY_LABELS[cat] ?? cat}</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(amenityByCategory[cat] ?? []).sort((a, b) => a.sort_order - b.sort_order).map((a) => (
                          <label
                            key={a.id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                              form.amenities.includes(a.slug)
                                ? 'border-primary bg-blue-50 text-primary'
                                : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-blue-50/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.amenities.includes(a.slug)}
                              onChange={() => toggleAmenity(a.slug)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium">{a.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <label className="block text-sm font-bold text-gray-700 mb-1">Planes</label>
              <p className="text-xs text-gray-500 mb-2">Marca los que ofrece el hotel e indica el costo por persona/noche (0 = incluido). Costo adultos y costo menores pueden ser distintos.</p>
              <div className="space-y-3">
                {/* Sin plan de alimentos: si está marcado, el hotel NO ofrece planes de comida (meal_plans = []) */}
                <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                  <input
                    type="checkbox"
                    id="meal-sin_plan"
                    checked={sinPlanAlimentos}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSinPlanAlimentos(true);
                        setForm((f) => ({ ...f, meal_plans: [] }));
                      } else {
                        setSinPlanAlimentos(false);
                      }
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="meal-sin_plan" className="text-sm font-medium text-gray-700">Sin plan de alimentos (no ofrece este servicio)</label>
                </div>
                {/* Desayuno y Todo incluido: solo se muestran si el hotel SÍ ofrece planes */}
                {!sinPlanAlimentos && MEAL_PLAN_OPTIONS.map((opt) => {
                  const current = form.meal_plans.find((m) => m.type === opt.type);
                  const offered = !!current;
                  const cost = current?.cost ?? 0;
                  const costChildren = current?.cost_children ?? 0;
                  return (
                    <div key={opt.type} className="flex flex-wrap items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                      <input
                        type="checkbox"
                        id={`meal-${opt.type}`}
                        checked={offered}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((f) => ({ ...f, meal_plans: [...f.meal_plans.filter((m) => m.type !== opt.type), { type: opt.type, cost: 0, cost_children: 0 }] }));
                          } else {
                            setForm((f) => ({ ...f, meal_plans: f.meal_plans.filter((m) => m.type !== opt.type) }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`meal-${opt.type}`} className="text-sm font-medium text-gray-700 min-w-[100px]">{opt.label}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Adultos:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={offered ? cost : ''}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            meal_plans: f.meal_plans.some((m) => m.type === opt.type)
                              ? f.meal_plans.map((m) => (m.type === opt.type ? { ...m, cost: Number(e.target.value) || 0 } : m))
                              : [...f.meal_plans, { type: opt.type, cost: Number(e.target.value) || 0, cost_children: 0 }],
                          }))}
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                          placeholder="0"
                          disabled={!offered}
                        />
                        <span className="text-xs text-gray-400">MXN</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Menores:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={offered ? costChildren : ''}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            meal_plans: f.meal_plans.some((m) => m.type === opt.type)
                              ? f.meal_plans.map((m) => (m.type === opt.type ? { ...m, cost_children: Number(e.target.value) || 0 } : m))
                              : [...f.meal_plans, { type: opt.type, cost: 0, cost_children: Number(e.target.value) || 0 }],
                          }))}
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                          placeholder="0"
                          disabled={!offered}
                        />
                        <span className="text-xs text-gray-400">MXN</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {form.meal_plans.some((m) => m.type === 'todo_incluido') && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Qué incluye el plan Todo Incluido</label>
                <p className="text-xs text-gray-500 mb-2">Define las inclusiones del plan Todo Incluido (ej. Habitaciones, Alimentos y Bebidas, Actividades). Se mostrarán en el detalle del hotel junto al plan.</p>
                <div className="space-y-3">
                  {(form.plan_inclusions || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            plan_inclusions: f.plan_inclusions.map((x, i) => i === idx ? { ...x, title: e.target.value } : x),
                          }))}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="Ej. Habitaciones"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            plan_inclusions: f.plan_inclusions.map((x, i) => i === idx ? { ...x, description: e.target.value } : x),
                          }))}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="Descripción de lo que incluye"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, plan_inclusions: f.plan_inclusions.filter((_, i) => i !== idx) }))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Quitar"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, plan_inclusions: [...f.plan_inclusions, { title: '', description: '' }] }))}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-primary border border-primary rounded-lg hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Agregar inclusión
                  </button>
                </div>
              </div>
            )}
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
              {saving ? 'Guardando...' : isCreateMode ? 'Registrar hotel' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
