import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

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

interface AdminUserDetailProps {
  userId: string;
  onBack: () => void;
  onDeleted?: () => void;
}

export const AdminUserDetail: React.FC<AdminUserDetailProps> = ({ userId, onBack, onDeleted }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    user_type: 'cliente' as 'cliente' | 'partner' | 'admin',
    is_active: true,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [phoneLada, setPhoneLada] = useState('+52');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [ladaOpen, setLadaOpen] = useState(false);
  const ladaInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{ first_name?: string; last_name?: string; phone?: string }>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, full_name, last_name, phone, user_type, is_active')
        .eq('id', userId)
        .single();
      if (cancelled) return;
      if (err || !data) {
        setError(err?.message || 'Usuario no encontrado');
        setLoading(false);
        return;
      }
      const fullName = (data.full_name || '').trim();
      const lastName = (data.last_name || '').trim();
      const firstName = lastName
        ? fullName.replace(new RegExp('\\s+' + lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '').trim()
        : fullName.split(/\s+/)[0] || '';
      const { lada, local } = parsePhone(data.phone || '');
      setPhoneLada(lada);
      setPhoneLocal(local);
      setUserData({
        first_name: firstName,
        last_name: lastName,
        email: data.email || '',
        phone: data.phone || '',
        user_type: (data.user_type as 'cliente' | 'partner' | 'admin') || 'cliente',
        is_active: data.is_active !== false,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs: { first_name?: string; last_name?: string; phone?: string } = {};
    if (!userData.first_name.trim()) errs.first_name = 'El nombre es requerido';
    if (!userData.last_name.trim()) errs.last_name = 'Los apellidos son requeridos';
    if (!phoneLocal.trim()) errs.phone = 'El teléfono es requerido';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const fullName = [userData.first_name.trim(), userData.last_name.trim()].filter(Boolean).join(' ') || null;
      const phoneFull = [phoneLada.trim(), phoneLocal.trim()].filter(Boolean).join(' ').trim() || null;
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          last_name: userData.last_name.trim() || null,
          phone: phoneFull,
          user_type: userData.user_type,
          is_active: userData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    setChangingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPasswordError('Debes tener sesión iniciada.');
        return;
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-set-user-password`;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        setPasswordError('Configuración incompleta (VITE_SUPABASE_ANON_KEY).');
        return;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword,
          access_token: session.access_token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(data.error || `Error ${res.status}`);
        return;
      }
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      setIsDeleteModalOpen(false);
      onDeleted?.();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const displayName = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.email || 'U';
  const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.replace(/\s+/g, '+'))}&background=random`;

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto pb-10">
        <p className="text-gray-500">Cargando usuario...</p>
      </div>
    );
  }

  if (error && !userData.email) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="text-sm font-bold">Volver al listado</span>
        </button>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto pb-10 relative">
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="text-sm font-bold">Volver al listado</span>
        </button>
        <h1 className="text-2xl font-bold text-[#111827]">Información del Usuario</h1>
        <p className="text-gray-500 mt-1">Completa los datos para actualizar el perfil del usuario en la plataforma.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-start gap-6 mb-8">
          <img src={imageUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
          <div className="mt-2">
            <h3 className="font-bold text-[#111827]">Foto de Perfil</h3>
            <p className="text-xs text-gray-500 mt-1">Avatar generado por nombre.</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userData.first_name}
                onChange={(e) => { setUserData((u) => ({ ...u, first_name: e.target.value })); if (fieldErrors.first_name) setFieldErrors((e2) => ({ ...e2, first_name: undefined })); }}
                placeholder="Ej. María"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-1 bg-white text-gray-800 ${fieldErrors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary focus:ring-primary'}`}
              />
              {fieldErrors.first_name && <p className="text-xs text-red-500">{fieldErrors.first_name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userData.last_name}
                onChange={(e) => { setUserData((u) => ({ ...u, last_name: e.target.value })); if (fieldErrors.last_name) setFieldErrors((e2) => ({ ...e2, last_name: undefined })); }}
                placeholder="Ej. García López"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-1 bg-white text-gray-800 ${fieldErrors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary focus:ring-primary'}`}
              />
              {fieldErrors.last_name && <p className="text-xs text-red-500">{fieldErrors.last_name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Correo Electrónico</label>
              <input
                type="email"
                value={userData.email}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                title="El correo no se puede cambiar"
              />
            </div>
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-sm font-bold text-gray-700">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className={`flex rounded-lg border overflow-visible bg-white ${fieldErrors.phone ? 'border-red-500' : 'border-gray-200'}`}>
                <div className="flex items-center bg-gray-100 border-r border-gray-200 px-2 min-w-[100px]">
                  <span className="text-2xl mr-2 select-none" title={(LADA_COUNTRIES.find((c) => c.code === phoneLada) ?? LADA_COUNTRIES.find((c) => phoneLada !== '+' && c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))))?.name}>
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
                  <div className="absolute z-50 mt-11 left-0 right-0 md:right-auto md:w-80 max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    {LADA_COUNTRIES.filter((c) => !phoneLada || phoneLada === '+' || c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))).slice(0, 12).map((c) => (
                      <button
                        key={c.code + c.name}
                        type="button"
                        onClick={() => { setPhoneLada(c.code); setLadaOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <span className="text-xl">{c.flag}</span>
                        <span className="font-medium text-gray-800">{c.code}</span>
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
                  onChange={(e) => { setPhoneLocal(e.target.value); if (fieldErrors.phone) setFieldErrors((e2) => ({ ...e2, phone: undefined })); }}
                  className="flex-1 min-w-0 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800"
                />
              </div>
              {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Rol de Usuario</label>
              <select
                value={userData.user_type}
                onChange={(e) => setUserData((u) => ({ ...u, user_type: e.target.value as 'cliente' | 'partner' | 'admin' }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-800"
              >
                <option value="cliente">Cliente</option>
                <option value="partner">Partner</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-sm text-[#111827]">Estado de la cuenta</h4>
              <p className="text-xs text-gray-500 mt-0.5">Si está inactivo, el usuario no podrá acceder al panel.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userData.is_active}
                onChange={(e) => setUserData((u) => ({ ...u, is_active: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              <span className="ml-3 text-sm font-bold text-gray-700 w-16 text-right">{userData.is_active ? 'Activo' : 'Inactivo'}</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onBack} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 disabled:opacity-60 shadow-md shadow-blue-200">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#111827] mb-2">Cambiar contraseña</h3>
        <p className="text-sm text-gray-500 mb-4">Establece una nueva contraseña para este usuario. Deberá usarla en el próximo inicio de sesión.</p>
        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Contraseña actualizada correctamente.
          </div>
        )}
        {passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {passwordError}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-md">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="self-start px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 disabled:opacity-60"
          >
            {changingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-red-600">Eliminar Cuenta</h3>
          <p className="text-sm text-red-400 mt-1">El usuario dejará de aparecer en el listado. Esta acción se puede revertir desde la base de datos.</p>
        </div>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-5 py-2.5 rounded-lg bg-white border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap"
        >
          Eliminar Usuario
        </button>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !deleting && setIsDeleteModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] relative z-10 p-8 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-5 mx-auto">
              <span className="material-symbols-outlined text-3xl text-red-500 filled">warning</span>
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-2">¿Eliminar usuario?</h3>
            <p className="text-gray-500 text-sm mb-6">El usuario dejará de mostrarse en el listado.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="w-full py-3 px-4 bg-[#DC2626] hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-60 text-sm"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
