import React, { useState } from 'react';

interface PartnerBlockManagerProps {
  onBack: () => void;
  onConfirm: () => void;
}

export const PartnerBlockManager: React.FC<PartnerBlockManagerProps> = ({ onBack, onConfirm }) => {
  const [blockType, setBlockType] = useState<'maintenance' | 'blocked'>('maintenance');
  const [selectedStart, setSelectedStart] = useState<number>(10);
  const [selectedEnd, setSelectedEnd] = useState<number>(16);
  const [comment, setComment] = useState("");

  // Mock Calendar Data for May 2024
  // May 1st 2024 is a Wednesday.
  const daysInMonth = 31;
  const paddingStart = 3; // Sun, Mon, Tue (Apr 28, 29, 30)
  
  const days = [];
  // Previous month padding
  for(let i=28; i<=30; i++) days.push({ day: i, current: false });
  // Current month
  for(let i=1; i<=31; i++) days.push({ day: i, current: true });
  // Next month padding (to fill 35 cells)
  days.push({ day: 1, current: false });

  // Mock reservations (Blue days in image)
  const reservations = [19, 20]; 

  const isSelected = (day: number, current: boolean) => current && day >= selectedStart && day <= selectedEnd;
  const isStart = (day: number, current: boolean) => current && day === selectedStart;
  const isEnd = (day: number, current: boolean) => current && day === selectedEnd;
  const isReservation = (day: number, current: boolean) => current && reservations.includes(day);

  // Helper to handle date selection (simplified logic for demo)
  const handleDateClick = (day: number, current: boolean) => {
      if (!current) return;
      if (day < selectedStart) {
          setSelectedStart(day);
      } else if (day > selectedStart && day < selectedEnd) {
          // If clicking middle, maybe shrink? For now simple logic
          setSelectedEnd(day);
      } else {
          setSelectedEnd(day);
      }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-2xl font-bold text-[#111827]">Gestión de Bloqueos de Habitación Avanzada</h1>
            </div>
            <div className="flex items-center text-gray-500 font-medium">
                <span className="material-symbols-outlined text-[20px] mr-2">calendar_today</span>
                Mayo 2024
            </div>
        </div>

        {/* Top Controls */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
            <div className="w-full md:w-1/2">
                <label className="text-xs font-bold text-gray-700 block mb-2">Seleccionar Habitación</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">bed</span>
                    <select className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#111827] outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                        <option>Habitación 102 - Classic Garden View</option>
                        <option>Habitación 204 - Junior Suite</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                </div>
            </div>

            <div className="w-full md:w-auto">
                <label className="text-xs font-bold text-gray-700 block mb-2">Tipo de Bloqueo</label>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setBlockType('maintenance')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border font-bold text-sm transition-all ${blockType === 'maintenance' ? 'border-[#F97316] text-[#F97316] bg-[#FFF7ED] ring-1 ring-[#F97316]' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-[18px] filled">build</span>
                        Mantenimiento
                    </button>
                    <button 
                        onClick={() => setBlockType('blocked')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border font-bold text-sm transition-all ${blockType === 'blocked' ? 'border-gray-600 text-gray-800 bg-gray-100 ring-1 ring-gray-600' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-[18px] filled">block</span>
                        Bloqueado
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Area */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-[#111827]">Mayo 2024</h2>
                        <div className="flex gap-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div> Disponible
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div> Mantenimiento
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div> Reservado
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-7 mb-4">
                        {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((d) => (
                            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-4">
                        {days.map((d, i) => {
                            const isSel = isSelected(d.day, d.current);
                            const isS = isStart(d.day, d.current);
                            const isE = isEnd(d.day, d.current);
                            const isRes = isReservation(d.day, d.current);
                            
                            // Style Logic
                            let boxClass = "h-24 border-t border-gray-100 relative group cursor-pointer transition-all hover:bg-gray-50";
                            let textClass = "absolute top-2 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-500";
                            
                            if (!d.current) {
                                textClass = "absolute top-2 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-300";
                            }

                            if (isRes) {
                                boxClass += " bg-[#EFF6FF]";
                                textClass = "absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-[#3B82F6]";
                            } else if (isSel) {
                                boxClass += " bg-[#FFF7ED] ring-inset ring-2 ring-[#F97316] z-10";
                                textClass = "absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-[#F97316]";
                            }

                            return (
                                <div key={i} className={boxClass} onClick={() => handleDateClick(d.day, d.current)}>
                                    <span className={textClass}>{d.day}</span>
                                    
                                    {isS && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#F97316] uppercase">INICIO</div>
                                    )}
                                    {isE && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#F97316] uppercase">FIN</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sidebar Summary */}
            <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-blue-600 text-[20px] filled">info</span>
                        <h3 className="font-bold text-[#111827]">Resumen del Bloqueo</h3>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">PERIODO SELECCIONADO</p>
                        <div className="flex justify-between items-center">
                            <div className="text-lg font-bold text-[#111827]">
                                {selectedStart} Mayo — {selectedEnd} Mayo
                            </div>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100">
                                {selectedEnd - selectedStart} Noches
                            </span>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ESTADO DE INVENTARIO</p>
                        <div className="flex items-center gap-2 text-[#F97316] font-bold text-sm">
                            <span className="material-symbols-outlined filled text-[18px]">build</span>
                            <div className="flex flex-col leading-tight">
                                <span>Fuera de Servicio</span>
                                <span className="text-xs font-medium opacity-80">(Mantenimiento)</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm font-bold text-gray-700 block mb-2">Motivo del Bloqueo / Comentarios</label>
                        <textarea 
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none placeholder:text-gray-300"
                            placeholder="Ej: Pintura de paredes y renovación de mobiliario de terraza..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={onConfirm}
                        className="w-full py-3 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold rounded-lg shadow-md shadow-blue-200 transition-all mb-3"
                    >
                        Confirmar Bloqueo
                    </button>
                    <button 
                        onClick={onBack}
                        className="w-full py-3 bg-white hover:bg-gray-50 text-gray-600 font-bold rounded-lg border border-transparent hover:border-gray-200 transition-all"
                    >
                        Cancelar Operación
                    </button>
                </div>

                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4 flex gap-3">
                    <span className="material-symbols-outlined text-[#F97316] mt-0.5">warning</span>
                    <div className="text-xs text-[#9A3412] leading-relaxed">
                        <span className="font-bold">Nota:</span> Bloquear estas fechas cancelará automáticamente cualquier disponibilidad restante en canales externos vinculados (OTAs).
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};