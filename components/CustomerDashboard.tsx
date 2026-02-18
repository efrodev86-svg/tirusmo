import React, { useState, useEffect } from 'react';
import { CustomerStayTracking } from './CustomerStayTracking';
import { CustomerCheckout } from './CustomerCheckout';
import { CustomerProfile } from './CustomerProfile';
import { supabase } from '../lib/supabase';

interface CustomerDashboardProps {
  onLogout: () => void;
  onNewReservation: () => void;
}

type TabState = 'active' | 'past' | 'cancelled';
type ViewState = 'list' | 'tracking' | 'checkout' | 'profile';

interface UserProfile {
  full_name: string | null;
  email: string;
}

interface UserReservationCard {
  id: string;
  hotelName: string;
  dates: string;
  details: string;
  mealPlan: string;
  paymentMethod: string;
  total: string;
  status: string;
  statusRaw: string;
  image: string;
}

function getPaymentMethodLabel(method: string | undefined): string {
  if (!method) return '—';
  const labels: Record<string, string> = {
    card: 'Tarjeta de crédito o débito',
    paypal: 'PayPal',
    openpay: 'Open Pay',
    stripe: 'Stripe',
    transfer: 'Transferencia o depósito bancario',
  };
  return labels[method] || method;
}

function formatDateRange(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return '—';
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return `${d1.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${d2.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onLogout, onNewReservation }) => {
  const [activeTab, setActiveTab] = useState<TabState>('active');
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reservations, setReservations] = useState<UserReservationCard[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data: row } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
      if (!cancelled) {
        setUserProfile({
          full_name: row?.full_name ?? null,
          email: row?.email ?? user.email ?? '',
        });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadReservations() {
      setReservationsLoading(true);
      setReservationsError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) {
        setReservationsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('reservations')
        .select('id, check_in, check_out, total, status, guests, data, hotels(name, image), rooms(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        setReservationsError(error.message || 'Error al cargar reservas');
        setReservations([]);
        setReservationsLoading(false);
        return;
      }
      const list = (data || []) as Record<string, unknown>[];
      const mealPlanLabel = (plan: string | undefined) => {
        if (plan === 'desayuno') return 'Desayuno';
        if (plan === 'todo_incluido') return 'Todo incluido';
        if (plan === 'sin_plan') return 'Sin plan de alimentos';
        return plan ? String(plan) : '—';
      };
      const cards: UserReservationCard[] = list.map((r) => {
        const hotel = r.hotels as { name?: string; image?: string } | null;
        const room = r.rooms as { name?: string } | null;
        const reservationData = (r.data as { meal_plan?: string; payment_method?: string } | null) || {};
        const checkIn = String(r.check_in ?? '');
        const checkOut = String(r.check_out ?? '');
        const guests = Number(r.guests ?? 1);
        const hotelName = hotel?.name || room?.name || 'Hotel';
        const details = `${guests} adulto(s) • ${room?.name || 'Habitación'}`;
        const statusLabel = r.status === 'PENDIENTE' ? 'Pendiente' : r.status === 'CONFIRMADA' ? 'Confirmada' : r.status === 'CHECKOUT' ? 'Finalizada' : 'Cancelada';
        return {
          id: String(r.id),
          hotelName,
          dates: formatDateRange(checkIn || null, checkOut || null),
          details,
          mealPlan: mealPlanLabel(reservationData.meal_plan),
          paymentMethod: getPaymentMethodLabel(reservationData.payment_method),
          total: formatCurrency(Number(r.total ?? 0)),
          status: statusLabel,
          statusRaw: String(r.status || 'PENDIENTE'),
          image: hotel?.image || 'https://images.unsplash.com/photo-1566073771259-6a0e4e6c97a0?w=600',
        };
      });
      setReservations(cards);
      setReservationsLoading(false);
    }
    loadReservations();
    return () => { cancelled = true; };
  }, []);

  const handleViewTracking = (id: string) => {
      setSelectedTrackingId(id);
      setViewState('tracking');
      window.scrollTo(0, 0);
  };

  const handleViewCheckout = () => {
      setViewState('checkout');
      window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
      setViewState('list');
      setSelectedTrackingId(null);
      window.scrollTo(0, 0);
  };

  const handleBackToTracking = () => {
      setViewState('tracking');
      window.scrollTo(0, 0);
  };

  const handleViewProfile = () => {
      setViewState('profile');
      window.scrollTo(0, 0);
  };

  const filteredReservations = (() => {
    if (activeTab === 'active') return reservations.filter((r) => r.statusRaw === 'PENDIENTE' || r.statusRaw === 'CONFIRMADA');
    if (activeTab === 'past') return reservations.filter((r) => r.statusRaw === 'CHECKOUT');
    return reservations.filter((r) => r.statusRaw === 'CANCELADA');
  })();

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-20 transition-all">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[24px]">spa</span>
        </div>
        <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">Spa & Hotel</span>
            <span className="text-[10px] text-gray-400 font-medium">Panel de Cliente</span>
        </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
        <button 
            onClick={handleBackToList}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${viewState === 'list' || viewState === 'tracking' || viewState === 'checkout' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-[#f9fafb] hover:text-[#111827]'}`}
        >
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            Mis Reservas
        </button>
        <button 
            onClick={handleViewProfile}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${viewState === 'profile' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-[#f9fafb] hover:text-[#111827]'}`}
        >
            <span className="material-symbols-outlined text-[20px]">person</span>
            Mi Perfil
        </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-6 px-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || userProfile?.email || 'Usuario')}&background=3B82F6&color=fff&size=80`}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111827] truncate">{userProfile?.full_name || 'Usuario'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{userProfile?.email || '—'}</p>
                </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#111827] rounded-lg font-medium text-sm w-full transition-colors border border-gray-200 hover:bg-gray-50">
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Cerrar Sesión
            </button>
        </div>
    </aside>
  );

  if (viewState === 'profile') {
      return (
        <div className="flex min-h-screen bg-[#F8F9FA] font-display text-[#111827]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 lg:px-12 lg:py-10">
                <div className="max-w-6xl mx-auto">
                    <CustomerProfile />
                </div>
            </main>
        </div>
      );
  }

  if (viewState === 'checkout') {
      return (
        <div className="flex min-h-screen bg-[#F8F9FA] font-display text-[#111827]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 lg:px-12 lg:py-10">
                <div className="max-w-6xl mx-auto">
                    <CustomerCheckout onBack={handleBackToTracking} />
                </div>
            </main>
        </div>
      );
  }

  if (viewState === 'tracking' && selectedTrackingId) {
      return (
        <div className="flex min-h-screen bg-[#F8F9FA] font-display text-[#111827]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 lg:px-12 lg:py-10">
                <div className="max-w-6xl mx-auto">
                    <CustomerStayTracking 
                        reservationId={selectedTrackingId} 
                        onBack={handleBackToList} 
                        onBilling={handleViewCheckout}
                    />
                </div>
            </main>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-display text-[#111827]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:px-12 lg:py-10">
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#111827] mb-2">Mis Reservas</h1>
                    <p className="text-gray-500 text-sm">Gestiona tus estancias actuales, pasadas y futuras.</p>
                </div>
                <button 
                    onClick={onNewReservation}
                    className="bg-[#3B82F6] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Nueva Reserva
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 mb-8">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'active' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <span className={`material-symbols-outlined text-[20px] ${activeTab === 'active' ? 'filled' : ''}`}>check_circle</span>
                    Activas
                </button>
                <button 
                    onClick={() => setActiveTab('past')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'past' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    Pasadas
                </button>
                <button 
                    onClick={() => setActiveTab('cancelled')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'cancelled' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    Canceladas
                </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-6">
                {reservationsLoading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 animate-pulse">hourglass_empty</span>
                        <p className="text-gray-500 mt-2">Cargando tus reservas…</p>
                    </div>
                ) : reservationsError ? (
                    <div className="bg-white rounded-2xl border border-red-100 p-6 text-red-600">
                        <p className="font-medium">{reservationsError}</p>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300">event_busy</span>
                        <p className="text-gray-500 mt-2">
                            {activeTab === 'active' && 'No tienes reservas activas.'}
                            {activeTab === 'past' && 'No tienes reservas pasadas.'}
                            {activeTab === 'cancelled' && 'No tienes reservas canceladas.'}
                        </p>
                        {activeTab === 'active' && (
                            <button onClick={onNewReservation} className="mt-4 text-[#3B82F6] font-semibold text-sm hover:underline">
                                Hacer una reserva
                            </button>
                        )}
                    </div>
                ) : (
                    filteredReservations.map((res) => (
                        <div key={res.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                            <div className="w-full md:w-[320px] h-[220px] md:h-auto relative shrink-0">
                                <img src={res.image} className="w-full h-full object-cover" alt={res.hotelName} />
                            </div>
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                                                res.statusRaw === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                                                res.statusRaw === 'CHECKOUT' ? 'bg-gray-100 text-gray-700' :
                                                res.statusRaw === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {res.status}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">Ref: #{res.id.slice(0, 8)}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#111827] mb-1">{res.hotelName}</h3>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                            {res.dates}
                                            <span className="text-gray-300">|</span>
                                            {res.details}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <span className="material-symbols-outlined text-[16px]">restaurant</span>
                                            <span>Plan de alimentos: {res.mealPlan}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <span className="material-symbols-outlined text-[16px]">payments</span>
                                            <span>Método de pago: {res.paymentMethod}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">TOTAL</p>
                                        <p className="text-xl font-bold text-[#111827]">{res.total}</p>
                                    </div>
                                </div>
                                {(res.statusRaw === 'PENDIENTE' || res.statusRaw === 'CONFIRMADA') && (
                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleViewTracking(res.id)}
                                            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#3B82F6] text-white hover:bg-blue-700 shadow-md shadow-blue-100 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                            Ver seguimiento
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Loyalty Banner */}
            <div className="mt-10 bg-[#EFF6FF] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#DBEAFE]">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#3B82F6]">
                        <span className="material-symbols-outlined text-4xl filled">loyalty</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#111827]">¡Estás a solo 2 estancias de Platinum!</h3>
                        <p className="text-sm text-gray-500">Disfruta de upgrades gratuitos y acceso al VIP Lounge en tu próxima visita.</p>
                    </div>
                </div>
                <button className="bg-[#3B82F6] hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md shadow-blue-200 transition-colors whitespace-nowrap">
                    Ver Beneficios
                </button>
            </div>

        </div>
      </main>
    </div>
  );
};