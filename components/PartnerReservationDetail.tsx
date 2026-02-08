import React, { useState } from 'react';

interface PartnerReservationDetailProps {
  reservationId: string;
  onBack: () => void;
}

export const PartnerReservationDetail: React.FC<PartnerReservationDetailProps> = ({ reservationId, onBack }) => {
  // Mock data based on the image provided
  const reservation = {
    id: "AH-2091",
    guest: {
        name: "Alejandro Marín",
        email: "alejandro.m@email.com",
        phone: "+34 612 345 678",
        img: "https://ui-avatars.com/api/?name=Alejandro+Marin&background=random",
        origin: "Directo / Web",
        language: "Español",
        since: "Mayo 2023"
    },
    stay: {
        checkIn: "24 Oct",
        checkOut: "27 Oct",
        nights: 3,
        room: "Doble Superior (Hab. 204)",
        guests: "2 Adultos"
    },
    specialRequest: "“Es nuestro aniversario de bodas. Si es posible, nos gustaría una botella de cava a la llegada. Gracias.”"
  };

  // State for the interactive Customer Journey toggles
  const [journeySteps, setJourneySteps] = useState([
    { id: 1, title: "Marcar Pago como Verificado", desc: "Confirmación de recepción de fondos", status: "completed", note: "Pago total recibido vía Stripe." },
    { id: 2, title: "Notificar Preparación de Estancia", desc: "Hacer saber al huésped que su habitación se está alistando", status: "active", note: "" },
    { id: 3, title: "Activar Check-in Ready (QR)", desc: "Envía la llave digital o código de acceso al huésped", status: "pending", note: "" }
  ]);

  const [noteText, setNoteText] = useState("");

  const handleToggle = (id: number) => {
      setJourneySteps(steps => steps.map(step => {
          if (step.id === id) {
             if (step.status === 'completed') return { ...step, status: 'active' };
             if (step.status === 'active') return { ...step, status: 'completed' };
             if (step.status === 'pending') return { ...step, status: 'active' };
          }
          return step;
      }));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[#111827]">Reserva #{reservation.id}</h1>
                    <p className="text-sm text-gray-400">Control de Proceso y Customer Journey</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    Enviar mensaje por WhatsApp
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Guest & Stay Info */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                
                {/* Guest Profile Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <img src={reservation.guest.img} className="w-16 h-16 rounded-full object-cover" alt="Guest" />
                        <div>
                            <h3 className="font-bold text-[#111827] text-lg">{reservation.guest.name}</h3>
                            <p className="text-sm text-gray-500">{reservation.guest.email}</p>
                            <p className="text-sm text-gray-500">{reservation.guest.phone}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Origen</span>
                            <span className="font-bold text-[#111827]">{reservation.guest.origin}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Idioma</span>
                            <span className="font-bold text-[#111827]">{reservation.guest.language}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Cliente desde</span>
                            <span className="font-bold text-[#111827]">{reservation.guest.since}</span>
                        </div>
                    </div>
                </div>

                {/* Stay Details Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">DETALLES DE LA ESTANCIA</h4>
                    
                    <div className="flex gap-4 mb-5">
                        <span className="material-symbols-outlined text-gray-400 mt-1">calendar_today</span>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Check-in / Check-out</p>
                            <p className="font-bold text-[#111827] text-sm">{reservation.stay.checkIn} – {reservation.stay.checkOut} ({reservation.stay.nights} noches)</p>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-5">
                        <span className="material-symbols-outlined text-gray-400 mt-1">bed</span>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Tipo de Habitación</p>
                            <p className="font-bold text-[#111827] text-sm">{reservation.stay.room}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <span className="material-symbols-outlined text-gray-400 mt-1">group</span>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Huéspedes</p>
                            <p className="font-bold text-[#111827] text-sm">{reservation.stay.guests}</p>
                        </div>
                    </div>
                </div>

                {/* Special Requests Card */}
                <div className="bg-[#FFF7ED] p-6 rounded-2xl border border-[#FFEDD5]">
                    <div className="flex items-center gap-2 mb-2 text-[#C2410C]">
                         <span className="material-symbols-outlined text-[20px] filled">exclamation</span>
                         <h4 className="font-bold text-sm uppercase">PETICIONES ESPECIALES</h4>
                    </div>
                    <p className="text-sm text-[#9A3412] italic leading-relaxed">
                        {reservation.specialRequest}
                    </p>
                </div>

            </div>

            {/* Right Column: Customer Journey */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-[#111827]">Control de Customer Journey</h3>
                            <p className="text-xs text-gray-500">Gestione manualmente el flujo de la experiencia del huésped</p>
                        </div>
                        <div className="bg-[#EFF6FF] px-4 py-2 rounded-full border border-[#DBEAFE]">
                             <span className="text-[10px] font-bold text-[#1E40AF] uppercase">ESTADO ACTUAL: PREPARANDO ESTANCIA</span>
                        </div>
                    </div>

                    <div className="p-6 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[43px] top-10 bottom-10 w-0.5 bg-gray-100"></div>

                        <div className="flex flex-col gap-10">
                            {journeySteps.map((step) => (
                                <div key={step.id} className="relative flex gap-6">
                                    {/* Icon */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                        step.status === 'completed' ? 'bg-[#10B981] text-white' : 
                                        step.status === 'active' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        <span className="material-symbols-outlined text-[20px] filled">
                                            {step.status === 'completed' ? 'check' : 
                                             step.status === 'active' ? 'notifications_active' : 'qr_code'}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h4 className={`font-bold text-sm ${step.status === 'pending' ? 'text-gray-400' : 'text-[#111827]'}`}>{step.title}</h4>
                                                <p className="text-xs text-gray-500">{step.desc}</p>
                                            </div>
                                            
                                            {/* Toggle Switch */}
                                            <div className="flex items-center gap-3">
                                                {step.status === 'completed' && <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">COMPLETADO</span>}
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={step.status === 'completed'} 
                                                        onChange={() => handleToggle(step.id)}
                                                    />
                                                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${step.status === 'completed' ? 'peer-checked:bg-[#10B981]' : (step.status === 'active' ? 'peer-checked:bg-[#10B981]' : '')}`}></div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Input Area */}
                                        <div className="mt-3">
                                            {step.status === 'completed' ? (
                                                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed">
                                                    {step.note}
                                                </div>
                                            ) : step.status === 'active' ? (
                                                <div className="relative">
                                                     <input 
                                                        type="text" 
                                                        placeholder="Añadir comentario personalizado (ej: 'Habitación 204 lista con flores')" 
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-24"
                                                        value={noteText}
                                                        onChange={(e) => setNoteText(e.target.value)}
                                                     />
                                                     <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded transition-colors">
                                                         Guardar Nota
                                                     </button>
                                                </div>
                                            ) : (
                                                <div className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-300 cursor-not-allowed italic">
                                                    Instrucciones de acceso (opcional)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* History Log */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HISTORIAL DE INTERACCIONES</h4>
                        <button className="text-xs font-bold text-[#1E3A8A] hover:underline">Ver registro completo</button>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5"></div>
                            <div>
                                <p className="text-sm text-[#111827]"><span className="font-bold">Reserva confirmada</span> por Sistema central.</p>
                                <p className="text-xs text-gray-400 mt-0.5">Hace 2 días - 14:20</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5"></div>
                            <div>
                                <p className="text-sm text-[#111827]"><span className="font-bold">Pago verificado</span> por Admin (Marta S.)</p>
                                <p className="text-xs text-gray-400 mt-0.5">Hace 4 horas - 09:15</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </div>
  );
};