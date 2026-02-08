import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidos en .env');
}

const REMEMBER_ME_KEY = 'rememberMe';

function getAuthStorage(): Storage {
  if (typeof window === 'undefined') return localStorage;
  return window.localStorage.getItem(REMEMBER_ME_KEY) === 'false' ? window.sessionStorage : window.localStorage;
}

const customStorage = {
  getItem: (key: string) => getAuthStorage().getItem(key),
  setItem: (key: string, value: string) => getAuthStorage().setItem(key, value),
  removeItem: (key: string) => getAuthStorage().removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    persistSession: true,
  },
});

export function setRememberMe(value: boolean) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(REMEMBER_ME_KEY, value ? 'true' : 'false');
  }
}
