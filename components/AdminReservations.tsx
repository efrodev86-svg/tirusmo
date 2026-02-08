import React from 'react';

interface AdminReservationsProps {
  onSelectReservation?: (id: string) => void;
}

export const AdminReservations: React.FC<AdminReservationsProps> = ({ onSelectReservation }) => {
  // Mock Data matching the provided design
  const reservations = [
    {
      id: "#RES-2024-001",
      guest: { name: "Alejandro Morales", email: "alejandro.m@email.com", img: "https://ui-avatars.com/api/?name=Alejandro+Morales&background=random" },
      hotel: "Grand SPA Resort",
      checkIn: "15 Nov",
      checkOut: "20 Nov",
      nights: 5,
      total: "$1,240.00",
      status: "CONFIRMADA"
    },
    {
      id: "#RES-2024-002",
      guest: { name: "Sofía Luna", email: "sofia.l@email.com", img: "https://ui-avatars.com/api/?name=Sofía+Luna&background=random" },
      hotel: "Mountain Wellness",
      checkIn: "18 Nov",
      checkOut: "22 Nov",
      nights: 4,
      total: "$850.50",
      status: "PENDIENTE"
    },
    {
      id: "#RES-2024-003",
      guest: { name: "Carlos Ruíz", email: "carlos.r@email.com", img: "https://ui-avatars.com/api/?name=Carlos+Ruíz&background=random" },
      hotel: "Urban Oasis",
      checkIn: "10 Nov",
      checkOut: "12 Nov",
      nights: 2,
      total: "$420.00",
      status: "CHECKOUT"
    },
    {
      id: "#RES-2024-004",
      guest: { name: "Miguel Ángel", email: "miguel.a@email.com", img: "https://ui-avatars.com/api/?name=Miguel+Angel&background=random" },
      hotel: "Grand SPA Resort",
      checkIn: "05 Nov",
      checkOut: "08 Nov",
      nights: 3,
      total: "$780.00",
      status: "CANCELADA"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADA': return 'bg-green-100 text-green-700';
      case 'PENDIENTE': return 'bg-orange-100 text-orange-700';
      case 'CHECKOUT': return 'bg-blue-100 text-blue-700';
      case 'CANCELADA': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleRowClick = (id: string) => {
    if (onSelectReservation) {
      onSelectReservation(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#111827]">Listado de Reservaciones</h1>
        <div className="flex items-center gap-4">
            <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px] filled">notifications</span>
            </button>
            <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
            </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Buscar</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
                    <input type="text" placeholder="Nombre o ID..." className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                </div>
            </div>
            <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Hotel</label>
                <div className="relative">
                    <select className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors text-gray-600 appearance-none">
                        <option>Todos los hoteles</option>
                        <option>Grand SPA Resort</option>
                        <option>Mountain Wellness</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">expand_more</span>
                </div>
            </div>
            <div className="md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Rango de Fechas</label>
                 <div className="relative">
                    <input type="text" placeholder="mm/dd/yyyy" className="w-full pl-3 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors text-gray-600" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'}/>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">calendar_today</span>
                 </div>
            </div>
            <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Estado</label>
                <div className="relative">
                    <select className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors text-gray-600 appearance-none">
                        <option>Todos los estados</option>
                        <option>Confirmada</option>
                        <option>Pendiente</option>
                        <option>Cancelada</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">expand_more</span>
                </div>
            </div>
             <div className="md:col-span-2 flex gap-2">
                <button className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                    Filtrar
                </button>
                <button className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                </button>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/50">
                        <th className="py-4 pl-6">ID Reserva</th>
                        <th className="py-4">Huésped</th>
                        <th className="py-4">Hotel</th>
                        <th className="py-4">Check-in/Out</th>
                        <th className="py-4">Monto Total</th>
                        <th className="py-4">Estado</th>
                        <th className="py-4 text-center pr-6">Acciones</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {reservations.map((res, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                            <td className="py-4 pl-6 font-bold text-primary cursor-pointer hover:underline" onClick={() => handleRowClick(res.id)}>{res.id}</td>
                            <td className="py-4">
                                <div className="flex items-center gap-3">
                                    <img src={res.guest.img} className="w-9 h-9 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-[#111827]">{res.guest.name}</p>
                                        <p className="text-xs text-gray-400">{res.guest.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 text-gray-600 font-medium w-[150px]">{res.hotel}</td>
                            <td className="py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-700">{res.checkIn} - {res.checkOut}</span>
                                    <span className="text-xs text-gray-400">{res.nights} Noches</span>
                                </div>
                            </td>
                            <td className="py-4 font-bold text-[#111827]">{res.total}</td>
                            <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(res.status)}`}>
                                    {res.status}
                                </span>
                            </td>
                            <td className="py-4 text-center pr-6">
                                <div className="flex justify-center gap-2">
                                    <button 
                                      className="text-gray-400 hover:text-primary transition-colors p-1" 
                                      onClick={() => handleRowClick(res.id)}
                                      title="Ver detalle"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                    </button>
                                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                                      <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                      <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
         {/* Pagination */}
         <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4">
             <span className="text-xs text-gray-400">Mostrando 1 a 4 de 128 reservaciones</span>
             <div className="flex gap-1">
                 <button className="px-3 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Anterior</button>
                 <button className="px-3 py-1 rounded bg-primary text-white text-xs font-bold shadow-md shadow-blue-200">1</button>
                 <button className="px-3 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">2</button>
                 <button className="px-3 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">3</button>
                 <button className="px-3 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Siguiente</button>
             </div>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                   <span className="material-symbols-outlined text-[22px]">calendar_today</span>
              </div>
              <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Hoy</div>
                  <div className="text-2xl font-bold text-[#111827]">12</div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                   <span className="material-symbols-outlined text-[22px] filled">check_circle</span>
              </div>
              <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confirmadas</div>
                  <div className="text-2xl font-bold text-[#111827]">84</div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                   <span className="material-symbols-outlined text-[22px] filled">more_horiz</span>
              </div>
              <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pendientes</div>
                  <div className="text-2xl font-bold text-[#111827]">28</div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                   <span className="material-symbols-outlined text-[22px] filled">cancel</span>
              </div>
              <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Canceladas</div>
                  <div className="text-2xl font-bold text-[#111827]">16</div>
              </div>
          </div>
      </div>
    </div>
  );
};