import React, { useState, useRef } from 'react';
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

interface RegisterProps {
  onLoginClick: () => void;
  onRegisterSuccess: () => void;
  onBack: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onLoginClick, onRegisterSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [phoneLada, setPhoneLada] = useState('+52');
  const [ladaOpen, setLadaOpen] = useState(false);
  const ladaInputRef = useRef<HTMLInputElement>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptOffers, setAcceptOffers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeLada = (v: string) => (v.trim().startsWith('+') ? v.trim() : '+' + v.trim().replace(/\D/g, ''));
  const currentLadaCountry = () =>
    LADA_COUNTRIES.find((c) => c.code === phoneLada) ??
    LADA_COUNTRIES.find((c) => c.code === normalizeLada(phoneLada)) ??
    (phoneLada && phoneLada !== '+' ? LADA_COUNTRIES.find((c) => c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))) : null);
  const currentFlag = () => currentLadaCountry()?.flag ?? '🌐';

  const fullPhone = () => [phoneLada.trim(), formData.phone.trim()].filter(Boolean).join(' ').trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(' ') || null,
            last_name: formData.lastName.trim() || null,
            phone: fullPhone() || null,
            user_type: 'cliente'
          }
        }
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data?.user) {
        onRegisterSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full font-display flex items-center justify-center overflow-hidden bg-gray-50">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop")' 
        }}
      ></div>
      {/* Gradient Overlay similar to design */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#8E7F73]/90 to-[#5D4E44]/90 backdrop-blur-[2px]"></div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-6 md:px-10">
        <div className="flex items-center gap-3 cursor-pointer text-white" onClick={onBack}>
          <img src="/favicon-register.svg" alt="Escapar.mx" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold tracking-tight text-[#a8d8b7]">escapar.mx</span>
        </div>
        <div className="flex items-center gap-4 text-white text-sm font-medium">
          <button onClick={onLoginClick} className="bg-white text-primary hover:bg-gray-100 px-4 py-2 rounded transition-colors font-bold">
            Inicia sesión
          </button>
        </div>
      </div>

      {/* Register Card */}
      <div className="relative z-30 w-full max-w-[550px] bg-white rounded-2xl shadow-2xl p-8 mx-4 my-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Registro de Nuevo Usuario</h2>
          <p className="text-gray-500 text-sm">Únete a nuestra comunidad de bienestar</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Nombre *</label>
                <input 
                    type="text" 
                    placeholder="Ej. Juan"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-300"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                />
            </div>

            {/* Apellidos */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Apellidos *</label>
                <input 
                    type="text" 
                    placeholder="Ej. Pérez García"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-300"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Correo electrónico *</label>
                <input 
                    type="email" 
                    placeholder="correo@ejemplo.com"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-300"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

             {/* Phone */}
             <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-gray-700">Teléfono *</label>
                <div className="flex rounded-lg border border-gray-200 overflow-visible bg-white">
                  <div className="flex items-center bg-gray-100 border-r border-gray-200 px-2 min-w-[100px] rounded-l-lg">
                    <span className="text-2xl mr-2 select-none" title={currentLadaCountry()?.name}>{currentFlag()}</span>
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
                      className="w-14 bg-transparent text-sm font-medium outline-none text-gray-800 py-3"
                    />
                  </div>
                  {ladaOpen && (
                    <div className="absolute z-50 mt-1 left-0 right-0 md:right-auto md:w-80 max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1 top-full">
                      {LADA_COUNTRIES.filter((c) => !phoneLada || phoneLada === '+' || c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))).slice(0, 12).map((c) => (
                        <button
                          key={c.code + c.name}
                          type="button"
                          onClick={() => { setPhoneLada(c.code); setLadaOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 text-gray-800"
                        >
                          <span className="text-xl">{c.flag}</span>
                          <span className="font-medium">{c.code}</span>
                          <span className="text-gray-500">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Ej. 55 1234 5678"
                    className="flex-1 min-w-0 px-4 py-3 text-sm text-gray-800 focus:ring-1 focus:ring-inset focus:ring-primary outline-none rounded-r-lg placeholder:text-gray-300"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Contraseña *</label>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-300"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Confirmar contraseña *</label>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-300"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                    />
                </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-3 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm transition-all checked:border-primary checked:bg-primary hover:border-primary"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">Acepto los <a href="#" className="text-primary font-bold hover:underline">términos y condiciones</a> y la política de privacidad.</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm transition-all checked:border-primary checked:bg-primary hover:border-primary"
                            checked={acceptOffers}
                            onChange={(e) => setAcceptOffers(e.target.checked)}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">Deseo recibir ofertas exclusivas, promociones y novedades del SPA.</span>
                </label>
            </div>

            {/* Submit Button */}
            <button 
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-[#3B82F6] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
            >
                {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
            </button>

            {/* Login Link */}
            <div className="mt-2 text-center text-sm text-gray-500 font-medium">
                ¿Ya tienes cuenta? <button type="button" onClick={onLoginClick} className="font-bold text-[#3B82F6] hover:text-blue-700 ml-1">Inicia sesión</button>
            </div>

        </form>
      </div>

       {/* Footer Text */}
       <div className="absolute bottom-4 w-full text-center text-[10px] text-gray-400 z-20">
         © 2026 Escapar.mx. Todos los derechos reservados.
      </div>
      
    </div>
  );
};