/**
 * Crea los 10 usuarios del admin en Supabase Auth.
 * El trigger handle_new_user() crea el perfil en public.profiles con user_type.
 * Contraseña temporal para todos: TempPass2025!
 * Uso: node scripts/seed-users.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');

const TEMP_PASSWORD = 'TempPass2025!';

const USERS = [
  { name: 'Alejandro Martínez', email: 'a.martinez@example.com', user_type: 'admin' },
  { name: 'Sofía López', email: 's.lopez@partner.com', user_type: 'partner' },
  { name: 'Carlos Ruíz', email: 'cruiz@gmail.com', user_type: 'cliente' },
  { name: 'Miguel Ángel', email: 'm.angel@outlook.com', user_type: 'cliente' },
  { name: 'Lucía Alva', email: 'l.alva@hotels.com', user_type: 'partner' },
  { name: 'Elena Torres', email: 'e.torres@example.com', user_type: 'cliente' },
  { name: 'Roberto Sánchez', email: 'r.sanchez@hotels.com', user_type: 'partner' },
  { name: 'María García', email: 'm.garcia@gmail.com', user_type: 'cliente' },
  { name: 'Jorge Hernández', email: 'j.hernandez@escapar.mx', user_type: 'admin' },
  { name: 'Ana Morales', email: 'a.morales@outlook.com', user_type: 'cliente' },
];

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('No se encontró .env');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+)\s*$/);
    if (m) env.VITE_SUPABASE_URL = m[1].trim();
    const m2 = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.+)\s*$/);
    if (m2) env.VITE_SUPABASE_ANON_KEY = m2[1].trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const created = [];
  const skipped = [];

  for (const u of USERS) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: TEMP_PASSWORD,
      options: {
        data: { full_name: u.name, user_type: u.user_type },
      },
    });
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        skipped.push({ ...u, reason: 'ya existe' });
      } else {
        console.error(`Error ${u.email}:`, error.message);
        skipped.push({ ...u, reason: error.message });
      }
    } else if (data?.user) {
      created.push(u);
    }
    await supabase.auth.signOut();
  }

  console.log('\n--- Usuarios en base de datos ---\n');
  console.log('Creados:', created.length);
  created.forEach((u) => console.log('  -', u.email, `(${u.user_type})`));
  if (skipped.length) {
    console.log('\nOmitidos (ya existían o error):', skipped.length);
    skipped.forEach((u) => console.log('  -', u.email, u.reason || ''));
  }
  console.log('\nContraseña temporal para todos:', TEMP_PASSWORD);
  console.log('Guárdala y compártela de forma segura; los usuarios pueden cambiarla al iniciar sesión.\n');
}

main();
