import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

type ReservationData = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestImg: string;
  hotelName: string;
  hotelLocation: string;
  roomName: string;
  roomImage: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  status: string;
  createdAt: string;
} | null;

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'CONFIRMADA': return 'Confirmada';
    case 'PENDIENTE': return 'Pendiente';
    case 'CHECKOUT': return 'Checkout';
    case 'CANCELADA': return 'Cancelada';
    default: return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'CONFIRMADA': return 'bg-green-100 text-green-700';
    case 'PENDIENTE': return 'bg-orange-100 text-orange-700';
    case 'CHECKOUT': return 'bg-blue-100 text-blue-700';
    case 'CANCELADA': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export const AdminReservationDetail: React.FC<AdminReservationDetailProps> = ({ reservationId, onBack }) => {
  const [reservation, setReservation] = useState<ReservationData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [notes, setNotes] = useState<Note[]>([
    { id: 1, title: 'Reserva creada', content: 'Reservación registrada en el sistema.', timestamp: 'Al crear', type: 'history' },
  ]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('reservations')
        .select('id, user_id, hotel_id, room_id, check_in, check_out, total, status, guests, created_at, hotels(name, location, image), rooms(name, image)')
        .eq('id', reservationId)
        .single();

      if (cancelled) return;
      if (err || !data) {
        setError(err?.message || 'Reservación no encontrada');
        setReservation(null);
        setLoading(false);
        return;
      }

      const r = data as Record<string, unknown>;
      const hotel = r.hotels as { name?: string; location?: string; image?: string } | null;
      const room = r.rooms as { name?: string; image?: string } | null;
      const checkIn = String(r.check_in || '');
      const checkOut = String(r.check_out || '');
      const nights = r.check_in && r.check_out
        ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      let guestName = 'Sin nombre';
      let guestEmail = '—';
      let guestPhone = '—';
      const userId = r.user_id as string | null;
      if (userId) {
        const { data: profileData } = await supabase.from('profiles').select('full_name, email, phone').eq('id', userId).single();
        const p = profileData as { full_name?: string; email?: string; phone?: string } | null;
        if (p) {
          guestName = p.full_name || p.email || guestName;
          guestEmail = p.email || guestEmail;
          guestPhone = p.phone || guestPhone;
        }
      }

      if (cancelled) return;
      setReservation({
        id: String(r.id),
        guestName,
        guestEmail,
        guestPhone,
        guestImg: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=random`,
        hotelName: hotel?.name || '—',
        hotelLocation: hotel?.location || '',
        roomName: room?.name || '—',
        roomImage: room?.image || hotel?.image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400',
        checkIn,
        checkOut,
        nights,
        guests: Number(r.guests) || 1,
        total: Number(r.total) || 0,
        status: String(r.status || 'PENDIENTE'),
        createdAt: String(r.created_at || ''),
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reservationId]);

  const handleSaveNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    setNotes([{ id: Date.now(), title: newNoteTitle, content: newNoteContent, timestamp: 'Justo ahora', type: 'info' }, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleCancelReservation = async () => {
    if (!reservation || reservation.status === 'CANCELADA') return;
    if (!window.confirm('¿Cancelar esta reservación?')) return;
    setCancelling(true);
    const { error: err } = await supabase.from('reservations').update({ status: 'CANCELADA' }).eq('id', reservationId);
    setCancelling(false);
    if (err) {
      setError(err.message);
      return;
    }
    setReservation((prev) => prev ? { ...prev, status: 'CANCELADA' } : null);
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Cargando reservación...</p>
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">Volver</button>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error || 'No encontrada'}</p>
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">Volver</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-gray-500">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111827]">Reservación #{reservation.id.slice(0, 8)}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusBadgeClass(reservation.status)}`}>
                {getStatusLabel(reservation.status)}
              </span>
            </div>
            <p className="text-sm text-gray-400">Realizada el {formatDate(reservation.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span> Emitir Factura
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span> Modificar Fechas
          </button>
          {reservation.status !== 'CANCELADA' && (
            <button type="button" onClick={handleCancelReservation} disabled={cancelling} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">cancel</span> {cancelling ? 'Cancelando...' : 'Cancelar Reserva'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[22px]">person</span>
              <h3 className="font-bold text-lg text-[#111827]">Datos del Cliente</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <img src={reservation.guestImg} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 w-full">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                  <p className="font-bold text-[#111827]">{reservation.guestName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-bold text-[#111827]">{reservation.guestEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="font-bold text-[#111827]">{reservation.guestPhone}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[22px] filled">bed</span>
              <h3 className="font-bold text-lg text-[#111827]">Detalles del Alojamiento</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                <img src={reservation.roomImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 flex-1">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hotel</p>
                  <p className="font-bold text-[#111827]">{reservation.hotelName}</p>
                  {reservation.hotelLocation && <p className="text-xs text-blue-500">{reservation.hotelLocation}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Habitación</p>
                  <p className="font-bold text-[#111827]">{reservation.roomName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fechas de Estancia</p>
                  <div className="flex items-center gap-2 font-bold text-[#111827]">
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_today</span>
                    {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)} ({reservation.nights} noches)
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Huéspedes</p>
                  <div className="flex items-center gap-2 font-bold text-[#111827]">
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">group</span>
                    {reservation.guests} {reservation.guests === 1 ? 'huésped' : 'huéspedes'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[22px] filled">payments</span>
              <h3 className="font-bold text-lg text-[#111827]">Desglose de Pago</h3>
            </div>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between text-sm text-gray-500">
                <span className="italic">{reservation.nights} noches</span>
                <span className="font-bold text-[#111827]">{formatCurrency(reservation.total)}</span>
              </div>
              <div className="h-px bg-gray-100 border-t border-dashed border-gray-300 my-2" />
              <div className="flex justify-between items-end">
                <span className="font-bold text-lg text-[#111827]">Total</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(reservation.total)}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeClass(reservation.status)}`}>{getStatusLabel(reservation.status)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">notes</span>
            <h3 className="font-bold text-lg text-[#111827]">Notas del Administrador</h3>
          </div>
          {!isAddingNote && (
            <button type="button" onClick={() => setIsAddingNote(true)} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">add_circle</span> Añadir Nota
            </button>
          )}
        </div>
        {isAddingNote && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold text-sm text-gray-700 mb-3">Nueva Nota</h4>
            <input type="text" placeholder="Título de la nota" className="w-full mb-3 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} />
            <textarea placeholder="Detalles..." className="w-full mb-3 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-20 resize-none" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setIsAddingNote(false); setNewNoteTitle(''); setNewNoteContent(''); }} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">Cancelar</button>
              <button type="button" onClick={handleSaveNote} disabled={!newNoteTitle.trim() || !newNoteContent.trim()} className="px-4 py-1.5 text-sm font-bold bg-primary text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">Guardar Nota</button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <div key={note.id} className={`flex gap-4 p-4 bg-gray-50/50 rounded-lg border-l-4 ${note.type === 'info' ? 'border-blue-500' : note.type === 'history' ? 'border-gray-300' : 'border-yellow-500'}`}>
              <div className="mt-1">
                <span className={`material-symbols-outlined filled text-[20px] ${note.type === 'info' ? 'text-blue-500' : note.type === 'history' ? 'text-gray-400' : 'text-yellow-500'}`}>{note.type === 'info' ? 'info' : note.type === 'history' ? 'history' : 'warning'}</span>
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
