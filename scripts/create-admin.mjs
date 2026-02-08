/**
 * Crea un usuario administrador en Supabase Auth.
 * El trigger handle_new_user() asignará user_type = 'admin' desde metadata.
 * Uso: node scripts/create-admin.mjs
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
    console.error('No se encontró .env en la raíz del proyecto.');
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

function randomPassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let s = '';
  const bytes = new Uint8Array(length);
  randomFillSync(bytes);
  for (let i = 0; i < length; i++) s += chars[bytes[i] % chars.length];
  return s;
}

const ADMIN_EMAIL = 'admin@reservo.mx';

async function main() {
  const env = loadEnv();
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
    process.exit(1);
  }

  const password = randomPassword(16);
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password,
    options: {
      data: { user_type: 'admin', full_name: 'Administrador' },
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('El usuario admin ya existe. Actualizando perfil a admin...');
      const { data: signIn } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD || '',
      });
      if (!signIn?.user) {
        console.error('Para convertir el usuario existente en admin, ejecuta con la contraseña actual:');
        console.error('  ADMIN_PASSWORD=tu_contraseña_actual node scripts/create-admin.mjs');
        process.exit(1);
      }
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ user_type: 'admin' })
        .eq('id', signIn.user.id);
      if (updateErr) {
        console.error('Error al actualizar perfil:', updateErr.message);
        process.exit(1);
      }
      console.log('Perfil actualizado a admin. Usa tu contraseña actual para iniciar sesión.');
      return;
    }
    console.error('Error al crear admin:', error.message);
    process.exit(1);
  }

  if (data?.user) {
    console.log('\n--- Usuario administrador creado ---\n');
    console.log('Email:    ', ADMIN_EMAIL);
    console.log('Password: ', password);
    console.log('\nGuarda la contraseña en un lugar seguro.');
    console.log('Si en Supabase está activada la confirmación de email, revisa el correo para confirmar.\n');
  }
}

main();
