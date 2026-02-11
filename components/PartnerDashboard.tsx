import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PartnerRoomInventory } from './PartnerRoomInventory';
import { PartnerRoomDetail } from './PartnerRoomDetail';
import { PartnerBlocks } from './PartnerBlocks';
import { PartnerReservations } from './PartnerReservations';
import { PartnerReservationDetail } from './PartnerReservationDetail';
import { PartnerCalendar } from './PartnerCalendar';
import { PartnerBlockManager } from './PartnerBlockManager';

interface PartnerDashboardProps {
  onLogout: () => void;
}

type PartnerTab = 'dashboard' | 'rooms' | 'reservations' | 'blocks' | 'calendar' | 'pricing';
type RoomViewState = 'list' | 'detail';
type ReservationViewState = 'list' | 'detail';
type BlockViewState = 'list' | 'create';

type PartnerHotel = { id: number; name: string; location: string; image: string | null } | null;

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<PartnerTab>('dashboard');
  const [partnerHotel, setPartnerHotel] = useState<PartnerHotel>(null);
  const [partnerName, setPartnerName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) {
        setLoadingHotel(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).maybeSingle();
      if (profile && !cancelled) setPartnerName(profile.full_name || '');
      const { data: hotel } = await supabase.from('hotels').select('id, name, location, image').eq('partner_id', session.user.id).maybeSingle();
      if (!cancelled) {
        setPartnerHotel(hotel ? { id: hotel.id, name: hotel.name, location: hotel.location, image: hotel.image } : null);
      }
      setLoadingHotel(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Rooms State
  const [roomViewState, setRoomViewState] = useState<RoomViewState>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // Reservations State
  const [reservationViewState, setReservationViewState] = useState<ReservationViewState>('list');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  // Blocks State
  const [blockViewState, setBlockViewState] = useState<BlockViewState>('list');


  const handleCreateRoom = () => {
    setSelectedRoomId(null);
    setRoomViewState('detail');
  };

  const handleEditRoom = (id: number) => {
    setSelectedRoomId(id);
    setRoomViewState('detail');
  };

  const handleBackToInventory = () => {
    setRoomViewState('list');
    setSelectedRoomId(null);
  };

  const handleSelectReservation = (id: string) => {
    setSelectedReservationId(id);
    setReservationViewState('detail');
  };

  const handleBackToReservations = () => {
    setReservationViewState('list');
    setSelectedReservationId(null);
  };

  const handleCreateBlock = () => {
      setBlockViewState('create');
  };

  const handleBackToBlocks = () => {
      setBlockViewState('list');
  };

  const handleTabChange = (tab: PartnerTab) => {
      setActiveTab(tab);
      // Reset nested states when changing main tabs
      setRoomViewState('list');
      setSelectedRoomId(null);
      setReservationViewState('list');
      setSelectedReservationId(null);
      setBlockViewState('list');
  };

  const DashboardContent = () => (
    <>
        {/* Top Header */}
        <header className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold text-[#111827]">{partnerHotel ? `Panel de Gestión · ${partnerHotel.name}` : 'Panel de Gestión'}</h1>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    24 Octubre, 2023
                </div>
                <button className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors relative shadow-sm">
                    <span className="material-symbols-outlined text-[20px] filled">notifications</span>
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-200 cursor-pointer">
                    <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* KPI 1 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-[160px]">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OCUPACIÓN DE HOY</span>
                        <div className="text-4xl font-bold text-[#111827] mt-3">85%</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined filled">star</span>
                    </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-[160px]">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RESERVACIONES POR LLEGAR</span>
                        <div className="text-4xl font-bold text-[#111827] mt-3">12</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                        <span className="material-symbols-outlined filled">work</span>
                    </div>
                </div>
                <p className="text-xs text-gray-400 font-medium">Próximos check-ins programados para hoy</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-[160px]">
                 <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">INGRESOS DEL MES</span>
                        <div className="text-4xl font-bold text-[#111827] mt-3">$24,850.00</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                        <span className="material-symbols-outlined filled">attach_money</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +14.2% <span className="text-gray-400 font-medium ml-1">vs mes anterior</span>
                </div>
            </div>
        </div>

        {/* Middle Section: Chart & Arrivals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-1 h-[380px] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-lg text-[#111827]">Ocupación Semanal</h3>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">OCT 18–24</span>
                </div>
                <div className="flex-1 flex items-end justify-between gap-3 px-2">
                     {[
                        {d: 'L', v: 45}, {d: 'M', v: 60}, {d: 'X', v: 55}, {d: 'J', v: 75}, 
                        {d: 'V', v: 85}, {d: 'S', v: 95}, {d: 'D', v: 70}
                     ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group cursor-pointer">
                            <div 
                                className="w-full bg-[#1E3A8A] rounded-t-sm transition-all duration-500 group-hover:opacity-80 relative"
                                style={{height: `${item.v}%`}}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {item.v}% Ocupado
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{item.d}</span>
                        </div>
                     ))}
                </div>
            </div>

            {/* Arrivals List */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2 h-[380px] flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[#111827]">Llegadas de Hoy</h3>
                    <button className="text-sm font-bold text-blue-600 hover:underline">Ver todas</button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                                <th className="py-3 pl-2">HUÉSPED</th>
                                <th className="py-3">TIPO HABITACIÓN</th>
                                <th className="py-3">ESTADO ESTANCIA</th>
                                <th className="py-3 text-right">ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[
                                { name: "Alejandro Marín", id: "#AH-2091", room: "Doble Superior", status: "Preparando Estancia", color: "bg-orange-50 text-orange-600", img: "https://ui-avatars.com/api/?name=Alejandro+Marin&background=random" },
                                { name: "Sofía Luna", id: "#AH-2092", room: "Junior Suite", status: "Check-in Iniciado", color: "bg-blue-50 text-blue-600", img: "https://ui-avatars.com/api/?name=Sofia+Luna&background=random" },
                                { name: "Carlos Ruiz", id: "#AH-2095", room: "Estandar", status: "Pendiente de Llegada", color: "bg-gray-100 text-gray-500", img: "https://ui-avatars.com/api/?name=Carlos+Ruiz&background=random" },
                                { name: "Lucía Méndez", id: "#AH-2098", room: "Suite Presidencial", status: "Listo", color: "bg-green-50 text-green-600", img: "https://ui-avatars.com/api/?name=Lucia+Mendez&background=random" },
                            ].map((guest, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 pl-2">
                                        <div className="flex items-center gap-3">
                                            <img src={guest.img} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-bold text-[#111827] text-sm">{guest.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">Reserva {guest.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-gray-600 text-sm">{guest.room}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${guest.color}`}>
                                            {guest.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button className="text-blue-600 text-xs font-bold hover:underline">Gestionar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Quick Actions */}
        <div>
            <h3 className="font-bold text-lg text-[#111827] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[24px] filled">bolt</span>
                Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { icon: "sync_alt", title: "Actualizar Disponibilidad", desc: "Modificar inventario" },
                    { icon: "sell", title: "Cambiar Precios", desc: "Tarifas y promociones" },
                    { icon: "notifications_active", title: "Emitir Alerta", desc: "Aviso a huéspedes" },
                    { icon: "download", title: "Cierre del Día", desc: "Generar reporte diario" }
                ].map((action, i) => (
                    <button key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-center flex flex-col items-center justify-center group h-[160px]">
                        <span className="material-symbols-outlined text-gray-400 text-3xl mb-3 group-hover:text-blue-600 transition-colors">{action.icon}</span>
                        <h4 className="font-bold text-sm text-[#111827] mb-1">{action.title}</h4>
                        <p className="text-xs text-gray-400">{action.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    </>
  );

  const renderContent = () => {
      switch (activeTab) {
          case 'dashboard':
              return <DashboardContent />;
          case 'rooms':
              if (roomViewState === 'detail') {
                  return <PartnerRoomDetail roomId={selectedRoomId} onBack={handleBackToInventory} />;
              }
              return <PartnerRoomInventory onCreateRoom={handleCreateRoom} onEditRoom={handleEditRoom} />;
          case 'reservations':
              if (reservationViewState === 'detail' && selectedReservationId) {
                  return <PartnerReservationDetail reservationId={selectedReservationId} onBack={handleBackToReservations} />
              }
              return <PartnerReservations onSelectReservation={handleSelectReservation} />;
          case 'blocks':
              if (blockViewState === 'create') {
                  return <PartnerBlockManager onBack={handleBackToBlocks} onConfirm={() => { alert('Bloqueo creado'); handleBackToBlocks(); }} />;
              }
              return <PartnerBlocks onCreateBlock={handleCreateBlock} />;
          case 'calendar':
              return <PartnerCalendar />;
          default:
              return <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-4xl mb-4">construction</span>
                  <p className="text-lg font-medium">Este módulo está en construcción</p>
              </div>;
      }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-display text-[#111827]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-20 transition-all shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#10B981]/20 flex items-center justify-center">
             <span className="material-symbols-outlined text-[#10B981] text-2xl">hotel</span>
          </div>
          <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm leading-tight truncate">{partnerHotel?.name || 'Partner Portal'}</span>
              <span className="text-[10px] text-gray-400 font-medium">{partnerHotel ? partnerHotel.location : (loadingHotel ? 'Cargando...' : 'Sin hotel asignado')}</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Dashboard
          </button>
          
          <button 
            onClick={() => handleTabChange('rooms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'rooms' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">king_bed</span>
            Habitaciones
          </button>

          <button 
            onClick={() => handleTabChange('reservations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'reservations' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            Reservaciones
          </button>

          <button 
            onClick={() => handleTabChange('blocks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'blocks' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">block</span>
            Bloqueos
          </button>

          <button 
            onClick={() => handleTabChange('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'calendar' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">event_note</span>
            Calendario
          </button>

           <button 
            onClick={() => handleTabChange('pricing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'pricing' ? 'bg-[#EFF6FF] text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">sell</span>
            Tarifas
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg font-medium text-sm w-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-x-hidden min-h-screen">
        {!loadingHotel && !partnerHotel && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            No tienes un hotel asignado. Contacta al administrador para que vincule tu cuenta a un hotel.
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};