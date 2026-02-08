import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

type UserType = 'cliente' | 'partner' | 'admin';

interface LoginProps {
  onBack: () => void;
  onLoginSuccess: (type: UserType) => void;
  onRegisterClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack, onLoginSuccess, onRegisterClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (!authData.user) return;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', authData.user.id)
        .single();
      const userType: UserType = (profile?.user_type as UserType) ?? 'cliente';
      onLoginSuccess(userType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full font-display flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop")' // Sunset pool image similar to reference
        }}
      ></div>
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]"></div>

      {/* Custom Header for Login Screen */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-6 md:px-10">
        <div className="flex items-center gap-3 cursor-pointer text-white" onClick={onBack}>
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M35 30 V22 C35 18 38 15 42 15 H58 C62 15 65 18 65 22 V30" stroke="white" strokeWidth="6" strokeLinecap="round" />
                <rect x="20" y="30" width="60" height="50" rx="8" stroke="white" strokeWidth="6" />
                <line x1="32" y1="30" x2="32" y2="80" stroke="white" strokeWidth="6" />
                <path d="M30 80 V88" stroke="white" strokeWidth="6" strokeLinecap="round" />
                <path d="M70 80 V88" stroke="white" strokeWidth="6" strokeLinecap="round" />
                <path d="M55 45 A 10 10 0 0 1 65 55" stroke="#86efac" strokeWidth="4" strokeLinecap="round" />
                <path d="M60 40 A 18 18 0 0 1 75 55" stroke="#86efac" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
                <path d="M55 60 L72 75 L62 77 L66 86 L61 88 L57 79 L50 82 Z" fill="#86efac" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#a8d8b7]">reservo.mx</span>
        </div>
        <div className="flex items-center gap-4 text-white text-sm font-medium">
          <a href="#" className="hover:text-amber-400 transition-colors">Ayuda</a>
          <button className="border border-white/30 hover:bg-white/10 px-4 py-2 rounded transition-colors">
            Contactar Soporte
          </button>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-30 w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-8 mx-4 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Icon & Welcome */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
             <span className="material-symbols-outlined text-amber-500 text-2xl">local_florist</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido de nuevo</h2>
          <p className="text-gray-500 text-sm">Accede a tu panel de gestión personalizada</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Email */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Correo Electrónico</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">mail</span>
                    <input 
                        type="email" 
                        placeholder="ejemplo@correo.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all placeholder:text-gray-300"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700">Contraseña</label>
                    <a href="#" className="text-xs font-bold text-amber-500 hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all placeholder:text-gray-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
                <input 
                    id="remember" 
                    type="checkbox" 
                    className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400 focus:ring-offset-0"
                />
                <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer select-none">Mantener sesión iniciada</label>
            </div>

            {/* Submit Button */}
            <button 
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 disabled:cursor-not-allowed text-[#111827] font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
            >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">login</span>
            </button>

            {/* Register Link */}
            <div className="mt-4 text-center text-sm text-gray-500">
                ¿No tienes una cuenta? <button type="button" onClick={onRegisterClick} className="font-bold text-amber-500 hover:text-amber-600">Regístrate gratis</button>
            </div>

        </form>
      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 w-full flex justify-between px-10 text-xs text-white/50 z-20 hidden md:flex">
         <div className="flex gap-4">
             <a href="#" className="hover:text-white">Términos y Condiciones</a>
             <a href="#" className="hover:text-white">Política de Privacidad</a>
             <a href="#" className="hover:text-white">Cookies</a>
         </div>
         <div>
             © 2024 Reservo.mx. Todos los derechos reservados.
         </div>
      </div>
    </div>
  );
};