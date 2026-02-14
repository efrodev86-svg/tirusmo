import React, { useState } from 'react';
import { AdminReservations } from './AdminReservations';
import { AdminReservationDetail } from './AdminReservationDetail';
import { AdminUsers } from './AdminUsers';
import { AdminUserDetail } from './AdminUserDetail';
import { AdminHotels } from './AdminHotels';
import { AdminHotelDetail } from './AdminHotelDetail';
import { AdminHotelEdit } from './AdminHotelEdit';
import { AdminRoomInventory } from './AdminRoomInventory';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'reservations' | 'users' | 'hotels' | 'reports';
type HotelViewState = 'list' | 'detail' | 'inventory' | 'edit' | 'create';

const DashboardHome = () => (
    <div className="animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Dashboard General</h1>
            <div className="flex items-center gap-4">
                <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px] filled">notifications</span>
                </button>
                <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>

        {/* KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* KPI 1 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ventas Totales</span>
                    <div className="text-3xl font-bold text-[#111827] mt-2 mb-2">$124,500</div>
                    <div className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        +12% <span className="text-gray-400 font-normal ml-1">vs mes anterior</span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined filled">payments</span>
                </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reservas Activas</span>
                    <div className="text-3xl font-bold text-[#111827] mt-2 mb-2">45</div>
                    <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        +5% <span className="text-gray-400 font-normal ml-1">ocupación actual</span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined filled">confirmation_number</span>
                </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nuevos Usuarios</span>
                    <div className="text-3xl font-bold text-[#111827] mt-2 mb-2">120</div>
                    <div className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        +8% <span className="text-gray-400 font-normal ml-1">esta semana</span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <span className="material-symbols-outlined filled">group_add</span>
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-lg">Ingresos Mensuales</h3>
                    <button className="text-sm font-bold text-primary hover:underline">Ver detalle</button>
                </div>
                <div className="h-48 flex items-end justify-between gap-4 px-4">
                     {[
                        {label: 'Ene', val: 40}, {label: 'Feb', val: 70}, {label: 'Mar', val: 50}, 
                        {label: 'Abr', val: 85}, {label: 'May', val: 60}, {label: 'Jun', val: 95}
                     ].map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                             <div 
                                className="w-full max-w-[40px] bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600"
                                style={{height: `${d.val}%`}}
                             ></div>
                             <span className="text-xs text-gray-500 font-medium">{d.label}</span>
                        </div>
                     ))}
                </div>
            </div>

            {/* Progress Bars */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Estado de Reservas</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                </div>
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span className="text-gray-600">Confirmada</span>
                            <span className="font-bold">65%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '65%'}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span className="text-gray-600">Pendiente</span>
                            <span className="font-bold">20%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{width: '20%'}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span className="text-gray-600">Cancelada</span>
                            <span className="font-bold">5%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: '5%'}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span className="text-gray-600">Completada (Checkout)</span>
                            <span className="font-bold">10%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: '10%'}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Reservations Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Reservaciones Recientes</h3>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">
                            <span className="material-symbols-outlined text-[16px]">filter_list</span> Filtros
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-600">
                            <span className="material-symbols-outlined text-[16px]">add</span> Nueva Reserva
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                                <th className="py-3 pl-2">Huesped</th>
                                <th className="py-3">Hotel</th>
                                <th className="py-3">Fechas</th>
                                <th className="py-3">Monto</th>
                                <th className="py-3 text-right pr-2">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <img src="https://ui-avatars.com/api/?name=Alejandro+M&background=random" className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-bold text-[#111827]">Alejandro M.</p>
                                            <p className="text-xs text-gray-400">ID: #9283</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-gray-600">Grand SPA Resort</td>
                                <td className="py-4 text-gray-600">24 Oct - 28 Oct</td>
                                <td className="py-4 font-bold text-[#111827]">$1,240</td>
                                <td className="py-4 text-right pr-2">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Confirmada</span>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <img src="https://ui-avatars.com/api/?name=Sofia+L&background=random" className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-bold text-[#111827]">Sofia L.</p>
                                            <p className="text-xs text-gray-400">ID: #9284</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-gray-600">Mountain Wellness</td>
                                <td className="py-4 text-gray-600">25 Oct - 27 Oct</td>
                                <td className="py-4 font-bold text-[#111827]">$850</td>
                                <td className="py-4 text-right pr-2">
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Pendiente</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <img src="https://ui-avatars.com/api/?name=Carlos+R&background=random" className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-bold text-[#111827]">Carlos R.</p>
                                            <p className="text-xs text-gray-400">ID: #9285</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-gray-600">Urban Oasis</td>
                                <td className="py-4 text-gray-600">26 Oct - 30 Oct</td>
                                <td className="py-4 font-bold text-[#111827]">$2,100</td>
                                <td className="py-4 text-right pr-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Check-in</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Featured Hotels */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1">
                 <h3 className="font-bold text-lg mb-6">Hoteles Destacados</h3>
                 <div className="flex flex-col gap-6">
                    <div className="flex gap-4 items-center">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAP3pLgh2y6TTH9MWzXMUWpr3UsqYEa5HnrYpKUF4HoNHzCaq1N-mtHns-GaRnq5zh0_UgKocBzYaXzlhuBF0Vi6jD-gwqlGyqZa70fwyGeU6rBVSfz-EY_yJBZx-yAbI15V8nhp_8ksTQaXq9pSuK5IH9McYauZMvLBnsG-IdH4dr8kKdBJWBiazXque5PAKY-_fYwVBe3pyX3XtZ_ka1dI0_cDMKVYRGCyYMyBEABqDM9wBM805itA_UYUhzJIk-jmBwEdal38Q" className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-[#111827] line-clamp-1">Grand SPA Resort</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <span className="material-symbols-outlined text-yellow-400 text-[14px] filled">star</span> 4.9 <span className="text-gray-400">(128 reviews)</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-gray-400 uppercase font-bold">Ocupación</div>
                             <div className="font-bold text-green-600">92%</div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=200&auto=format&fit=crop" className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-[#111827] line-clamp-1">Urban Oasis</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <span className="material-symbols-outlined text-yellow-400 text-[14px] filled">star</span> 4.7 <span className="text-gray-400">(85 reviews)</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-gray-400 uppercase font-bold">Ocupación</div>
                             <div className="font-bold text-blue-600">85%</div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <img src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=200&auto=format&fit=crop" className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-[#111827] line-clamp-1">Mountain Wellness</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <span className="material-symbols-outlined text-yellow-400 text-[14px] filled">star</span> 4.5 <span className="text-gray-400">(42 reviews)</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-gray-400 uppercase font-bold">Ocupación</div>
                             <div className="font-bold text-orange-500">68%</div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
);


export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Reservation State
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  // User State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);

  // Hotel State & View
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [hotelViewState, setHotelViewState] = useState<HotelViewState>('list');
  const [hotelsRefreshKey, setHotelsRefreshKey] = useState(0);

  const handleManageHotelRooms = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setHotelViewState('inventory');
  };

  const handleSelectReservation = (id: string) => {
    setSelectedReservationId(id);
  };

  const handleEditUser = (id: string) => {
    setSelectedUserId(id);
  };

  const handleSelectHotel = (id: string) => {
    setSelectedHotelId(id);
    setHotelViewState('detail');
  };

  // Reset selected items when changing tabs
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSelectedReservationId(null);
    setSelectedUserId(null);
    setSelectedHotelId(null);
    setHotelViewState('list');
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard':
            return <DashboardHome />;
        case 'reservations':
            if (selectedReservationId) {
                return <AdminReservationDetail reservationId={selectedReservationId} onBack={() => setSelectedReservationId(null)} />;
            }
            return <AdminReservations onSelectReservation={handleSelectReservation} />;
        case 'users':
            if (selectedUserId) {
                return (
                  <AdminUserDetail
                    userId={selectedUserId}
                    onBack={() => setSelectedUserId(null)}
                    onDeleted={() => { setUsersRefreshKey((k) => k + 1); setSelectedUserId(null); }}
                  />
                );
            }
            return <AdminUsers onEditUser={handleEditUser} refreshKey={usersRefreshKey} />;
        case 'hotels':
            if (hotelViewState === 'inventory' && selectedHotelId) {
                return <AdminRoomInventory hotelId={selectedHotelId} onBack={() => setHotelViewState('detail')} />;
            }
            if (hotelViewState === 'edit' && selectedHotelId) {
                return <AdminHotelEdit hotelId={selectedHotelId} onBack={() => setHotelViewState('detail')} />;
            }
            if (hotelViewState === 'create') {
                return (
                    <AdminHotelEdit
                        hotelId={null}
                        onBack={() => setHotelViewState('list')}
                        onSuccess={() => { setHotelViewState('list'); setHotelsRefreshKey((k) => k + 1); }}
                    />
                );
            }
            if (hotelViewState === 'detail' && selectedHotelId) {
                return (
                    <AdminHotelDetail 
                        hotelId={selectedHotelId} 
                        onBack={() => { setSelectedHotelId(null); setHotelViewState('list'); setHotelsRefreshKey((k) => k + 1); }} 
                        onManageRooms={() => setHotelViewState('inventory')}
                        onEditHotel={() => setHotelViewState('edit')}
                    />
                );
            }
            return <AdminHotels onSelectHotel={handleSelectHotel} onManageRooms={handleManageHotelRooms} onNavigateToCreate={() => setHotelViewState('create')} refreshKey={hotelsRefreshKey} />;
        case 'reports':
            return <div className="p-8 text-center text-gray-500">Reportes y Analíticas (Próximamente)</div>;
        default:
            return <DashboardHome />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-display text-[#111827]">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-20 transition-all">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
             <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">SPA Admin</span>
              <span className="text-[10px] text-gray-400 font-medium">Admin General</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-[#f9fafb] hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Dashboard
          </button>
          
          <button 
            onClick={() => handleTabChange('reservations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'reservations' ? 'bg-primary text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-[#f9fafb] hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            Reservaciones
          </button>

          <button 
            onClick={() => handleTabChange('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-[#f9fafb] hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            Usuarios
          </button>

          <button 
            onClick={() => handleTabChange('hotels')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'hotels' ? 'bg-primary text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-[#f9fafb] hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">hotel</span>
            Hoteles
          </button>

          <button 
            onClick={() => handleTabChange('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'reports' ? 'bg-primary text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-[#f9fafb] hover:text-[#111827]'}`}
          >
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            Reportes
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg font-medium text-sm w-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
};