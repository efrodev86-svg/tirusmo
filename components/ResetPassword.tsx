import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ResetPasswordProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      setValidSession(false);
      return;
    }
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;
    let t: ReturnType<typeof setTimeout>;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setValidSession(true);
        return;
      }
      const sub = supabase.auth.onAuthStateChange((_event, s) => {
        if (!cancelled && s) setValidSession(true);
      });
      subscription = sub.data.subscription;
      t = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (!cancelled) setValidSession(!!s);
        });
      }, 800);
    });
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      clearTimeout(t!);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      window.history.replaceState(null, '', window.location.pathname);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Verificando enlace...</p>
      </div>
    );
  }

  if (validSession === false) {
    return (
      <div className="relative min-h-screen w-full font-display flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop")' }} />
        <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative z-30 w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-8 mx-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido o expirado</h2>
          <p className="text-gray-500 text-sm mb-6">Solicita un nuevo enlace desde la pantalla de inicio de sesión.</p>
          <button onClick={onBack} className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-bold py-3.5 rounded-lg shadow-lg transition-all">
            Ir a Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full font-display flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop")' }} />
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-6 md:px-10">
        <div className="flex items-center gap-3 cursor-pointer text-white" onClick={onBack}>
          <span className="text-2xl font-bold tracking-tight text-[#a8d8b7]">escapar.mx</span>
        </div>
      </div>

      <div className="relative z-30 w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-8 mx-4">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-amber-500 text-2xl">lock_reset</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h2>
          <p className="text-gray-500 text-sm">Elige una contraseña segura para tu cuenta.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">Nueva contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all placeholder:text-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">Confirmar contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all placeholder:text-gray-300"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-[#111827] font-bold py-3.5 rounded-lg shadow-lg transition-all"
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
          <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-amber-500">
            ← Volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
};
