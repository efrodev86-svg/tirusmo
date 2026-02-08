import React from 'react';

export const PartnerCalendar: React.FC = () => {
  // Mock events based on the design image
  const events = [
    {
      id: 1,
      title: "Alejandro M. - Doble",
      startDay: 2, // October 2
      duration: 3, // Spans 3 days
      type: "reservation",
      row: 1
    },
    {
      id: 2,
      title: "Bloqueo Mantenimiento",
      startDay: 5,
      duration: 2,
      type: "block",
      row: 1
    },
    {
      id: 3,
      title: "Sofia Luna - Suite (Check-in)",
      startDay: 9,
      duration: 4,
      type: "checkin",
      row: 1
    },
    {
      id: 4,
      title: "Carlos Ruiz - Estándar",
      startDay: 18,
      duration: 4,
      type: "reservation",
      row: 1
    },
    {
      id: 5,
      title: "Marina Sol - Junior Suite",
      startDay: 24,
      duration: 3,
      type: "active", // Using green for active/confirmed per visual cues
      row: 1
    }
  ];

  const getEventStyles = (type: string) => {
    switch (type) {
      case 'reservation':
        return 'bg-[#DBEAFE] text-[#1E40AF] border-l-4 border-[#3B82F6]';
      case 'checkin':
        return 'bg-[#FEF3C7] text-[#92400E] border-l-4 border-[#F59E0B]';
      case 'block':
        return 'bg-[#F3F4F6] text-[#4B5563] border-l-4 border-[#9CA3AF]';
      case 'active':
        return 'bg-[#D1FAE5] text-[#065F46] border-l-4 border-[#10B981]';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Calendar Grid Generation (October 2023)
  // Oct 1st 2023 was a Sunday.
  // The design shows the week starting on Monday.
  // So the first row starts with Sep 25.
  const days = [];
  
  // Previous month padding (Sep 25 - Sep 30)
  for (let i = 25; i <= 30; i++) days.push({ day: i, currentMonth: false });
  // Current month (Oct 1 - Oct 31)
  for (let i = 1; i <= 31; i++) days.push({ day: i, currentMonth: true });
  // Next month padding (Nov 1 - Nov 5 to fill 5 weeks of 7 days = 35 cells, actually usually 6 weeks = 42)
  for (let i = 1; i <= 11; i++) days.push({ day: i, currentMonth: false });

  // Slicing to exactly 5 rows (35 days) as per typical view, or adjust based on length
  const calendarCells = days.slice(0, 35); 

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-[#111827]">Calendario de Disponibilidad</h1>
          <div className="flex items-center gap-4">
               <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm gap-3">
                   <span className="material-symbols-outlined text-gray-500 text-[20px]">calendar_today</span>
                   <span className="font-bold text-sm text-[#111827]">Octubre 2023</span>
               </div>
               
               <div className="flex items-center bg-gray-100 rounded-lg p-1">
                   <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all">
                       <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                   </button>
                   <span className="px-3 text-xs font-bold text-gray-600">Hoy</span>
                   <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all">
                       <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                   </button>
               </div>

               <div className="flex gap-2">
                    <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px] filled">notifications</span>
                    </button>
                    <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                        <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
                    </div>
               </div>
          </div>
      </div>

      {/* Toolbar & Legend */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <div className="relative">
                   <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-64">
                       <option>Todos los tipos de habitación</option>
                       <option>Master Suite</option>
                       <option>Junior Suite</option>
                   </select>
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
              </div>
              <div className="relative">
                   <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-64">
                       <option>Todas las habitaciones</option>
                       <option>Hab 101</option>
                       <option>Hab 102</option>
                   </select>
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
              </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto justify-between xl:justify-end">
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div> Reservas
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div> Check-in
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]"></div> Bloqueo
                  </div>
              </div>
              <button className="bg-[#1E3A8A] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-md shadow-blue-100">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Nueva Reserva
              </button>
          </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, i) => (
                  <div key={i} className="py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {day}
                  </div>
              ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7 grid-rows-5 flex-1 relative">
              {calendarCells.map((cell, i) => (
                  <div key={i} className={`border-b border-r border-gray-100 p-2 relative min-h-[120px] group ${!cell.currentMonth ? 'bg-gray-50/30' : 'bg-white'}`}>
                      <span className={`text-sm font-medium ${!cell.currentMonth ? 'text-gray-300' : 'text-gray-500 group-hover:text-[#1E3A8A] transition-colors'}`}>
                          {cell.day}
                      </span>
                      
                      {/* Events Rendering */}
                      {/* Note: In a production app, we would calculate relative/absolute positioning based on dates.
                          For this specific layout request, we verify if an event starts on this day (assuming current month Oct).
                       */}
                      {cell.currentMonth && events.filter(e => e.startDay === cell.day).map(event => (
                          <div 
                            key={event.id}
                            className={`absolute left-1 top-8 h-8 rounded px-3 flex items-center text-[10px] font-bold shadow-sm cursor-pointer hover:opacity-90 z-10 whitespace-nowrap overflow-hidden text-ellipsis ${getEventStyles(event.type)}`}
                            style={{ 
                                width: `calc(${event.duration * 100}% + ${event.duration - 1}px)`, // Spanning width calculation
                                maxWidth: '500%' // Safety cap
                            }}
                          >
                              {event.title}
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      </div>

      {/* Info Footer */}
      <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#3B82F6] filled mt-0.5">info</span>
          <div>
              <h4 className="text-sm font-bold text-[#1E3A8A]">Gestión de Disponibilidad</h4>
              <p className="text-xs text-[#1E40AF] mt-1">
                  Haga clic en una fecha vacía para añadir un bloqueo manual por mantenimiento o uso interno. Arrastre las barras de reserva para reprogramar estancias rápidamente.
              </p>
          </div>
      </div>

    </div>
  );
};