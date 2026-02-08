import React from 'react';

interface AdminHotelsProps {
  onSelectHotel?: (id: string) => void;
}

export const AdminHotels: React.FC<AdminHotelsProps> = ({ onSelectHotel }) => {
  // Mock Data
  const hotels = [
    {
      id: "HOT-001",
      name: "Grand SPA Resort",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP3pLgh2y6TTH9MWzXMUWpr3UsqYEa5HnrYpKUF4HoNHzCaq1N-mtHns-GaRnq5zh0_UgKocBzYaXzlhuBF0Vi6jD-gwqlGyqZa70fwyGeU6rBVSfz-EY_yJBZx-yAbI15V8nhp_8ksTQaXq9pSuK5IH9McYauZMvLBnsG-IdH4dr8kKdBJWBiazXque5PAKY-_fYwVBe3pyX3XtZ_ka1dI0_cDMKVYRGCyYMyBEABqDM9wBM805itA_UYUhzJIk-jmBwEdal38Q",
      owner: "Carlos Méndez",
      ownerRole: "Partner Premium",
      location: "Cancún, México",
      rooms: 124,
      status: "Activo"
    },
    {
      id: "HOT-002",
      name: "Urban Oasis Hotel",
      img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=200&auto=format&fit=crop",
      owner: "Elena Rodríguez",
      ownerRole: "Partner Regional",
      location: "Madrid, España",
      rooms: 85,
      status: "Activo"
    },
    {
      id: "HOT-003",
      name: "Mountain Wellness",
      img: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=200&auto=format&fit=crop",
      owner: "Julian Casares",
      ownerRole: "Partner Silver",
      location: "Bariloche, Argentina",
      rooms: 42,
      status: "Inactivo"
    },
    {
      id: "HOT-004",
      name: "Sunset Suites",
      img: "https://ui-avatars.com/api/?name=Sunset+Suites&background=random",
      owner: "Grupo Inmobiliario XYZ",
      ownerRole: "Partner Corporativo",
      location: "Miami, USA",
      rooms: 210,
      status: "Activo"
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-[#111827]">Administración de Hoteles</h1>
            <div className="flex items-center gap-4 w-full md:w-auto">
                 {/* Search Bar */}
                <div className="relative flex-1 md:w-80">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar hotel o partner..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-600" 
                    />
                </div>
                <button className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors relative shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[22px] filled">notifications</span>
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-200 shrink-0">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    Filtros
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                    Todos los Estados
                    <span className="material-symbols-outlined text-[20px] text-gray-400">expand_more</span>
                </button>
            </div>
            <button className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Registrar Hotel
            </button>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/30">
                            <th className="py-4 pl-6">Hotel</th>
                            <th className="py-4">Propietario</th>
                            <th className="py-4">Ubicación</th>
                            <th className="py-4 text-center">Habitaciones</th>
                            <th className="py-4 text-center">Estado</th>
                            <th className="py-4 text-center pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {hotels.map((hotel, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                <td className="py-4 pl-6">
                                    <div 
                                        className="flex items-center gap-3 min-w-[200px] cursor-pointer group/hotel"
                                        onClick={() => onSelectHotel && onSelectHotel(hotel.id)}
                                    >
                                        <img src={hotel.img} className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover/hotel:scale-105 transition-transform" />
                                        <div>
                                            <p className="font-bold text-[#111827] group-hover/hotel:text-primary transition-colors">{hotel.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">ID: #{hotel.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 min-w-[150px]">
                                    <p className="font-bold text-[#111827] text-sm">{hotel.owner}</p>
                                    <p className="text-xs text-gray-500">{hotel.ownerRole}</p>
                                </td>
                                <td className="py-4 text-gray-600 w-[150px]">{hotel.location}</td>
                                <td className="py-4 text-center font-bold text-[#111827]">{hotel.rooms}</td>
                                <td className="py-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${hotel.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {hotel.status}
                                    </span>
                                </td>
                                <td className="py-4 pr-6">
                                    <div className="flex justify-end items-center gap-3">
                                        <button 
                                            onClick={() => onSelectHotel && onSelectHotel(hotel.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">bed</span>
                                            <span className="hidden xl:inline">Gestionar Habitaciones</span>
                                        </button>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => onSelectHotel && onSelectHotel(hotel.id)}
                                                className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </button>
                                            <button 
                                                onClick={() => onSelectHotel && onSelectHotel(hotel.id)}
                                                className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-4 bg-gray-50/30">
                <span className="text-xs text-gray-400 font-medium">Mostrando 1-4 de 24 hoteles</span>
                <div className="flex gap-2">
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 rounded bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-200">1</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white text-gray-600 text-xs font-medium flex items-center justify-center hover:bg-gray-50">2</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white text-gray-600 text-xs font-medium flex items-center justify-center hover:bg-gray-50">3</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">hotel</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Hoteles</div>
                    <div className="text-2xl font-bold text-[#111827]">24</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                    <span className="material-symbols-outlined text-[24px] filled">handshake</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Partners Activos</div>
                    <div className="text-2xl font-bold text-[#111827]">18</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                    <span className="material-symbols-outlined text-[24px] filled">bed</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Habitaciones</div>
                    <div className="text-2xl font-bold text-[#111827]">1,452</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500">
                    <span className="material-symbols-outlined text-[24px] filled">star</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Calificación</div>
                    <div className="text-2xl font-bold text-[#111827] flex items-center gap-1">
                        4.6 
                        <div className="flex text-yellow-400 text-[14px]">
                            <span className="material-symbols-outlined filled">star</span>
                            <span className="material-symbols-outlined filled">star</span>
                            <span className="material-symbols-outlined filled">star</span>
                            <span className="material-symbols-outlined filled">star</span>
                            <span className="material-symbols-outlined filled" style={{clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'}}>star</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};