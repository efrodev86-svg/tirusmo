import React, { useState, useEffect, useRef } from 'react';
import Home from './components/Home';
import SearchResults from './components/SearchResults';
import BookingWizard from './components/BookingWizard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ResetPassword } from './components/ResetPassword';
import { AdminDashboard } from './components/AdminDashboard';
import { PartnerDashboard } from './components/PartnerDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AboutUs } from './components/AboutUs';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsAndConditions } from './components/TermsAndConditions';
import { ViewState, SearchParams, Hotel } from './types';
import { getHotelById } from './services/hotelService';
import { supabase } from './lib/supabase';

const DASHBOARD_VIEWS = [ViewState.ADMIN_DASHBOARD, ViewState.PARTNER_DASHBOARD, ViewState.CUSTOMER_DASHBOARD];

// Rutas visibles en la URL y breadcrumb
const VIEW_TO_PATH: Record<ViewState, string> = {
  [ViewState.HOME]: '/',
  [ViewState.RESULTS]: '/busqueda',
  [ViewState.BOOKING]: '/reserva',
  [ViewState.LOGIN]: '/login',
  [ViewState.REGISTER]: '/registro',
  [ViewState.RESET_PASSWORD]: '/restablecer-contrasena',
  [ViewState.ADMIN_DASHBOARD]: '/admin',
  [ViewState.PARTNER_DASHBOARD]: '/socio',
  [ViewState.CUSTOMER_DASHBOARD]: '/mi-cuenta',
  [ViewState.ABOUT_US]: '/sobre-nosotros',
  [ViewState.PRIVACY]: '/privacidad',
  [ViewState.TERMS]: '/terminos',
};

const PATH_TO_VIEW: Record<string, ViewState> = Object.fromEntries(
  (Object.entries(VIEW_TO_PATH) as [ViewState, string][]).map(([v, p]) => [p, v])
);

const VIEW_BREADCRUMB_LABEL: Record<ViewState, string> = {
  [ViewState.HOME]: 'Inicio',
  [ViewState.RESULTS]: 'Búsqueda',
  [ViewState.BOOKING]: 'Reserva',
  [ViewState.LOGIN]: 'Iniciar sesión',
  [ViewState.REGISTER]: 'Registro',
  [ViewState.RESET_PASSWORD]: 'Restablecer contraseña',
  [ViewState.ADMIN_DASHBOARD]: 'Admin',
  [ViewState.PARTNER_DASHBOARD]: 'Panel del Hotel',
  [ViewState.CUSTOMER_DASHBOARD]: 'Mi cuenta',
  [ViewState.ABOUT_US]: 'Sobre nosotros',
  [ViewState.PRIVACY]: 'Privacidad',
  [ViewState.TERMS]: 'Términos y condiciones',
};

