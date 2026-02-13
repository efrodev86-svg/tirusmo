import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminReservationDetailProps {
  reservationId: string;
  onBack: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
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
  amountPaid: number;
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

function formatNoteTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

// --- Customer Journey (solo datos actuales: created_at, check_in, check_out, status) ---
function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const JOURNEY_STEPS: { key: string; label: string }[] = [
  { key: 'RESERVA', label: 'Reserva' },
  { key: 'PAGO', label: 'Pago' },
  { key: 'CHECK_IN', label: 'Check-in' },
  { key: 'CHECKOUT', label: 'Checkout' },
];

function getJourneyCurrentStepIndex(createdAt: string, checkIn: string, checkOut: string, status: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ci = checkIn ? new Date(checkIn) : null;
  const co = checkOut ? new Date(checkOut) : null;
  if (ci) ci.setHours(0, 0, 0, 0);
  if (co) co.setHours(0, 0, 0, 0);

  if (status === 'CANCELADA') return 0;
  if (status === 'CHECKOUT' || (co && today > co)) return 3;
  if (ci && today >= ci) return 2; // ya pasó check-in → estamos en Check-in (o camino a Checkout)
  if (status !== 'PENDIENTE') return 2; // pago hecho, siguiente paso es Check-in
  return 1; // pendiente de pago
}

function getJourneyStepSubtitle(
  stepIndex: number,
  createdAt: string,
  checkIn: string,
  checkOut: string,
  currentStepIndex: number,
  status: string
): string {
  if (status === 'CANCELADA' && stepIndex > 0) return '—';
  switch (stepIndex) {
    case 0:
      return formatDateTime(createdAt);
    case 1:
      return status === 'PENDIENTE' ? 'Pendiente' : formatDateTime(createdAt);
    case 2: {
      if (currentStepIndex !== 2) return checkIn ? formatDate(checkIn) : '—';
      const ci = checkIn ? new Date(checkIn) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (ci) ci.setHours(0, 0, 0, 0);
      return ci && today >= ci ? 'En progreso' : checkIn ? `Previsto ${formatDate(checkIn)}` : '—';
    }
    case 3:
      return currentStepIndex === 3 ? (status === 'CHECKOUT' ? 'Completado' : 'En progreso') : checkOut ? `Previsto ${formatDate(checkOut)}, 11:00` : '—';
    default:
      return '—';
  }
}

export const AdminReservationDetail: React.FC<AdminReservationDetailProps> = ({ reservationId, onBack }) => {
  const [reservation, setReservation] = useState<ReservationData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'info' | 'history' | 'warning'>('info');
  const [savingNote, setSavingNote] = useState(false);

  const [showRegisterPayment, setShowRegisterPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'anticipo' | 'abono' | 'pago_final'>('anticipo');
  const [savingPayment, setSavingPayment] = useState(false);

  type PaymentRecord = { id: string; amount: number; paid_at: string; type: string };
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPaymentHistoryLoading(true);
      const { data, error: err } = await supabase
        .from('reservation_payments')
        .select('id, amount, paid_at, type')
        .eq('reservation_id', reservationId)
        .order('paid_at', { ascending: false });
      if (cancelled) return;
      if (!err && data) {
        setPaymentHistory(data.map((r: { id: string; amount: number; paid_at: string; type: string }) => ({
          id: r.id,
          amount: Number(r.amount),
          paid_at: r.paid_at,
          type: r.type || 'anticipo',
        })));
      } else {
        setPaymentHistory([]);
      }
      setPaymentHistoryLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reservationId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setNotesLoading(true);
      const { data, error: err } = await supabase
        .from('reservation_notes')
        .select('id, title, content, type, created_at')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (!err && data) {
        setNotes(data.map((r: { id: string; title: string; content: string; type: string; created_at: string }) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          created_at: r.created_at,
          type: (r.type || 'info') as 'info' | 'history' | 'warning',
        })));
      } else {
        setNotes([]);
      }
      setNotesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reservationId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('reservations')
        .select('id, user_id, hotel_id, room_id, check_in, check_out, total, amount_paid, status, guests, created_at, hotels(name, location, image), rooms(name, image)')
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
        amountPaid: Number(r.amount_paid) || 0,
        status: String(r.status || 'PENDIENTE'),
        createdAt: String(r.created_at || ''),
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reservationId]);

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !reservationId) return;
    setSavingNote(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('reservation_notes')
      .insert({
        reservation_id: reservationId,
        author_id: user?.id ?? null,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        type: newNoteType,
      })
      .select('id, title, content, type, created_at')
      .single();
    setSavingNote(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setNotes((prev) => [{
        id: data.id,
        title: data.title,
        content: data.content,
        created_at: data.created_at,
        type: (data.type || 'info') as 'info' | 'history' | 'warning',
      }, ...prev]);
    }
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteType('info');
    setIsAddingNote(false);
  };

  const handleRegisterPayment = async () => {
    if (!reservation || reservation.status === 'CANCELADA') return;
    const value = parseFloat(paymentAmount.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) {
      setError('Ingrese un monto válido.');
      return;
    }
    const newPaid = Math.min(reservation.amountPaid + value, reservation.total);
    const addAmount = newPaid - reservation.amountPaid;
    if (addAmount <= 0) {
      setError('La reservación ya está pagada por completo.');
      return;
    }
    setSavingPayment(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertErr } = await supabase.from('reservation_payments').insert({
      reservation_id: reservationId,
      amount: addAmount,
      paid_at: new Date().toISOString(),
      type: paymentType,
      created_by: user?.id ?? null,
    });
    if (insertErr) {
      setSavingPayment(false);
      setError(insertErr.message);
      return;
    }
    const updates: { amount_paid: number; status?: string } = { amount_paid: newPaid };
    if (newPaid >= reservation.total) updates.status = 'CONFIRMADA';
    const { error: updateErr } = await supabase.from('reservations').update(updates).eq('id', reservationId);
    setSavingPayment(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setReservation((prev) => prev ? { ...prev, amountPaid: newPaid, status: updates.status ?? prev.status } : null);
    setPaymentAmount('');
    setPaymentType('anticipo');
    setShowRegisterPayment(false);
    const { data: payments } = await supabase.from('reservation_payments').select('id, amount, paid_at, type').eq('reservation_id', reservationId).order('paid_at', { ascending: false });
    if (payments) setPaymentHistory(payments.map((r: PaymentRecord) => ({ ...r, amount: Number(r.amount) })));
  };

  const handleConfirmReservation = async () => {
    if (!reservation || reservation.status !== 'PENDIENTE') return;
    if (!window.confirm('¿Marcar esta reservación como Confirmada? El huésped podrá verla como confirmada.')) return;
    setUpdatingStatus(true);
    const { error: err } = await supabase.from('reservations').update({ status: 'CONFIRMADA' }).eq('id', reservationId);
    setUpdatingStatus(false);
    if (err) {
      setError(err.message);
      return;
    }
    setReservation((prev) => prev ? { ...prev, status: 'CONFIRMADA' } : null);
  };

  const handleCheckoutReservation = async () => {
    if (!reservation || reservation.status !== 'CONFIRMADA') return;
    if (!window.confirm('¿Marcar esta reservación como Checkout? Indica que el huésped ya realizó la salida.')) return;
    setUpdatingStatus(true);
    const { error: err } = await supabase.from('reservations').update({ status: 'CHECKOUT' }).eq('id', reservationId);
    setUpdatingStatus(false);
    if (err) {
      setError(err.message);
      return;
    }
    setReservation((prev) => prev ? { ...prev, status: 'CHECKOUT' } : null);
  };

  const handleCancelReservation = async () => {
    if (!reservation || reservation.status === 'CANCELADA') return;
    const confirmed = window.confirm(
      '¿Está seguro de que desea cancelar esta reservación?\n\nLa reservación pasará a estado "Cancelada" y no podrá deshacerse.'
    );
    if (!confirmed) return;
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
      {/* Breadcrumb: Reservaciones > Detalle */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <button type="button" onClick={onBack} className="hover:text-primary font-medium transition-colors">
          Reservaciones
        </button>
        <span className="material-symbols-outlined text-[16px] text-gray-300">chevron_right</span>
        <span className="font-medium text-[#111827]">Detalle #{reservation.id.slice(0, 8)}</span>
      </nav>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors" title="Volver a reservaciones">
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
          {reservation.status === 'PENDIENTE' && (
            <button type="button" onClick={handleConfirmReservation} disabled={updatingStatus} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> {updatingStatus ? 'Guardando...' : 'Confirmar reserva'}
            </button>
          )}
          {reservation.status === 'CONFIRMADA' && (
            <button type="button" onClick={handleCheckoutReservation} disabled={updatingStatus} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">logout</span> {updatingStatus ? 'Guardando...' : 'Marcar como checkout'}
            </button>
          )}
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span> Emitir Factura
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span> Modificar Fechas
          </button>
          {reservation.status !== 'CANCELADA' && reservation.status !== 'CHECKOUT' && (
            <button type="button" onClick={handleCancelReservation} disabled={cancelling} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">cancel</span> {cancelling ? 'Cancelando...' : 'Cancelar Reserva'}
            </button>
          )}
        </div>
      </div>

      {/* Customer Journey */}
      {(() => {
        const currentStepIndex = getJourneyCurrentStepIndex(reservation.createdAt, reservation.checkIn, reservation.checkOut, reservation.status);
        const currentLabel = JOURNEY_STEPS[currentStepIndex]?.label ?? '—';
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h3 className="font-bold text-lg text-[#111827]">Customer Journey</h3>
              <span className="text-sm font-medium text-primary">Estado actual: {reservation.status === 'CANCELADA' ? 'Cancelada' : currentLabel}</span>
            </div>
            <div className="flex items-start gap-0 overflow-x-auto pb-4 w-full justify-between">
              {JOURNEY_STEPS.map((step, index) => {
                const isCompleted =
                  index < currentStepIndex || (index === currentStepIndex && reservation.status === 'CHECKOUT');
                const isCurrent = index === currentStepIndex && reservation.status !== 'CANCELADA';
                const isPending = !isCompleted && !isCurrent;
                const lineCompleted = index > 0 && (index <= currentStepIndex || reservation.status === 'CHECKOUT');
                const subtitle = getJourneyStepSubtitle(index, reservation.createdAt, reservation.checkIn, reservation.checkOut, currentStepIndex, reservation.status);
                return (
                  <React.Fragment key={step.key}>
                    {index > 0 && (
                      <div
                        className={`flex-shrink-0 w-6 md:w-10 h-0.5 mt-5 rounded ${lineCompleted ? 'bg-primary' : 'bg-gray-200'}`}
                        style={{ minWidth: 16 }}
                        aria-hidden
                      />
                    )}
                    <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 72 }}>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          isCompleted ? 'bg-primary border-primary' : isCurrent ? 'bg-white border-primary' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-white text-[20px]">check</span>
                        ) : isCurrent ? (
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            {index === 2 ? 'login' : index === 3 ? 'logout' : 'schedule'}
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 text-[18px]">
                            {index === 3 ? 'arrow_forward' : 'radio_button_unchecked'}
                          </span>
                        )}
                      </div>
                      <p className={`mt-2 text-xs font-bold text-center ${isCurrent ? 'text-primary' : isPending ? 'text-gray-400' : 'text-[#111827]'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-500 text-center mt-0.5 max-w-[90px]">{subtitle}</p>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })()}

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
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pagado (anticipo / abonos)</span>
                <span className="font-bold text-[#111827]">{formatCurrency(reservation.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo pendiente</span>
                <span className={`font-bold ${reservation.total - reservation.amountPaid <= 0 ? 'text-green-600' : 'text-[#111827]'}`}>
                  {reservation.total - reservation.amountPaid <= 0 ? 'Pagado' : formatCurrency(reservation.total - reservation.amountPaid)}
                </span>
              </div>
              <div className="h-px bg-gray-100 border-t border-dashed border-gray-300 my-2" />
              <div className="flex justify-between items-end">
                <span className="font-bold text-lg text-[#111827]">Total</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(reservation.total)}</span>
              </div>
            </div>
            {reservation.status !== 'CANCELADA' && reservation.amountPaid < reservation.total && (
              <>
                {!showRegisterPayment ? (
                  <button type="button" onClick={() => setShowRegisterPayment(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-primary text-primary font-bold text-sm hover:bg-blue-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span> Registrar anticipo / pago
                  </button>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    <label className="block text-xs font-bold text-gray-700">Tipo de pago</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as 'anticipo' | 'abono' | 'pago_final')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
                      <option value="anticipo">Anticipo</option>
                      <option value="abono">Abono</option>
                      <option value="pago_final">Pago final</option>
                    </select>
                    <label className="block text-xs font-bold text-gray-700">Monto a registrar</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej. 500"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500">Máximo a registrar: {formatCurrency(reservation.total - reservation.amountPaid)}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowRegisterPayment(false); setPaymentAmount(''); setPaymentType('anticipo'); setError(null); }} className="flex-1 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-100">Cancelar</button>
                      <button type="button" onClick={handleRegisterPayment} disabled={savingPayment || !paymentAmount.trim()} className="flex-1 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        {savingPayment ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Historial de pagos</h4>
              {paymentHistoryLoading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : paymentHistory.length === 0 ? (
                <p className="text-sm text-gray-500">Sin pagos registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {paymentHistory.map((p) => (
                    <li key={p.id} className="flex justify-between items-center gap-2 text-sm py-1.5 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="text-gray-600 block">{new Date(p.paid_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{p.type === 'pago_final' ? 'Pago final' : p.type}</span>
                      </div>
                      <span className="font-bold text-[#111827]">{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mt-4">
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
            <div className="mb-3">
              <label className="text-xs font-bold text-gray-600 block mb-1">Tipo</label>
              <select value={newNoteType} onChange={(e) => setNewNoteType(e.target.value as 'info' | 'history' | 'warning')} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary">
                <option value="info">Info</option>
                <option value="history">Historial</option>
                <option value="warning">Aviso</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setIsAddingNote(false); setNewNoteTitle(''); setNewNoteContent(''); setNewNoteType('info'); }} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">Cancelar</button>
              <button type="button" onClick={() => handleSaveNote()} disabled={!newNoteTitle.trim() || !newNoteContent.trim() || savingNote} className="px-4 py-1.5 text-sm font-bold bg-primary text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {savingNote ? 'Guardando...' : 'Guardar Nota'}
              </button>
            </div>
          </div>
        )}
        {notesLoading ? (
          <p className="text-sm text-gray-500">Cargando notas...</p>
        ) : (
        <div className="flex flex-col gap-4">
          {notes.length === 0 && !isAddingNote ? (
            <p className="text-sm text-gray-500">No hay notas. Añade una para dejar registro interno de esta reservación.</p>
          ) : (
          notes.map((note) => (
            <div key={note.id} className={`flex gap-4 p-4 bg-gray-50/50 rounded-lg border-l-4 ${note.type === 'info' ? 'border-blue-500' : note.type === 'history' ? 'border-gray-300' : 'border-yellow-500'}`}>
              <div className="mt-1">
                <span className={`material-symbols-outlined filled text-[20px] ${note.type === 'info' ? 'text-blue-500' : note.type === 'history' ? 'text-gray-400' : 'text-yellow-500'}`}>{note.type === 'info' ? 'info' : note.type === 'history' ? 'history' : 'warning'}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-bold text-sm text-[#111827]">{note.title}</h4>
                  <span className="text-[10px] text-gray-400">{formatNoteTimestamp(note.created_at)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{note.content}</p>
              </div>
            </div>
          ))
          )}
        </div>
        )}
      </div>
    </div>
  );
};
