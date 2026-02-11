/**
 * Establece una contraseña nueva para un usuario (requiere SUPABASE_SERVICE_ROLE_KEY).
 * Uso: node scripts/set-password-admin.mjs <email> [contraseña]
 * Si no pasas contraseña, se genera una aleatoria y se muestra.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomFillSync } from 'crypto';

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
    const m = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+)\s*$/);
    if (m) env.VITE_SUPABASE_URL = m[1].trim();
    const m2 = line.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)\s*$/);
    if (m2) env.SUPABASE_SERVICE_ROLE_KEY = m2[1].trim();
  }
  return env;
}

function randomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  randomFillSync(bytes);
  let s = '';
  for (let i = 0; i < length; i++) s += chars[bytes[i] % chars.length];
  return s;
}

const email = process.argv[2];
const passwordArg = process.argv[3];
if (!email) {
  console.error('Uso: node scripts/set-password-admin.mjs <email> [contraseña]');
  process.exit(1);
}

const env = loadEnv();
if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  console.error('Obtén la service_role key en: Supabase Dashboard > Project Settings > API > service_role');
  process.exit(1);
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: users, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error('Error listando usuarios:', listErr.message);
  process.exit(1);
}
const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error('Usuario no encontrado:', email);
  process.exit(1);
}

const newPassword = passwordArg && passwordArg.length >= 6 ? passwordArg : randomPassword(14);
const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
if (updateErr) {
  console.error('Error al actualizar contraseña:', updateErr.message);
  process.exit(1);
}

console.log('\n--- Contraseña actualizada ---\n');
console.log('Email:   ', email);
console.log('Password:', newPassword);
console.log('\nGuarda la contraseña; no se volverá a mostrar.\n');
