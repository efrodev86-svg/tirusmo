import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PartnerReservationDetailProps {
  reservationId: string;
  onBack: () => void;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortId(uuid: string): string {
  if (!uuid) return '—';
  const part = uuid.split('-')[0] || uuid;
  return part.length >= 8 ? part.slice(0, 8).toUpperCase() : part.toUpperCase();
}

/** Teléfono para enlace WhatsApp: solo dígitos con código de país */
function phoneToWhatsApp(phone: string | null | undefined, lada?: string): string | null {
  if (!phone || !phone.trim()) return null;
  const digits = (phone.replace(/\D/g, '') || '').trim();
  const ladaDigits = (lada || '').replace(/\D/g, '');
  const full = ladaDigits.length >= 2 ? ladaDigits + digits.slice(-10) : digits.length >= 10 ? '52' + digits.slice(-10) : null;
  return full ? `https://wa.me/${full}` : null;
}

const statusLabel: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CHECKOUT: 'Check-out',
  CANCELADA: 'Cancelada',
};

const CUSTOMER_JOURNEY_STEPS = [
  { key: 'reserva', label: 'Reserva', icon: 'receipt_long' },
  { key: 'pago', label: 'Pago', icon: 'payments' },
  { key: 'preparar', label: 'Preparar habitación', icon: 'bed' },
  { key: 'checkin', label: 'Check-in', icon: 'login' },
  { key: 'checkout', label: 'Check-out', icon: 'logout' },
] as const;

function getStepCompleted(
  stepKey: (typeof CUSTOMER_JOURNEY_STEPS)[number]['key'],
  res: {
    status: string;
    amountPaid: number;
    total: number;
    checkInRaw?: string;
    checkOutRaw?: string;
  }
): boolean {
  if (res.status === 'CANCELADA') return stepKey === 'reserva';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = res.checkInRaw ? new Date(res.checkInRaw) : null;
  const checkOutDate = res.checkOutRaw ? new Date(res.checkOutRaw) : null;
  if (checkInDate) checkInDate.setHours(0, 0, 0, 0);
  if (checkOutDate) checkOutDate.setHours(0, 0, 0, 0);

  const pagoOk = res.amountPaid >= res.total || res.status === 'CONFIRMADA' || res.status === 'CHECKOUT';
  const prepararOk = res.status === 'CONFIRMADA' || res.status === 'CHECKOUT';
  const checkInOk = res.status === 'CHECKOUT' || (checkInDate && today >= checkInDate);
  const checkOutOk = res.status === 'CHECKOUT';

  switch (stepKey) {
    case 'reserva': return true;
    case 'pago': return pagoOk;
    case 'preparar': return prepararOk;
    case 'checkin': return checkInOk;
    case 'checkout': return checkOutOk;
    default: return false;
  }
}

function getCustomerJourneyStepStatus(
  stepKey: (typeof CUSTOMER_JOURNEY_STEPS)[number]['key'],
  res: Parameters<typeof getStepCompleted>[1],
  stepIndex: number
): 'completed' | 'current' | 'pending' {
  const completed = getStepCompleted(stepKey, res);
  if (completed) return 'completed';
  const isFirstPending = CUSTOMER_JOURNEY_STEPS.findIndex((s) => !getStepCompleted(s.key, res)) === stepIndex;
  return isFirstPending ? 'current' : 'pending';
}

