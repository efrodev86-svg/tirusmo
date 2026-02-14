/**
 * Rellena municipality, state y country de cada hotel en la base de datos usando la ubicación (location).
 * Usa Google Geocoding API para obtener municipio, estado y país.
 * Actualiza solo los hoteles que tengan location y que les falte alguno de estos campos.
 * Uso: node scripts/fill-hotels-state-country.mjs
 *
 * Requiere en .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GOOGLE_MAPS_API_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('No se encontró .env');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function parseAddressComponents(components) {
  let municipality = '';
  let state = '';
  let country = '';
  for (const c of components || []) {
    const types = c.types || [];
    if (types.includes('administrative_area_level_2')) municipality = c.long_name || municipality;
    if (types.includes('locality') && !municipality) municipality = c.long_name || municipality;
    if (types.includes('administrative_area_level_1')) state = c.long_name || state;
    if (types.includes('country')) country = c.long_name || country;
  }
  return { municipality, state, country };
}

async function geocodeAddress(address, apiKey) {
  if (!address || !apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const first = data?.results?.[0];
  if (!first?.address_components?.length) return null;
  return parseAddressComponents(first.address_components);
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = serviceRoleKey || anonKey;
  const googleKey = env.VITE_GOOGLE_MAPS_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan VITE_SUPABASE_URL y (VITE_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY) en .env');
    process.exit(1);
  }
  if (!googleKey) {
    console.error('Falta VITE_GOOGLE_MAPS_API_KEY en .env para geocodificar direcciones.');
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY no está en .env: las actualizaciones pueden fallar por RLS. Añádela para que el script pueda actualizar hoteles.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: hotels, error: fetchError } = await supabase
    .from('hotels')
    .select('id, name, location, municipality, state, country')
    .not('location', 'is', null);

  if (fetchError) {
    console.error('Error al obtener hoteles:', fetchError.message);
    process.exit(1);
  }

  if (!hotels?.length) {
    console.log('No hay hoteles con ubicación.');
    return;
  }

  console.log(`Total hoteles con ubicación: ${hotels.length}`);
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const hotel of hotels) {
    const loc = (hotel.location || '').trim();
    if (!loc) {
      skipped++;
      continue;
    }

    const result = await geocodeAddress(loc, googleKey);
    if (!result) {
      console.warn(`  [${hotel.id}] ${hotel.name}: no se pudo geocodificar "${loc.substring(0, 50)}..."`);
      failed++;
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    const { municipality, state, country } = result;
    if (!municipality && !state && !country) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('hotels')
      .update({
        municipality: municipality || null,
        state: state || null,
        country: country || null,
      })
      .eq('id', hotel.id);

    if (updateError) {
      console.error(`  [${hotel.id}] Error al actualizar:`, updateError.message);
      failed++;
    } else {
      console.log(`  [${hotel.id}] ${hotel.name} → Municipio: ${municipality || '(vacío)'}, Estado: ${state || '(vacío)'}, País: ${country || '(vacío)'}`);
      updated++;
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  console.log('\n--- Resumen ---');
  console.log('Actualizados:', updated);
  console.log('Omitidos:', skipped);
  console.log('Fallidos:', failed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
