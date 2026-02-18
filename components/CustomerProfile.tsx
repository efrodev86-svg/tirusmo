import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/** Catálogo de claves de país para teléfono: bandera (emoji) + clave */
const PHONE_COUNTRY_CODES: { code: string; dial: string; name: string; flag: string }[] = [
  { code: 'MX', dial: '+52', name: 'México', flag: '🇲🇽' },
  { code: 'US', dial: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CA', dial: '+1', name: 'Canadá', flag: '🇨🇦' },
  { code: 'CO', dial: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: 'AR', dial: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'ES', dial: '+34', name: 'España', flag: '🇪🇸' },
  { code: 'CL', dial: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', dial: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: 'EC', dial: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'GT', dial: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CU', dial: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: 'BO', dial: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'DO', dial: '+1 809', name: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'VE', dial: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'HN', dial: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: 'SV', dial: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'NI', dial: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'CR', dial: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', dial: '+507', name: 'Panamá', flag: '🇵🇦' },
  { code: 'UY', dial: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', dial: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'BR', dial: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: 'FR', dial: '+33', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', dial: '+49', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', dial: '+39', name: 'Italia', flag: '🇮🇹' },
  { code: 'GB', dial: '+44', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'CN', dial: '+86', name: 'China', flag: '🇨🇳' },
  { code: 'JP', dial: '+81', name: 'Japón', flag: '🇯🇵' },
  { code: 'IN', dial: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'AU', dial: '+61', name: 'Australia', flag: '🇦🇺' },
];

function parsePhoneForCountry(phone: string): { dial: string; local: string } {
  const raw = (phone || '').trim();
  if (!raw) return { dial: '+52', local: '' };
  const withPlus = raw.startsWith('+') ? raw : `+${raw}`;
  const allDigits = withPlus.replace(/\D/g, '');
  const sorted = [...PHONE_COUNTRY_CODES].sort((a, b) => (b.dial.replace(/\D/g, '').length - a.dial.replace(/\D/g, '').length));
  for (const entry of sorted) {
    const dialDigits = entry.dial.replace(/\D/g, '');
    if (allDigits.startsWith(dialDigits) && dialDigits.length >= 1) {
      const localDigits = allDigits.slice(dialDigits.length);
      const localFormatted = localDigits.replace(/(\d{2})(?=\d{2})/g, '$1 ').replace(/(\d{3})(?=\d)/g, '$1 ');
      return { dial: entry.dial, local: localFormatted.trim() };
    }
  }
  if (allDigits.length === 0) return { dial: '+52', local: '' };
  const dialLen = Math.min(4, allDigits.length);
  return { dial: '+' + allDigits.slice(0, dialLen), local: allDigits.slice(dialLen) };
}

function formatPhoneToSave(dial: string, local: string): string {
  const digits = local.replace(/\D/g, '');
  if (!digits) return '';
  const trimmed = (dial || '').trim();
  const code = trimmed && trimmed !== '+' && trimmed.replace(/\D/g, '').length > 0
    ? (trimmed.startsWith('+') ? trimmed : '+' + trimmed)
    : '+52';
  return `${code} ${digits}`.trim();
}

interface ProfileData {
  full_name: string | null;
  email: string;
  phone: string | null;
}

export const CustomerProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [phoneDial, setPhoneDial] = useState('+52');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phoneSelectOpen, setPhoneSelectOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();
      const email = profileRow?.email ?? user.email ?? '';
      const fullName = profileRow?.full_name ?? user.user_metadata?.full_name ?? '';
      const phone = profileRow?.phone ?? '';
      const { dial, local } = parsePhoneForCountry(phone);
      if (!cancelled) {
        setProfile({ full_name: fullName, email, phone });
        setFormData({ fullName, email, phone });
        setPhoneDial(dial);
        setPhoneLocal(local);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (profile !== null) setLoading(false);
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const phoneToSave = formatPhoneToSave(phoneDial, phoneLocal);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName || null,
        phone: phoneToSave || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      setSaveMessage({ type: 'error', text: error.message });
      return;
    }
    setSaveMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'La nueva contraseña y la confirmación no coinciden.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setPasswordLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setPasswordMessage({ type: 'error', text: 'No se pudo obtener el usuario.' });
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });
      if (signInError) {
        setPasswordMessage({ type: 'error', text: 'Contraseña actual incorrecta.' });
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (updateError) {
        setPasswordMessage({ type: 'error', text: updateError.message });
        return;
      }
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al cambiar la contraseña.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div>
          <h1 className="text-3xl font-black text-[#111827]">Mi Perfil</h1>
          <p className="text-gray-500 mt-1">Cargando...</p>
        </div>
        <div className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  const displayName = formData.fullName?.trim() || profile?.email || 'Usuario';

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div>
        <h1 className="text-3xl font-black text-[#111827]">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal y configuración de seguridad.</p>
      </div>

      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Profile Photo */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B82F6&color=fff&size=128`}
              alt="Perfil"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="font-bold text-lg text-[#111827]">Foto de perfil</h3>
            <p className="text-sm text-gray-500">Tu avatar se genera a partir de tu nombre.</p>
          </div>
        </div>

        {/* Personal Data */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h3 className="font-bold text-lg text-[#111827] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400">badge</span>
            Datos personales
          </h3>
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {saveMessage.text}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#111827]">Nombre completo</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                placeholder="Tu nombre"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#111827]">Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">El correo no se puede cambiar aquí.</p>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold text-[#111827]">Teléfono</label>
              <div className="flex gap-2">
                <div className="relative flex items-stretch bg-[#F9FAFB] border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]">
                  <span className="pl-3 flex items-center text-lg shrink-0" title={PHONE_COUNTRY_CODES.find((c) => c.dial === phoneDial)?.name}>
                    {PHONE_COUNTRY_CODES.find((c) => c.dial === phoneDial)?.flag ?? '🌐'}
                  </span>
                  <input
                    type="text"
                    value={phoneDial}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^\d+]/g, '');
                      if (v && !v.startsWith('+')) v = '+' + v;
                      if (v.length <= 5) setPhoneDial(v || '+');
                    }}
                    onBlur={(e) => {
                      let v = (e.target.value || '').trim();
                      if (!v || v === '+') setPhoneDial('+52');
                      else if (!v.startsWith('+')) setPhoneDial('+' + v);
                    }}
                    className="w-20 py-3 bg-transparent text-sm text-gray-800 outline-none"
                    placeholder="+52"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoneSelectOpen((o) => !o)}
                    className="pr-2 flex items-center text-gray-400 hover:text-gray-600"
                    title="Elegir del catálogo"
                  >
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </button>
                  {phoneSelectOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPhoneSelectOpen(false)} aria-hidden="true" />
                      <div className="absolute left-0 top-full mt-1 z-20 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                        {PHONE_COUNTRY_CODES.map((c) => (
                          <button
                            key={`${c.code}-${c.dial}`}
                            type="button"
                            onClick={() => {
                              setPhoneDial(c.dial);
                              setPhoneSelectOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${c.dial === phoneDial ? 'bg-blue-50 text-[#3B82F6]' : 'text-gray-800'}`}
                          >
                            <span className="text-xl">{c.flag}</span>
                            <span className="font-medium">{c.dial}</span>
                            <span className="text-gray-500 truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="tel"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s]/g, ''))}
                  className="flex-1 px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                  placeholder="55 1234 5678"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-[#3B82F6] text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              Guardar datos
            </button>
          </div>
        </form>

        {/* Security - Change Password */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h3 className="font-bold text-lg text-[#111827] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400">lock</span>
            Cambiar contraseña
          </h3>
          {passwordMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {passwordMessage.text}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#111827]">Contraseña actual</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#111827]">Nueva contraseña</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                minLength={6}
                required
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold text-[#111827]">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repite la nueva contraseña"
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                minLength={6}
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-8 py-3 rounded-xl bg-[#3B82F6] text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all"
            >
              {passwordLoading ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