export const PartnerReservationDetail: React.FC<PartnerReservationDetailProps> = ({ reservationId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<{
    id: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestImg: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    total: number;
    amountPaid: number;
    status: string;
    createdAt: string;
    checkInRaw?: string;
    checkOutRaw?: string;
    paymentMethod?: string;
    mealPlan?: string;
    specialRequest?: string;
    hotelPhone?: string;
    whatsappUrl: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('reservations')
          .select('id, user_id, hotel_id, room_id, check_in, check_out, total, amount_paid, status, guests, created_at, data, hotels(name, location, phone), rooms(name)')
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
        const hotel = r.hotels as { name?: string; location?: string; phone?: string } | null;
        const room = r.rooms as { name?: string } | null;
        const checkIn = String(r.check_in || '');
        const checkOut = String(r.check_out || '');
        const nights = r.check_in && r.check_out
          ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        let guestName = 'Sin nombre';
        let guestEmail = '—';
        let guestPhone = '';
        let guestPhoneLada = '';
        const guestData = (r.data as {
          guest_first_name?: string;
          guest_last_name?: string;
          guest_email?: string;
          guest_phone?: string;
          guest_phone_lada?: string;
          payment_method?: string;
          meal_plan?: string;
          special_request?: string;
        } | null) || null;

        if (guestData) {
          guestName = [guestData.guest_first_name, guestData.guest_last_name].filter(Boolean).join(' ').trim() || guestName;
          guestEmail = (guestData.guest_email && guestData.guest_email.trim()) ? guestData.guest_email : guestEmail;
          guestPhone = (guestData.guest_phone && guestData.guest_phone.trim()) ? guestData.guest_phone : '';
          guestPhoneLada = (guestData.guest_phone_lada && guestData.guest_phone_lada.trim()) ? guestData.guest_phone_lada : '+52';
        }

        const userId = r.user_id as string | null;
        if (userId && (guestName === 'Sin nombre' || !guestEmail || guestEmail === '—')) {
          const { data: profileData } = await supabase.from('profiles').select('full_name, email, phone').eq('id', userId).single();
          const p = profileData as { full_name?: string; email?: string; phone?: string } | null;
          if (p) {
            if (guestName === 'Sin nombre') guestName = p.full_name || p.email || guestName;
            if (!guestEmail || guestEmail === '—') guestEmail = p.email || guestEmail;
            if (!guestPhone && p.phone) guestPhone = p.phone;
          }
        }

        const whatsappUrl = phoneToWhatsApp(guestPhone, guestPhoneLada);

        if (!cancelled) {
          setReservation({
            id: String(r.id),
            guestName,
            guestEmail,
            guestPhone: guestPhone ? [guestPhoneLada, guestPhone].filter(Boolean).join(' ').trim() : '—',
            guestImg: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=random`,
            roomName: room?.name || '—',
            checkIn: formatDate(checkIn || null),
            checkOut: formatDate(checkOut || null),
            checkInRaw: checkIn ? checkIn.slice(0, 10) : undefined,
            checkOutRaw: checkOut ? checkOut.slice(0, 10) : undefined,
            nights,
            guests: Number(r.guests) || 1,
            total: Number(r.total) || 0,
            amountPaid: Number(r.amount_paid) || 0,
            status: String(r.status || 'PENDIENTE'),
            createdAt: String(r.created_at || ''),
            paymentMethod: guestData?.payment_method,
            mealPlan: guestData?.meal_plan,
            specialRequest: guestData?.special_request,
            hotelPhone: hotel?.phone && String(hotel.phone).trim() ? String(hotel.phone) : undefined,
            whatsappUrl,
          });
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reservationId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-[#111827]">Reserva</h1>
        </div>
        <div className="p-8 text-center text-gray-500">Cargando reservación...</div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-[#111827]">Reserva</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error || 'No encontrada'}</div>
      </div>
    );
  }

  const res = reservation;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Reserva #{formatShortId(res.id)}</h1>
            <p className="text-sm text-gray-400">Reserva del hotel · Seguimiento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {res.whatsappUrl && (
            <a
              href={res.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
              Enviar mensaje por WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <img src={res.guestImg} className="w-16 h-16 rounded-full object-cover" alt="" />
              <div>
                <h3 className="font-bold text-[#111827] text-lg">{res.guestName}</h3>
                <p className="text-sm text-gray-500">{res.guestEmail}</p>
                {res.guestPhone && res.guestPhone !== '—' && <p className="text-sm text-gray-500">{res.guestPhone}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">DETALLES DE LA ESTANCIA</h4>
            <div className="flex gap-4 mb-5">
              <span className="material-symbols-outlined text-gray-400 mt-1">calendar_today</span>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Check-in / Check-out</p>
                <p className="font-bold text-[#111827] text-sm">{res.checkIn} – {res.checkOut} ({res.nights} noches)</p>
              </div>
            </div>
            <div className="flex gap-4 mb-5">
              <span className="material-symbols-outlined text-gray-400 mt-1">bed</span>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Habitación</p>
                <p className="font-bold text-[#111827] text-sm">{res.roomName}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-gray-400 mt-1">group</span>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Huéspedes</p>
                <p className="font-bold text-[#111827] text-sm">{res.guests} persona(s)</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">PAGO</h4>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-[#111827]">${res.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Pagado</span>
              <span className="font-bold text-green-600">${res.amountPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            {res.paymentMethod && (
              <p className="text-xs text-gray-400 mt-2">Método: {res.paymentMethod}</p>
            )}
            {res.mealPlan && (
              <p className="text-xs text-gray-400 mt-1">Plan: {res.mealPlan}</p>
            )}
          </div>

          {res.specialRequest && res.specialRequest.trim() && (
            <div className="bg-[#FFF7ED] p-6 rounded-2xl border border-[#FFEDD5]">
              <div className="flex items-center gap-2 mb-2 text-[#C2410C]">
                <span className="material-symbols-outlined text-[20px] filled">exclamation</span>
                <h4 className="font-bold text-sm uppercase">Peticiones especiales</h4>
              </div>
              <p className="text-sm text-[#9A3412] italic leading-relaxed">{res.specialRequest}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Customer Journey - 5 etapas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-[#111827]">Customer Journey</h3>
                <p className="text-xs text-gray-500">Las cinco etapas del viaje del huésped</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                res.status === 'CONFIRMADA' ? 'bg-green-100 text-green-700 border border-green-200' :
                res.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                res.status === 'CHECKOUT' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                res.status === 'CANCELADA' ? 'bg-red-100 text-red-700 border border-red-200' :
                'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                {statusLabel[res.status] || res.status}
              </span>
            </div>
            <div className="p-6 relative">
              <div className="absolute left-[31px] top-10 bottom-10 w-0.5 bg-gray-100" aria-hidden />
              <ul className="flex flex-col gap-0">
                {CUSTOMER_JOURNEY_STEPS.map((step, index) => {
                  const stepStatus = getCustomerJourneyStepStatus(step.key, res, index);
                  return (
                    <li key={step.key} className="relative flex gap-5 pb-10 last:pb-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          stepStatus === 'completed'
                            ? 'bg-[#10B981] text-white'
                            : stepStatus === 'current'
                              ? 'bg-[#1E3A8A] text-white ring-4 ring-blue-100'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {stepStatus === 'completed' ? 'check' : step.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className={`font-bold text-sm ${stepStatus === 'pending' ? 'text-gray-400' : 'text-[#111827]'}`}>
                          {step.label}
                        </p>
                        {stepStatus === 'completed' && (
                          <p className="text-xs text-gray-500 mt-0.5">Completado</p>
                        )}
                        {stepStatus === 'current' && (
                          <p className="text-xs text-[#1E3A8A] font-medium mt-0.5">En curso</p>
                        )}
                        {stepStatus === 'pending' && (
                          <p className="text-xs text-gray-400 mt-0.5">Pendiente</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contacto y seguimiento</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p>Reserva creada el <span className="font-medium text-[#111827]">{formatDate(res.createdAt)}</span>.</p>
                {res.hotelPhone && (
                  <p>Teléfono del hotel: <span className="font-medium text-[#111827]">{res.hotelPhone}</span></p>
                )}
                {res.whatsappUrl && (
                  <p>Use el botón <strong>Enviar mensaje por WhatsApp</strong> para contactar al huésped.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Resumen</h4>
            <p className="text-sm text-gray-600">
              {res.guestName} tiene una reservación de <strong>{res.nights} noche(s)</strong> en <strong>{res.roomName}</strong>,
              del {res.checkIn} al {res.checkOut}. Total: <strong>${res.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
              {res.amountPaid > 0 && <> (pagado: ${res.amountPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })})</>}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
