import React, { useState } from 'react';

interface AdminReservationDetailProps {
  reservationId: string;
  onBack: () => void;
}

interface Note {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  type: 'info' | 'history' | 'warning';
}

export const AdminReservationDetail: React.FC<AdminReservationDetailProps> = ({ reservationId, onBack }) => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Huésped solicitó almohadas extra",
      content: "Se notificó a servicio de limpieza. Confirmado por el ama de llaves a las 16:00.",
      timestamp: "Hace 2 horas",
      type: "info"
    },
    {
      id: 2,
      title: "Upgrade de Habitación",
      content: "Upgrade otorgado por cortesía de fidelidad (Nivel Platinum).",
      timestamp: "24 Oct, 15:15",
      type: "history"
    }
  ]);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const handleSaveNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now(),
      title: newNoteTitle,
      content: newNoteContent,
      timestamp: "Justo ahora",
      type: "info"
    };

    setNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setIsAddingNote(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-gray-500">arrow_back</span>
            </button>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#111827]">Reservación #SPA-9283</h1>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">En curso</span>
                </div>
                <p className="text-sm text-gray-400">Realizada el 20 de Oct, 2023</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span> Emitir Factura
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span> Modificar Fechas
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">cancel</span> Cancelar Reserva
            </button>
        </div>
      </div>

      {/* Customer Journey Stepper */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-lg text-[#111827]">Customer Journey</h3>
            <span className="text-sm text-gray-500">Estado actual: <span className="font-bold text-blue-600">Estancia</span></span>
        </div>
        
        <div className="relative flex items-center justify-between px-4 md:px-10 mt-4">
            {/* Line Background */}
            <div className="absolute left-0 top-5 w-full h-1 bg-gray-100 -z-10"></div>
            <div className="absolute left-0 top-5 w-[80%] h-1 bg-primary -z-10"></div>

            {/* Steps */}
            {[
                { label: "Reserva", date: "20 Oct, 14:30", active: true, icon: "check" },
                { label: "Pago", date: "20 Oct, 14:35", active: true, icon: "check" },
                { label: "Preparando", date: "23 Oct, 09:00", active: true, icon: "check" },
                { label: "Check-in", date: "24 Oct, 15:10", active: true, icon: "check" },
                { label: "Estancia", date: "En progreso", active: true, icon: "meeting_room", current: true },
                { label: "Checkout", date: "28 Oct, 11:00", active: false, icon: "logout" },
            ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${step.active ? (step.current ? 'bg-white border-primary text-primary' : 'bg-primary border-primary text-white') : 'bg-white border-gray-200 text-gray-300'}`}>
                        <span className="material-symbols-outlined text-[20px] font-bold">{step.icon}</span>
                    </div>
                    <div className="text-center">
                        <p className={`text-sm font-bold ${step.current ? 'text-primary' : (step.active ? 'text-[#111827]' : 'text-gray-300')}`}>{step.label}</p>
                        <p className="text-[10px] text-gray-400">{step.date}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Customer Data */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary text-[22px]">person</span>
                    <h3 className="font-bold text-lg text-[#111827]">Datos del Cliente</h3>
                 </div>
                 <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <img src="https://ui-avatars.com/api/?name=Alejandro+Mendoza&background=random" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 w-full">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                            <p className="font-bold text-[#111827]">Alejandro Mendoza</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                            <p className="font-bold text-[#111827]">a.mendoza@email.com</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Teléfono</p>
                            <p className="font-bold text-[#111827]">+52 55 1234 5678</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Accommodation Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary text-[22px] filled">bed</span>
                    <h3 className="font-bold text-lg text-[#111827]">Detalles del Alojamiento</h3>
                 </div>
                 <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAP3pLgh2y6TTH9MWzXMUWpr3UsqYEa5HnrYpKUF4HoNHzCaq1N-mtHns-GaRnq5zh0_UgKocBzYaXzlhuBF0Vi6jD-gwqlGyqZa70fwyGeU6rBVSfz-EY_yJBZx-yAbI15V8nhp_8ksTQaXq9pSuK5IH9McYauZMvLBnsG-IdH4dr8kKdBJWBiazXque5PAKY-_fYwVBe3pyX3XtZ_ka1dI0_cDMKVYRGCyYMyBEABqDM9wBM805itA_UYUhzJIk-jmBwEdal38Q" className="w-full h-full object-cover" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 flex-1">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hotel</p>
                            <p className="font-bold text-[#111827]">Grand SPA Resort</p>
                            <p className="text-xs text-blue-500">Cancún, Quintana Roo</p>
                        </div>
                        <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tipo de Habitación</p>
                             <p className="font-bold text-[#111827]">Master Suite con Vista al Mar</p>
                             <p className="text-xs text-gray-500">Piso 4, Hab. 402</p>
                        </div>
                        <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fechas de Estancia</p>
                             <div className="flex items-center gap-2 font-bold text-[#111827]">
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_today</span>
                                24 Oct - 28 Oct (4 Noches)
                             </div>
                        </div>
                        <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Huéspedes</p>
                             <div className="flex items-center gap-2 font-bold text-[#111827]">
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">group</span>
                                2 Adultos, 0 Niños
                             </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Right Column (Payment) */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary text-[22px] filled">payments</span>
                    <h3 className="font-bold text-lg text-[#111827]">Desglose de Pago</h3>
                </div>
                
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span className="italic">4 Noches x $250.00</span>
                        <span className="font-bold text-[#111827]">$1,000.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Paquete SPA (All-inclusive)</span>
                        <span className="font-bold text-[#111827]">$150.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Impuestos (16% IVA)</span>
                        <span className="font-bold text-[#111827]">$184.00</span>
                    </div>
                    <div className="h-px bg-gray-100 border-t border-dashed border-gray-300 my-2"></div>
                    <div className="flex justify-between items-end">
                        <span className="font-bold text-lg text-[#111827]">Total</span>
                        <span className="font-bold text-2xl text-primary">$1,334.00</span>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Método de Pago</span>
                         <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pagado</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-white border border-gray-200 rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600">credit_card</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#111827]">Visa terminada en 4242</p>
                            <p className="text-[10px] text-gray-400">Ref: #TXN-7729281</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">notes</span>
                <h3 className="font-bold text-lg text-[#111827]">Notas del Administrador</h3>
            </div>
            {!isAddingNote && (
                <button 
                    onClick={() => setIsAddingNote(true)}
                    className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span> Añadir Nota
                </button>
            )}
         </div>

         {isAddingNote && (
             <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in zoom-in-95">
                 <h4 className="font-bold text-sm text-gray-700 mb-3">Nueva Nota</h4>
                 <input 
                    type="text" 
                    placeholder="Título de la nota (ej. Solicitud especial)" 
                    className="w-full mb-3 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                 />
                 <textarea 
                    placeholder="Detalles..." 
                    className="w-full mb-3 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-20 resize-none"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                 />
                 <div className="flex justify-end gap-2">
                     <button 
                        onClick={() => {
                            setIsAddingNote(false);
                            setNewNoteTitle("");
                            setNewNoteContent("");
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
                     >
                        Cancelar
                     </button>
                     <button 
                        onClick={handleSaveNote}
                        disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                        className="px-4 py-1.5 text-sm font-bold bg-primary text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Guardar Nota
                     </button>
                 </div>
             </div>
         )}

         <div className="flex flex-col gap-4">
            {notes.map((note) => (
                <div key={note.id} className={`flex gap-4 p-4 bg-gray-50/50 rounded-lg border-l-4 ${note.type === 'info' ? 'border-blue-500' : note.type === 'history' ? 'border-gray-300' : 'border-yellow-500'}`}>
                    <div className="mt-1">
                        <span className={`material-symbols-outlined filled text-[20px] ${note.type === 'info' ? 'text-blue-500' : note.type === 'history' ? 'text-gray-400' : 'text-yellow-500'}`}>
                            {note.type === 'info' ? 'info' : note.type === 'history' ? 'history' : 'warning'}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <h4 className="font-bold text-sm text-[#111827]">{note.title}</h4>
                            <span className="text-[10px] text-gray-400">{note.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{note.content}</p>
                    </div>
                </div>
            ))}
         </div>
      </div>

    </div>
  );
};