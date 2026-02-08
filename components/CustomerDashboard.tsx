import React, { useState } from 'react';
import { CustomerStayTracking } from './CustomerStayTracking';
import { CustomerCheckout } from './CustomerCheckout';
import { CustomerProfile } from './CustomerProfile';

interface CustomerDashboardProps {
  onLogout: () => void;
  onNewReservation: () => void;
}

type TabState = 'active' | 'past' | 'cancelled';
type ViewState = 'list' | 'tracking' | 'checkout' | 'profile';

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onLogout, onNewReservation }) => {
  const [activeTab, setActiveTab] = useState<TabState>('active');
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);

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

  const reservations = [
    {
      id: "SH-9921",
      hotelName: "Royal Garden Spa & Resort",
      dates: "15 Nov - 20 Nov, 2023",
      details: "2 Adultos • Hab. Deluxe",
      total: "$1,250.00",
      status: "EN ESTANCIA",
      progress: 65, // Percentage
      progressLabel: "Etapa: Estancia - Día 3 de 5",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1ZNXVStktOZCO_PP_dagtfcrFa68yllscTGsfwRIzdrs2nif74E3NrR2D9Ku-rbPCCSCJJxxQkT2KPSrIKnfGQ69Y_SdVL9tZ_RfN8oDQAhM-aNomuw0UcjWEdv3tRQIqGkv8v8NTSZjnKAvvADiPhUOm_XjHzLf8zV7GO9OsBzaIdez-qXUZO7wSHJzBozNYH0fkZqIuoAih4YZWXescIyEVUJpUwKUAe0aXrfGSns6mG4yot10pKoCPs_bFL9VG9W1LtUHEA",
      actions: ["Ver Seguimiento", "Ver Detalles", "Solicitud Especial"]
    },
    {
      id: "SH-4412",
      hotelName: "Ocean Breeze Resort & Spa",
      dates: "12 Dic - 15 Dic, 2023",
      details: "1 Adulto • Suite Jr.",
      total: "$840.00",
      status: "CONFIRMADA",
      progress: 25,
      progressLabel: "Etapa: Reserva Confirmada",
      image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=600&auto=format&fit=crop",
      actions: ["Ver Detalles", "Solicitud Especial", "Cancelar Reserva"]
    }
  ];

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
                <img src="https://ui-avatars.com/api/?name=Alex+Rivera&background=random" className="w-10 h-10 rounded-full" />
                <div>
                    <p className="text-sm font-bold text-[#111827]">Alex Rivera</p>
                    <p className="text-[10px] text-gray-500">Membresía Gold</p>
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
                {activeTab === 'active' && reservations.map((res) => (
                    <div key={res.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="w-full md:w-[320px] h-[220px] md:h-auto relative shrink-0">
                            <img src={res.image} className="w-full h-full object-cover" alt={res.hotelName} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            
                            {/* Top Row */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${res.status === 'EN ESTANCIA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {res.status}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">Ref: #{res.id}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#111827] mb-1">{res.hotelName}</h3>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                        {res.dates}
                                        <span className="text-gray-300">|</span>
                                        {res.details}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">TOTAL</p>
                                    <p className="text-xl font-bold text-[#111827]">{res.total}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-[#111827]">{res.status === 'EN ESTANCIA' ? 'Tu viaje actual' : 'Progreso de Estancia'}</span>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{res.progressLabel}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 relative">
                                    <div className="bg-[#3B82F6] h-2 rounded-full relative z-10" style={{width: `${res.progress}%`}}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    <span>RESERVA</span>
                                    <span>PRE-CHECKIN</span>
                                    <span className={res.progress > 50 ? 'text-blue-600' : ''}>ESTANCIA</span>
                                    <span>CHECKOUT</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                {res.actions.map((action, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => action === 'Ver Seguimiento' ? handleViewTracking(res.id) : null}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 
                                            ${action === 'Ver Seguimiento' ? 'bg-[#3B82F6] text-white hover:bg-blue-700 shadow-md shadow-blue-100' : 
                                              action === 'Cancelar Reserva' ? 'bg-white text-red-500 hover:bg-red-50 border border-red-100' :
                                              'bg-gray-100 text-[#111827] hover:bg-gray-200'}`}
                                    >
                                        {action === 'Ver Seguimiento' && <span className="material-symbols-outlined text-[16px]">visibility</span>}
                                        {action === 'Ver Detalles' && <span className="material-symbols-outlined text-[16px] filled">info</span>}
                                        {action === 'Solicitud Especial' && <span className="material-symbols-outlined text-[16px]">room_service</span>}
                                        {action}
                                    </button>
                                ))}
                            </div>

                        </div>
                    </div>
                ))}
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