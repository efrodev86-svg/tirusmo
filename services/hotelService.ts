import { Hotel } from '../types';
import { supabase } from '../lib/supabase';

/** Lista estática por si la BD no devuelve destinos (fallback). */
export const DESTINATIONS = [
  'Cancún, México',
  'Riviera Maya, México',
  'Playa del Carmen, México',
  'Tulum, México',
  'Puerto Vallarta, México',
  'Los Cabos, México',
  'Ciudad de México, México',
  'San Miguel de Allende, México',
  'Valle de Bravo, México',
  'Tepoztlán, México',
];

/**
 * Obtiene la lista de ubicaciones/destinos desde la base de datos (municipio, estado, país de los hoteles).
 * Incluye "Municipio, Estado, País" y "Estado, País" para que al escribir un carácter aparezcan sugerencias.
 * Se usan en Home → Destino. Si la BD no devuelve nada, usa DESTINATIONS.
 */
export const getDestinations = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('hotels')
    .select('municipality, state, country')
    .not('state', 'is', null)
    .not('country', 'is', null);

  if (error || !data?.length) return DESTINATIONS;

  const seen = new Set<string>();
  const list: string[] = [];
  for (const row of data) {
    const municipality = (row.municipality || '').trim();
    const state = (row.state || '').trim();
    const country = (row.country || '').trim();
    if (!state && !country) continue;
    const stateCountry = `${state}, ${country}`;
    if (!seen.has(stateCountry)) {
      seen.add(stateCountry);
      list.push(stateCountry);
    }
    if (municipality) {
      const full = `${municipality}, ${stateCountry}`;
      if (!seen.has(full)) {
        seen.add(full);
        list.push(full);
      }
    }
  }
  list.sort((a, b) => a.localeCompare(b));
  return list.length ? list : DESTINATIONS;
};

type HotelRow = {
  id: number;
  name: string | null;
  location: string | null;
  state?: string | null;
  country?: string | null;
  price: number | null;
  rating: number | null;
  reviews: number | null;
  image: string | null;
  amenities: string[] | null;
  stars: number | null;
  description: string | null;
  tags: string[] | null;
  isSoldOut?: boolean | null;
  pet_friendly?: boolean | null;
  travel_styles?: string[] | null;
  meal_plans?: { type?: string; cost?: number; cost_children?: number }[] | null;
};

function mapRowToHotel(row: HotelRow): Hotel {
  return {
    id: Number(row.id),
    name: row.name ?? '',
    location: row.location ?? '',
    state: row.state ?? null,
    country: row.country ?? null,
    price: Number(row.price) ?? 0,
    rating: Number(row.rating) ?? 0,
    reviews: Number(row.reviews) ?? 0,
    image: row.image?.trim() || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    stars: Number(row.stars) ?? 0,
    description: row.description ?? '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    isSoldOut: Boolean(row.isSoldOut),
    pet_friendly: Boolean(row.pet_friendly),
    travel_styles: Array.isArray(row.travel_styles) ? row.travel_styles : [],
    meal_plans: Array.isArray(row.meal_plans)
      ? row.meal_plans.map((m) => ({ type: String(m?.type ?? ''), cost: Number(m?.cost ?? 0), cost_children: Number(m?.cost_children ?? 0) }))
      : [],
  };
}

/**
 * Obtiene todos los hoteles desde Supabase (datos de Admin → Hoteles).
 * Los clientes ven los mismos hoteles y habitaciones configurados en el dashboard.
 */
export const getHotels = async (): Promise<Hotel[]> => {
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, location, state, country, price, rating, reviews, image, amenities, stars, description, tags, "isSoldOut", pet_friendly, travel_styles, meal_plans')
    .order('id', { ascending: true });

  if (error) {
    console.warn('Error al cargar hoteles desde Supabase:', error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRowToHotel(row as HotelRow));
};

/**
 * Obtiene un hotel por ID desde Supabase (para la página de reserva al abrir por URL).
 */
export const getHotelById = async (id: number): Promise<Hotel | undefined> => {
  if (!id || Number.isNaN(id)) return undefined;

  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, location, state, country, price, rating, reviews, image, amenities, stars, description, tags, "isSoldOut", pet_friendly, travel_styles, meal_plans')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapRowToHotel(data as HotelRow);
};

/**
 * Simula envío de reserva (aún no persiste en Supabase; ver BookingWizard para conectar).
 */
export const submitReservation = async (_reservationData: unknown): Promise<boolean> => {
  return Promise.resolve(true);
};
