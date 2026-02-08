import React from 'react';

interface PartnerReservationsProps {
    onSelectReservation?: (id: string) => void;
}

export const PartnerReservations: React.FC<PartnerReservationsProps> = ({ onSelectReservation }) => {
  const reservations = [
    {
      id: "AH-2091",
      guestName: "Alejandro Marín",
      guestEmail: "amarin@email.com",
      guestImg: "https://ui-avatars.com/api/?name=Alejandro+Marin&background=random",
      room: "Doble Superior",
      guestsDetails: "2 Adultos, 1 Niño",
      dates: "24 Oct - 28 Oct",
      nights: 4,
      total: 480.00,
      journeyStatus: "Preparando Estancia",
      journeyColor: "bg-orange-100 text-orange-700 border-orange-200"
    },
    {
      id: "AH-2092",
      guestName: "Sofía Luna",
      guestEmail: "sluna@email.com",
      guestImg: "https://ui-avatars.com/api/?name=Sofia+Luna&background=random",
      room: "Junior Suite",
      guestsDetails: "2 Adultos",
      dates: "24 Oct - 26 Oct",
      nights: 2,
      total: 820.00,
      journeyStatus: "Check-in Ready",
      journeyColor: "bg-green-100 text-green-700 border-green-200"
    },
    {
      id: "AH-2095",
      guestName: "Carlos Ruiz",
      guestEmail: "cruiz@email.com",
      guestImg: "https://ui-avatars.com/api/?name=Carlos+Ruiz&background=random",
      room: "Estandar",
      guestsDetails: "1 Adulto",
      dates: "25 Oct - 29 Oct",
      nights: 4,
      total: 310.00,
      journeyStatus: "Pago Verificado",
      journeyColor: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      id: "AH-2096",
      guestName: "Elena López",
      guestEmail: "elopez@email.com",
      guestImg: "https://ui-avatars.com/api/?name=Elena+Lopez&background=random",
      room: "Deluxe Suite",
      guestsDetails: "2 Adultos",
      dates: "26 Oct - 30 Oct",
      nights: 4,
      total: 1250.00,
      journeyStatus: "Reserva Confirmada",
      journeyColor: "bg-gray-100 text-gray-700 border-gray-200"
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-[#111827]">Listado de Reservaciones</h1>
          <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    24 Octubre, 2023
                </div>
              <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px] filled">notifications</span>
              </button>
              <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                  <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
              </div>
          </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">BÚSQUEDA</label>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
                      <input 
                        type="text" 
                        placeholder="ID o Nombre de huésped" 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all placeholder:text-gray-400" 
                      />
                  </div>
              </div>
              
              <div className="md:col-span-3">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">RANGO DE FECHAS</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Seleccionar fechas"
                        defaultValue="24 Oct - 31 Oct, 2023"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all" 
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-[20px] pointer-events-none">calendar_today</span>
                   </div>
              </div>

              <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">ESTADO</label>
                  <div className="relative">
                      <select className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all appearance-none cursor-pointer">
                          <option>Todos los estados</option>
                          <option>Confirmada</option>
                          <option>Pendiente</option>
                          <option>Cancelada</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-[20px] pointer-events-none">expand_more</span>
                  </div>
              </div>

               <div className="md:col-span-2 flex gap-2">
                  <button className="flex-1 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-md shadow-blue-100">
                      Aplicar Filtros
                  </button>
                  <button className="w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg border border-gray-100 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">refresh</span>
                  </button>
              </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-white">
                          <th className="py-4 pl-6 w-[120px]">ID RESERVA</th>
                          <th className="py-4 w-[250px]">HUÉSPED</th>
                          <th className="py-4 w-[180px]">HABITACIÓN</th>
                          <th className="py-4 text-center">FECHAS</th>
                          <th className="py-4 text-center">MONTO TOTAL</th>
                          <th className="py-4 text-center">CUSTOMER JOURNEY</th>
                          <th className="py-4 text-right pr-6">ACCIONES</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm">
                      {reservations.map((res, i) => (
                          <tr 
                            key={i} 
                            onClick={() => onSelectReservation && onSelectReservation(res.id)}
                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer"
                          >
                              <td className="py-4 pl-6">
                                  <span className="font-bold text-[#1E3A8A] group-hover:underline">#{res.id}</span>
                              </td>
                              <td className="py-4">
                                  <div className="flex items-center gap-3">
                                      <img src={res.guestImg} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt={res.guestName} />
                                      <div>
                                          <p className="font-bold text-[#111827]">{res.guestName}</p>
                                          <p className="text-xs text-gray-400">{res.guestEmail}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="py-4">
                                  <p className="font-medium text-gray-700">{res.room}</p>
                                  <p className="text-xs text-gray-400">{res.guestsDetails}</p>
                              </td>
                              <td className="py-4 text-center">
                                  <div className="flex flex-col items-center">
                                      <span className="font-medium text-gray-700">{res.dates}</span>
                                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-1">{res.nights} NOCHES</span>
                                  </div>
                              </td>
                              <td className="py-4 text-center">
                                  <span className="font-bold text-[#111827] text-base">${res.total.toFixed(2)}</span>
                              </td>
                              <td className="py-4 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${res.journeyColor}`}>
                                      {res.journeyStatus}
                                  </span>
                              </td>
                              <td className="py-4 text-right pr-6">
                                  <button className="bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                                      Gestionar
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4 mt-auto bg-white">
               <span className="text-xs text-gray-400 font-medium">Mostrando 1-10 de 128 reservaciones</span>
               <div className="flex gap-2 items-center">
                   <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                       <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                   </button>
                   <button className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold flex items-center justify-center shadow-md">1</button>
                   <button className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center transition-colors">2</button>
                   <button className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center transition-colors">3</button>
                   <span className="text-gray-400 text-xs px-1">...</span>
                   <button className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center transition-colors">13</button>
                   <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                       <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                   </button>
               </div>
          </div>
      </div>

      {/* Summary Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#EFF6FF] p-5 rounded-2xl border border-[#DBEAFE] shadow-sm">
              <div className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider mb-2">LLEGADAS HOY</div>
              <div className="text-3xl font-bold text-[#1E3A8A]">12</div>
          </div>
          <div className="bg-[#FFF7ED] p-5 rounded-2xl border border-[#FFEDD5] shadow-sm">
              <div className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider mb-2">PREPARANDO</div>
              <div className="text-3xl font-bold text-[#7C2D12]">8</div>
          </div>
          <div className="bg-[#ECFDF5] p-5 rounded-2xl border border-[#D1FAE5] shadow-sm">
              <div className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-2">LISTOS CHECK-IN</div>
              <div className="text-3xl font-bold text-[#064E3B]">15</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">TOTAL SEMANAL</div>
              <div className="text-3xl font-bold text-[#111827]">84</div>
          </div>
      </div>

    </div>
  );
};