import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [dashboardAllowed, setDashboardAllowed] = useState<boolean | null>(null);
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

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setView(ViewState.RESULTS);
  };

  const handleSelectHotel = (hotelId: number) => {
    const hotel = getHotelById(hotelId);
    if (hotel) {
      setSelectedHotel(hotel);
      setView(ViewState.BOOKING);
      window.scrollTo(0, 0);
    }
  };

  const handleBackToHome = () => {
    setView(ViewState.HOME);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    setDashboardAllowed(null);
    setView(ViewState.HOME);
    window.scrollTo(0, 0);
  };

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
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] bg-white/95 dark:bg-background-dark/95 backdrop-blur px-6 lg:px-10 py-3 dark:border-b-gray-800 transition-colors shadow-sm">
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
            <button onClick={() => setView(ViewState.REGISTER)} className="text-sm font-medium leading-normal hover:text-primary transition-colors">Regístrate</button>
          </nav>
          <div className="flex gap-2 items-center">
             <button 
                onClick={handleLoginClick}
                className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
             >
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
                <span>Iniciar Sesión</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col">
        {view === ViewState.HOME && (
          <Home 
            onSearch={handleSearch} 
            onSelectFeatured={handleSelectHotel} 
          />
        )}
        
        {view === ViewState.RESULTS && (
          <SearchResults 
            searchParams={searchParams} 
            onSelectHotel={handleSelectHotel} 
            onBack={handleBackToHome}
          />
        )}

        {view === ViewState.BOOKING && selectedHotel && (
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