type HeaderUser = { name: string; avatarUrl: string; userType: 'cliente' | 'partner' | 'admin' };

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [dashboardAllowed, setDashboardAllowed] = useState<boolean | null>(null);
  const [headerUser, setHeaderUser] = useState<HeaderUser | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: {
      adults: 2,
      children: 0,
      rooms: 1
    },
    budgetMin: 0,
    budgetMax: 0
  });
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [hotelLoading, setHotelLoading] = useState(false);
  const fromPopState = useRef(false);

  // Sincronizar vista con URL al cargar y al usar atrás/adelante (no cargar hotel aquí; se hace en el efecto siguiente)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) return;
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    const viewFromPath = PATH_TO_VIEW[pathname];
    if (viewFromPath != null) {
      if (viewFromPath === ViewState.BOOKING) {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('hotel')) setSelectedHotel(null);
      }
      fromPopState.current = true;
      setView(viewFromPath);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const pathname = window.location.pathname.replace(/\/$/, '') || '/';
      const viewFromPath = PATH_TO_VIEW[pathname];
      if (viewFromPath != null) {
        if (viewFromPath === ViewState.BOOKING) {
          const params = new URLSearchParams(window.location.search);
          if (!params.get('hotel')) setSelectedHotel(null);
        }
        fromPopState.current = true;
        setView(viewFromPath);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Cargar hotel por ID cuando estamos en Reserva y la URL tiene ?hotel= (ej. al recargar o abrir enlace)
  useEffect(() => {
    if (view !== ViewState.BOOKING) return;
    const params = new URLSearchParams(window.location.search);
    const hotelIdParam = params.get('hotel');
    const hotelId = hotelIdParam ? Number(hotelIdParam) : 0;
    if (!hotelId || Number.isNaN(hotelId)) {
      setHotelLoading(false);
      return;
    }
    if (selectedHotel?.id === hotelId) {
      setHotelLoading(false);
      return;
    }
    let cancelled = false;
    setHotelLoading(true);
    setSelectedHotel(null);
    getHotelById(hotelId).then((hotel) => {
      if (!cancelled) {
        setSelectedHotel(hotel ?? null);
      }
      if (!cancelled) setHotelLoading(false);
    });
    return () => { cancelled = true; };
  }, [view, selectedHotel?.id]);

  // Actualizar URL cuando cambia la vista
  useEffect(() => {
    if (fromPopState.current) {
      fromPopState.current = false;
      return;
    }
    let path = VIEW_TO_PATH[view];
    if (path === undefined) return;
    if (view === ViewState.BOOKING && selectedHotel) {
      path += `?hotel=${selectedHotel.id}`;
    }
    const newUrl = path + (view === ViewState.BOOKING && selectedHotel ? `?hotel=${selectedHotel.id}` : '');
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.pushState(null, '', newUrl);
    }
  }, [view, selectedHotel]);

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setView(ViewState.RESULTS);
  };

  const handleSelectHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setView(ViewState.BOOKING);
    window.scrollTo(0, 0);
  };

  const handleSelectFeatured = (hotelId: number) => {
    setHotelLoading(true);
    getHotelById(hotelId).then((hotel) => {
      if (hotel) {
        setSelectedHotel(hotel);
        setView(ViewState.BOOKING);
        window.scrollTo(0, 0);
      }
      setHotelLoading(false);
    });
  };

  const handleBackToHome = () => {
    setView(ViewState.HOME);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    setDashboardAllowed(null);
    setHeaderUser(null);
    setView(ViewState.HOME);
    window.scrollTo(0, 0);
  };

  // Usuario en header: sesión + perfil (foto y tipo para ir al dashboard)
  useEffect(() => {
    const updateHeaderUser = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, user_type')
        .eq('id', userId)
        .maybeSingle();
      const p = profile as { full_name?: string; user_type?: string } | null;
      const name = p?.full_name?.trim() || '';
      const userType = (p?.user_type as 'cliente' | 'partner' | 'admin') ?? 'cliente';
      const { data: { user } } = await supabase.auth.getUser();
      const avatarUrl = user?.user_metadata?.avatar_url
        || (name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2b7cee&color=fff` : 'https://ui-avatars.com/api/?name=Usuario&background=2b7cee&color=fff');
      setHeaderUser({ name: name || 'Usuario', avatarUrl, userType });
    };
    const { data: { listener } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        updateHeaderUser(session.user.id);
      } else {
        setHeaderUser(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) updateHeaderUser(session.user.id);
      else setHeaderUser(null);
    });
    return () => { listener?.unsubscribe(); };
  }, []);

  // Cerrar menú del header al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    if (headerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [headerMenuOpen]);

  // Detectar enlace de restablecimiento de contraseña (hash type=recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setView(ViewState.RESET_PASSWORD);
    }
  }, []);

  // Proteger dashboards: solo permitir acceso con sesión válida
  useEffect(() => {
    if (!DASHBOARD_VIEWS.includes(view)) {
      setDashboardAllowed(null);
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        setView(ViewState.LOGIN);
        setDashboardAllowed(null);
      } else {
        setDashboardAllowed(true);
      }
    });
    return () => { cancelled = true; };
  }, [view]);

  const handleLoginSuccess = (userType: 'cliente' | 'partner' | 'admin') => {
    if (userType === 'admin') {
      setView(ViewState.ADMIN_DASHBOARD);
    } else if (userType === 'partner') {
      setView(ViewState.PARTNER_DASHBOARD);
    } else if (userType === 'cliente') {
      setView(ViewState.CUSTOMER_DASHBOARD);
    } else {
      setView(ViewState.HOME);
    }
  };

  const handleLoginClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();
      const userType = (profile?.user_type as 'cliente' | 'partner' | 'admin') ?? 'cliente';
      handleLoginSuccess(userType);
    } else {
      setView(ViewState.LOGIN);
    }
  };

  // View Routing
  if (view === ViewState.LOGIN) {
      return (
          <Login 
            onBack={handleBackToHome} 
            onLoginSuccess={handleLoginSuccess}
            onRegisterClick={() => setView(ViewState.REGISTER)}
          />
      );
  }

  if (view === ViewState.REGISTER) {
      return (
        <Register 
            onBack={handleBackToHome}
            onLoginClick={() => setView(ViewState.LOGIN)}
            onRegisterSuccess={() => setView(ViewState.HOME)}
        />
      );
  }

  if (view === ViewState.RESET_PASSWORD) {
    return (
      <ResetPassword
        onSuccess={() => {
          window.history.replaceState(null, '', window.location.pathname);
          setView(ViewState.LOGIN);
        }}
        onBack={() => {
          window.history.replaceState(null, '', window.location.pathname);
          setView(ViewState.LOGIN);
        }}
      />
    );
  }

  if (view === ViewState.ADMIN_DASHBOARD) {
    if (dashboardAllowed !== true) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Verificando sesión...</p>
        </div>
      );
    }
    return (
      <AdminDashboard onLogout={handleLogout} />
    );
  }

  if (view === ViewState.PARTNER_DASHBOARD) {
    if (dashboardAllowed !== true) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Verificando sesión...</p>
        </div>
      );
    }
    return (
      <PartnerDashboard onLogout={handleLogout} />
    );
  }

  if (view === ViewState.CUSTOMER_DASHBOARD) {
    if (dashboardAllowed !== true) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Verificando sesión...</p>
        </div>
      );
    }
    return (
      <CustomerDashboard 
        onLogout={handleLogout} 
        onNewReservation={handleBackToHome} 
      />
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white transition-colors duration-200">
      
      {/* Header */}
      <header className="sticky top-0 z-50 flex flex-col border-b border-solid border-b-[#f0f2f4] bg-white/95 dark:bg-background-dark/95 backdrop-blur dark:border-b-gray-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between whitespace-nowrap px-6 lg:px-10 py-3">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleBackToHome}>
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Handle */}
                <path d="M35 30 V22 C35 18 38 15 42 15 H58 C62 15 65 18 65 22 V30" stroke="#2b7cee" strokeWidth="6" strokeLinecap="round" />
                {/* Body */}
                <rect x="20" y="30" width="60" height="50" rx="8" stroke="#2b7cee" strokeWidth="6" />
                <line x1="32" y1="30" x2="32" y2="80" stroke="#2b7cee" strokeWidth="6" />
                {/* Wheels */}
                <path d="M30 80 V88" stroke="#2b7cee" strokeWidth="6" strokeLinecap="round" />
                <path d="M70 80 V88" stroke="#2b7cee" strokeWidth="6" strokeLinecap="round" />
                {/* Click Waves */}
                <path d="M55 45 A 10 10 0 0 1 65 55" stroke="#86efac" strokeWidth="4" strokeLinecap="round" />
                <path d="M60 40 A 18 18 0 0 1 75 55" stroke="#86efac" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
                {/* Cursor */}
                <path d="M55 60 L72 75 L62 77 L66 86 L61 88 L57 79 L50 82 Z" fill="#86efac" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-[#a8d8b7] tracking-tight">escapar.mx</span>
        </div>
        <div className="flex flex-1 justify-end items-center gap-4 lg:gap-8">
          <nav className="hidden md:flex items-center gap-9">
            <a className="text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Ofertas</a>
            {!headerUser && (
              <button onClick={() => setView(ViewState.REGISTER)} className="text-sm font-medium leading-normal hover:text-primary transition-colors">Regístrate</button>
            )}
            {headerUser && (
              <span className="text-sm font-medium text-primary">
                Hola, {headerUser.name}
              </span>
            )}
          </nav>
          <div className="flex gap-2 items-center">
             {headerUser ? (
               <div className="relative" ref={headerMenuRef}>
                 <button
                   onClick={() => setHeaderMenuOpen((o) => !o)}
                   className="flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600"
                   title="Opciones de cuenta"
                   aria-expanded={headerMenuOpen}
                   aria-haspopup="true"
                 >
                   <img src={headerUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-primary/30" />
                   <span className="material-symbols-outlined text-gray-500 text-[20px] transition-transform duration-200" style={{ transform: headerMenuOpen ? 'rotate(180deg)' : undefined }}>
                     expand_more
                   </span>
                 </button>
                 {headerMenuOpen && (
                   <div className="absolute right-0 top-full mt-2 w-52 py-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                     <button
                       onClick={() => { setHeaderMenuOpen(false); handleLoginSuccess(headerUser.userType); }}
                       className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                     >
                       <span className="material-symbols-outlined text-[20px] text-primary">dashboard</span>
                       Ir al dashboard
                     </button>
                     <button
                       onClick={() => { setHeaderMenuOpen(false); handleLogout(); }}
                       className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                     >
                       <span className="material-symbols-outlined text-[20px]">logout</span>
                       Cerrar sesión
                     </button>
                   </div>
                 )}
               </div>
             ) : (
               <button
                 onClick={handleLoginClick}
                 className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
               >
                 <span className="material-symbols-outlined text-[20px]">account_circle</span>
                 <span>Iniciar Sesión</span>
               </button>
             )}
          </div>
        </div>
        </div>
        {/* Rutas / breadcrumb */}
        <div className="px-6 lg:px-10 pb-2 pt-0 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <span className="text-gray-400 dark:text-gray-500">Ruta:</span>
          {view === ViewState.HOME ? (
            <span className="font-medium text-gray-700 dark:text-gray-300">Inicio</span>
          ) : (
            <>
              <button type="button" onClick={handleBackToHome} className="hover:text-primary transition-colors">Inicio</button>
              <span aria-hidden>/</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{VIEW_BREADCRUMB_LABEL[view]}</span>
            </>
          )}
          <span className="ml-1 text-gray-400 dark:text-gray-500 font-mono text-xs" title="URL actual">
            {VIEW_TO_PATH[view]}
            {view === ViewState.BOOKING && selectedHotel ? `?hotel=${selectedHotel.id}` : ''}
          </span>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col">
        {view === ViewState.HOME && (
          <Home 
            onSearch={handleSearch} 
            onSelectFeatured={handleSelectFeatured} 
          />
        )}
        
        {view === ViewState.RESULTS && (
          <SearchResults 
            searchParams={searchParams} 
            onSelectHotel={handleSelectHotel} 
            onBack={handleBackToHome}
          />
        )}

        {view === ViewState.BOOKING && hotelLoading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-gray-500 dark:text-gray-400">Cargando hotel...</p>
          </div>
        )}

        {view === ViewState.BOOKING && !hotelLoading && !selectedHotel && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-600 dark:text-gray-400">Hotel no encontrado o enlace inválido.</p>
            <button type="button" onClick={handleBackToHome} className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-blue-600">
              Volver al inicio
            </button>
          </div>
        )}

        {view === ViewState.BOOKING && !hotelLoading && selectedHotel && (
          <BookingWizard 
            hotel={selectedHotel} 
            searchParams={searchParams}
            onBack={() => setView(ViewState.RESULTS)}
          />
        )}

        {view === ViewState.ABOUT_US && (
          <AboutUs />
        )}

        {view === ViewState.PRIVACY && (
          <PrivacyPolicy onViewTerms={() => { setView(ViewState.TERMS); window.scrollTo(0,0); }} />
        )}

        {view === ViewState.TERMS && (
          <TermsAndConditions />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#1a222d] border-t border-[#f0f2f4] dark:border-gray-800 pt-16 pb-8 px-10 mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4 max-w-xs">
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M35 30 V22 C35 18 38 15 42 15 H58 C62 15 65 18 65 22 V30" stroke="#2b7cee" strokeWidth="6" strokeLinecap="round" />
                            <rect x="20" y="30" width="60" height="50" rx="8" stroke="#2b7cee" strokeWidth="6" />
                            <line x1="32" y1="30" x2="32" y2="80" stroke="#2b7cee" strokeWidth="6" />
                            <path d="M30 80 V88" stroke="#2b7cee" strokeWidth="6" strokeLinecap="round" />
                            <path d="M70 80 V88" stroke="#2b7cee" strokeWidth="6" strokeLinecap="round" />
                            <path d="M55 45 A 10 10 0 0 1 65 55" stroke="#86efac" strokeWidth="4" strokeLinecap="round" />
                            <path d="M55 60 L72 75 L62 77 L66 86 L61 88 L57 79 L50 82 Z" fill="#86efac" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-[#a8d8b7] tracking-tight">escapar.mx</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Encuentra y reserva los mejores hoteles spa del mundo. Relajación, lujo y bienestar al alcance de un clic.
                </p>
            </div>
            <div className="flex gap-16 flex-wrap">
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold">Compañía</h4>
                    <button 
                        onClick={() => { setView(ViewState.ABOUT_US); window.scrollTo(0,0); }} 
                        className="text-sm text-gray-500 hover:text-primary text-left"
                    >
                        Sobre nosotros
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold">Soporte</h4>
                    <a className="text-sm text-gray-500 hover:text-primary" href="#">Ayuda</a>
                    <button 
                        onClick={() => { setView(ViewState.PRIVACY); window.scrollTo(0,0); }}
                        className="text-sm text-gray-500 hover:text-primary text-left"
                    >
                        Privacidad
                    </button>
                </div>
            </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-400">© 2024 Escapar.mx. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;