/**
 * Envía correo de restablecimiento de contraseña a un usuario.
 * Uso: node scripts/reset-password.mjs [email]
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
    const m = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+)\s*$/);
    if (m) env.VITE_SUPABASE_URL = m[1].trim();
    const m2 = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.+)\s*$/);
    if (m2) env.VITE_SUPABASE_ANON_KEY = m2[1].trim();
  }
  return env;
}

const email = process.argv[2] || 'efro.dev86@gmail.com';
const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: undefined,
});

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
console.log('Correo de restablecimiento enviado a:', email);
