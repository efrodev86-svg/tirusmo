import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Hotel, SearchParams, BookingStep, GuestDetails } from '../types';
import { TermsAndConditions } from './TermsAndConditions';
import { supabase } from '../lib/supabase';

const STICKY_TOP_PX = 24;

const formatCantidad = (n: number): string =>
  n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LADA_COUNTRIES: { code: string; flag: string; name: string }[] = [
  { code: '+52', flag: '🇲🇽', name: 'México' },
  { code: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: '+34', flag: '🇪🇸', name: 'España' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+53', flag: '🇨🇺', name: 'Cuba' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', flag: '🇵🇦', name: 'Panamá' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+49', flag: '🇩🇪', name: 'Alemania' },
  { code: '+33', flag: '🇫🇷', name: 'Francia' },
  { code: '+39', flag: '🇮🇹', name: 'Italia' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil' },
];

type RoomOption = { id: number; name: string; type: string; price: number; image: string; amenities: string[] };

interface BookingWizardProps {
  hotel: Hotel;
  searchParams: SearchParams;
  onBack: () => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ hotel, searchParams, onBack }) => {
  const [step, setStep] = useState<BookingStep>(BookingStep.SELECTION);
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: ""
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<'desayuno' | 'todo_incluido' | 'sin_plan' | null>(null);
  const [hotelRooms, setHotelRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const priceColumnRef = useRef<HTMLDivElement>(null);
  const priceSentinelRef = useRef<HTMLDivElement>(null);
  const priceCardRef = useRef<HTMLDivElement>(null);
  const [priceStickyStyle, setPriceStickyStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const [pricePlaceholderHeight, setPricePlaceholderHeight] = useState<number | null>(null);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [phoneLada, setPhoneLada] = useState('+52');
  const [ladaOpen, setLadaOpen] = useState(false);
  const ladaInputRef = useRef<HTMLInputElement>(null);
  type PaymentMethodType = 'card' | 'paypal' | 'openpay' | 'stripe' | 'transfer';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [savingReservation, setSavingReservation] = useState(false);
  const [reservationError, setReservationError] = useState('');
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [wasGuestReservation, setWasGuestReservation] = useState(false);

  useEffect(() => {
    if (!hotel?.id) return;
    let cancelled = false;
    setLoadingRooms(true);
    supabase
      .from('rooms')
      .select('id, name, type, price, image, amenities')
      .eq('hotel_id', hotel.id)
      .eq('status', 'DISPONIBLE')
      .order('price')
      .then(({ data }) => {
        if (cancelled) return;
        const list: RoomOption[] = (data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as number,
          name: (r.name as string) || 'Habitación',
          type: (r.type as string) || '',
          price: Number(r.price) || 0,
          image: (r.image as string) || '',
          amenities: Array.isArray(r.amenities) ? (r.amenities as string[]) : [],
        }));
        setHotelRooms(list);
        setSelectedRoomId(list.length > 0 ? list[0].id : null);
      })
      .finally(() => { if (!cancelled) setLoadingRooms(false); });
    return () => { cancelled = true; };
  }, [hotel?.id]);

  // Si la sesión está iniciada, llenar nombre, apellidos y correo al entrar al paso Datos
  useEffect(() => {
    if (step !== BookingStep.DETAILS) return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .maybeSingle();
      const email = profile?.email ?? session.user.email ?? '';
      const fullName = (profile?.full_name as string) ?? session.user.user_metadata?.full_name ?? '';
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ') ?? '';
      if (!cancelled && (firstName || lastName || email)) {
        setGuestDetails((prev) => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: email || prev.email,
        }));
      }
    })();
    return () => { cancelled = true; };
  }, [step]);

  const selectedRoom = hotelRooms.find((r) => r.id === selectedRoomId);
  const roomPrice = selectedRoom?.price ?? hotel.price;

  const selectedPlanItem = selectedMealPlan ? hotel.meal_plans?.find((p) => p.type === selectedMealPlan) : null;
  const mealPlanCostPerNight = selectedPlanItem?.cost ?? 0;

  // Noches desde fechas de búsqueda
  const nights = (() => {
    const ci = searchParams.checkIn?.trim();
    const co = searchParams.checkOut?.trim();
    if (!ci || !co) return 1;
    const d1 = new Date(ci);
    const d2 = new Date(co);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 1;
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  })();

  // Calculate Totals
  const roomTotal = nights * roomPrice;
  const mealPlanTotalForStay = mealPlanCostPerNight * nights;
  const subtotalBeforeTax = roomTotal + mealPlanTotalForStay;
  const taxes = subtotalBeforeTax * 0.16;
  const service = 41;
  const total = subtotalBeforeTax + taxes + service;

  // Revisión de Reserva (step 1): desglose de precios siempre visible al hacer scroll
  useEffect(() => {
    if (step !== BookingStep.SELECTION) {
      setPriceStickyStyle(null);
      setPricePlaceholderHeight(null);
      return;
    }
    const isLg = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    const updateSticky = () => {
      if (!isLg() || !priceColumnRef.current || !priceCardRef.current || !priceSentinelRef.current) {
        setPriceStickyStyle(null);
        setPricePlaceholderHeight(null);
        return;
      }
      const sentinelTop = priceSentinelRef.current.getBoundingClientRect().top;
      const colRect = priceColumnRef.current.getBoundingClientRect();
      const cardRect = priceCardRef.current.getBoundingClientRect();
      if (sentinelTop <= STICKY_TOP_PX) {
        setPriceStickyStyle({ top: STICKY_TOP_PX, left: colRect.left, width: colRect.width });
        setPricePlaceholderHeight(cardRect.height);
      } else {
        setPriceStickyStyle(null);
        setPricePlaceholderHeight(null);
      }
    };
    updateSticky();
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky);
    return () => {
      window.removeEventListener('scroll', updateSticky);
      window.removeEventListener('resize', updateSticky);
    };
  }, [step, roomPrice, roomTotal, total, nights]);

  // Validation
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const fullPhoneDigits = () => (phoneLada.replace(/\D/g, '') + (guestDetails.phone || '').replace(/\D/g, ''));
  const isValidPhone = () => fullPhoneDigits().length >= 10;

  const normalizeLada = (v: string) => (v.trim().startsWith('+') ? v.trim() : '+' + v.trim().replace(/\D/g, ''));
  const currentLadaCountry = () =>
    LADA_COUNTRIES.find((c) => c.code === phoneLada) ??
    LADA_COUNTRIES.find((c) => c.code === normalizeLada(phoneLada)) ??
    (phoneLada && phoneLada !== '+' ? LADA_COUNTRIES.find((c) => c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))) : null);
  const currentFlag = () => currentLadaCountry()?.flag ?? '🌐';

  const validateGuestDetails = (): boolean => {
    const { firstName, lastName, email, phone } = guestDetails;
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPhoneError('');
    setFormErrorMessage('');
    let hasError = false;
    if (!firstName?.trim()) {
      setFirstNameError('Campo obligatorio');
      hasError = true;
    }
    if (!lastName?.trim()) {
      setLastNameError('Campo obligatorio');
      hasError = true;
    }
    if (!email?.trim()) {
      setEmailError('Correo no válido');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Correo no válido');
      hasError = true;
    }
    if (!phone?.trim()) {
      setPhoneError('Teléfono no válido');
      hasError = true;
    } else if (!isValidPhone()) {
      setPhoneError('Teléfono no válido');
      hasError = true;
    }
    if (hasError) {
      setFormErrorMessage('Por favor complete todos los campos obligatorios correctamente.');
      return false;
    }
    return true;
  };

  /**
   * Lógica de reserva como invitado (sin cuenta ni sesión):
   * - Si hay sesión: user_id = session.user.id (reserva ligada al usuario).
   * - Si NO hay sesión: user_id = null → reserva como invitado; los datos del huésped
   *   se guardan en data (guest_first_name, guest_last_name, guest_email, guest_phone, etc.).
   * - La política RLS "Cualquiera puede crear reservación" permite INSERT con user_id null.
   * - El invitado no tiene "Mis reservas" hasta que cree cuenta con el mismo email (flujo futuro).
   */
  const handlePagarYConfirmar = async () => {
    if (!termsAccepted) return;
    setReservationError('');
    setSavingReservation(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isGuest = !session?.user;
      setWasGuestReservation(isGuest);

      const checkIn = searchParams.checkIn?.trim() || new Date().toISOString().slice(0, 10);
      const checkOut = searchParams.checkOut?.trim() || checkIn;
      const guestCount = Math.max(1, (searchParams.guests?.adults ?? 1) + (searchParams.guests?.children ?? 0));
      const roomId = selectedRoomId ?? hotelRooms[0]?.id;
      if (!roomId) {
        setReservationError('No hay habitación seleccionada.');
        setSavingReservation(false);
        return;
      }
      const dataPayload = {
          guest_first_name: guestDetails.firstName?.trim() || '',
          guest_last_name: guestDetails.lastName?.trim() || '',
          guest_email: guestDetails.email?.trim() || '',
          guest_phone: guestDetails.phone?.trim() || '',
          guest_phone_lada: phoneLada || '+52',
          special_requests: guestDetails.specialRequests?.trim() || '',
          payment_method: paymentMethod,
          rooms: searchParams.guests?.rooms ?? 1,
          meal_plan: selectedMealPlan ?? 'sin_plan',
        };
      let insertedId: string | null = null;

      if (isGuest) {
        // Invitado: usar RPC que bypasea RLS (evita error "new row violates row-level security policy")
        const { data: rpcId, error: rpcError } = await supabase.rpc('insert_reservation_guest', {
          p_user_id: null,
          p_hotel_id: hotel.id,
          p_room_id: roomId,
          p_check_in: checkIn,
          p_check_out: checkOut,
          p_total: Number(total.toFixed(2)),
          p_guests: guestCount,
          p_data: dataPayload,
        });
        if (rpcError) {
          setReservationError(rpcError.message || 'No se pudo guardar la reserva. Intenta de nuevo.');
          setSavingReservation(false);
          return;
        }
        insertedId = typeof rpcId === 'string' ? rpcId : rpcId ?? null;
      } else {
        const payload = {
          user_id: session?.user?.id ?? null,
          hotel_id: hotel.id,
          room_id: roomId,
          check_in: checkIn,
          check_out: checkOut,
          total: Number(total.toFixed(2)),
          status: 'PENDIENTE',
          guests: guestCount,
          amount_paid: 0,
          data: dataPayload,
        };
        const { data: inserted, error: insertError } = await supabase
          .from('reservations')
          .insert(payload)
          .select('id')
          .single();
        if (insertError) {
          setReservationError(insertError.message || 'No se pudo guardar la reserva. Intenta de nuevo.');
          setSavingReservation(false);
          return;
        }
        insertedId = inserted?.id ?? null;
      }

      if (insertedId) {
        setReservationId(insertedId);
        setStep(BookingStep.CONFIRMATION);
      } else {
        setReservationError('No se recibió confirmación. Intenta de nuevo.');
      }
    } catch (e) {
      setReservationError(e instanceof Error ? e.message : 'Error al guardar la reserva.');
    } finally {
      setSavingReservation(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex flex-col gap-3 mb-8 w-full max-w-[800px] mx-auto">
      <div className="flex justify-between items-center text-sm font-medium text-[#617289] dark:text-gray-400">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <span className={`${step === s ? 'text-primary font-bold scale-105' : step > s ? 'text-green-600 dark:text-green-500 font-semibold flex items-center gap-1' : ''}`}>
              {step > s && <span className="material-symbols-outlined text-lg filled">check_circle</span>}
              {s === 1 ? 'Selección' : s === 2 ? 'Datos' : s === 3 ? 'Pago' : 'Confirmación'}
            </span>
            {s < 4 && <span className="material-symbols-outlined text-xs">chevron_right</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="h-2 w-full rounded-full bg-[#dbe0e6] dark:bg-gray-700 overflow-hidden">
        <div 
            className="h-full bg-primary rounded-full transition-all duration-500" 
            style={{width: `${(step / 4) * 100}%`}}
        ></div>
      </div>
    </div>
  );

  const renderSelectionStep = () => (
    <>
    <div className="mb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Volver a resultados
      </button>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start overflow-visible">
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] overflow-hidden shadow-sm">
                <div className="relative h-64 md:h-80 w-full group">
                    <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: `url("${hotel.image}")`}}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 text-white">
                        <h2 className="text-3xl font-bold leading-tight mb-2 drop-shadow-md">{hotel.name}</h2>
                        <div className="flex items-center gap-3 text-sm font-medium">
                            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded">
                                <span className="material-symbols-outlined text-yellow-400 text-sm filled">star</span> {hotel.rating} Estrellas
                            </span>
                            <span className="flex items-center gap-1 drop-shadow-md">
                                <span className="material-symbols-outlined text-white text-sm">location_on</span> {hotel.location}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-background-light dark:bg-[#101822] border border-gray-100 dark:border-[#2a3441]">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Check-in</span>
                            <div className="flex items-center gap-2.5 mt-1">
                                <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                                <div>
                                    <p className="font-bold text-[#111418] dark:text-white">{searchParams.checkIn}</p>
                                    <p className="text-xs text-gray-500">15:00</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-background-light dark:bg-[#101822] border border-gray-100 dark:border-[#2a3441]">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Check-out</span>
                            <div className="flex items-center gap-2.5 mt-1">
                                <span className="material-symbols-outlined text-lg text-primary">event</span>
                                <div>
                                    <p className="font-bold text-[#111418] dark:text-white">{searchParams.checkOut}</p>
                                    <p className="text-xs text-gray-500">12:00</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-background-light dark:bg-[#101822] border border-gray-100 dark:border-[#2a3441]">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Huéspedes</span>
                            <div className="flex items-center gap-2.5 mt-1">
                                <span className="material-symbols-outlined text-lg text-primary">group</span>
                                <div>
                                    <p className="font-bold text-[#111418] dark:text-white">
                                      {searchParams.guests.adults} Adultos
                                      {searchParams.guests.children > 0 && `, ${searchParams.guests.children} Niños`}
                                    </p>
                                    <p className="text-xs text-gray-500">{searchParams.guests.rooms} Habitación(es)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Amenidades, Pet friendly, Planes — debajo de check-in */}
                    <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-background-light dark:bg-[#101822] border border-gray-100 dark:border-[#2a3441]">
                        {(hotel.amenities && hotel.amenities.length > 0) && (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amenidades</span>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#111418] dark:text-gray-300">
                                    {hotel.amenities.map((a) => (
                                        <span key={a} className="inline-flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                                            {a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pet friendly</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-[#2a3441] text-sm ${hotel.pet_friendly ? 'text-[#111418] dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                                <span className={`material-symbols-outlined text-[16px] ${hotel.pet_friendly ? 'text-primary' : 'text-gray-400'}`}>pets</span>
                                {hotel.pet_friendly ? 'Sí' : 'No'}
                            </span>
                        </div>
                    </div>
                    {/* Plan de alimentos: opciones que ofrece el hotel + Sin plan */}
                    {(() => {
                        const planTypes = new Set<string>(hotel.meal_plans?.map((p) => p.type) ?? []);
                        planTypes.add('sin_plan');
                        const options = Array.from(planTypes).map((type) => {
                            const plan = hotel.meal_plans?.find((p) => p.type === type);
                            const label = type === 'desayuno' ? 'Desayuno' : type === 'todo_incluido' ? 'Todo incluido' : 'Sin plan de alimentos';
                            const cost = plan?.cost ?? 0;
                            return { type: type as 'desayuno' | 'todo_incluido' | 'sin_plan', label, cost };
                        });
                        const current = selectedMealPlan ?? (options.some((o) => o.type === 'sin_plan') ? 'sin_plan' : options[0]?.type ?? null);
                        return (
                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-3">Plan de alimentos</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Elige el plan que ofrece el hotel (si aplica).</p>
                                <div className="flex flex-wrap gap-3">
                                    {options.map((opt) => {
                                        const isSelected = current === opt.type;
                                        return (
                                            <button
                                                key={opt.type}
                                                type="button"
                                                onClick={() => setSelectedMealPlan(opt.type)}
                                                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                                                    isSelected
                                                        ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:border-primary dark:text-primary'
                                                        : 'bg-white dark:bg-[#1a222d] border-gray-200 dark:border-[#2a3441] text-[#111418] dark:text-gray-300 hover:border-primary/50'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">restaurant</span>
                                                {opt.label}
                                                {opt.cost > 0 && <span className="text-gray-500 dark:text-gray-400">+${opt.cost}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                    {/* Habitaciones: selección de habitación del hotel */}
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-3">Habitaciones</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Elige la habitación para tu estancia.</p>
                        {loadingRooms ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando habitaciones...</p>
                        ) : hotelRooms.length === 0 ? (
                            <div className="p-4 rounded-xl bg-background-light dark:bg-[#101822] border border-gray-100 dark:border-[#2a3441] text-sm text-gray-500 dark:text-gray-400">
                                No hay habitaciones disponibles en este momento. El total se calcula con el precio base del hotel.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {hotelRooms.map((room) => {
                                    const isSelected = selectedRoomId === room.id;
                                    return (
                                        <button
                                            key={room.id}
                                            type="button"
                                            onClick={() => setSelectedRoomId(room.id)}
                                            className={`text-left rounded-xl border overflow-hidden transition-all flex flex-row ${
                                                isSelected
                                                    ? 'ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'border-gray-200 dark:border-[#2a3441] bg-white dark:bg-[#1a222d] hover:border-primary/50'
                                            }`}
                                        >
                                            <div className="w-[280px] h-[210px] flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                                {room.image ? (
                                                    <img src={room.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <span className="material-symbols-outlined text-3xl">bed</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 flex-1 min-w-0 flex flex-col justify-center">
                                                <p className="font-bold text-[#111418] dark:text-white truncate">{room.name}</p>
                                                {room.type && <p className="text-xs text-gray-500 dark:text-gray-400">{room.type}</p>}
                                                <p className="text-sm font-semibold text-primary mt-1">${room.price.toFixed(0)} / noche</p>
                                                {room.amenities && room.amenities.length > 0 && (
                                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {room.amenities.slice(0, 5).map((a) => (
                                                      <span key={a} className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
                                                        {a}
                                                      </span>
                                                    ))}
                                                    {room.amenities.length > 5 && (
                                                      <span className="text-[10px] text-gray-400">+{room.amenities.length - 5}</span>
                                                    )}
                                                  </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        <div ref={priceColumnRef} className="lg:col-span-4 overflow-visible relative">
            <div ref={priceSentinelRef} className="absolute top-0 left-0 w-px h-px pointer-events-none" aria-hidden="true" />
            {pricePlaceholderHeight != null && <div style={{ height: pricePlaceholderHeight }} aria-hidden="true" />}
            <div
              ref={priceCardRef}
              className="self-start flex flex-col gap-4 w-full"
              style={priceStickyStyle ? { position: 'fixed', top: priceStickyStyle.top, left: priceStickyStyle.left, width: priceStickyStyle.width, zIndex: 30 } : undefined}
            >
                <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] shadow-lg shadow-gray-200/50 dark:shadow-none p-6">
                    <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Desglose de Precios</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{nights} noches x ${roomPrice.toFixed(0)}</span>
                            <span className="font-medium text-[#111418] dark:text-white">${roomTotal.toFixed(2)}</span>
                        </div>
                        {mealPlanTotalForStay > 0 && (
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Plan de alimentos ({nights} noches)</span>
                            <span className="font-medium text-[#111418] dark:text-white">${mealPlanTotalForStay.toFixed(2)}</span>
                        </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Impuestos (16%)</span>
                            <span className="font-medium text-[#111418] dark:text-white">${taxes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Tarifa servicio</span>
                            <span className="font-medium text-[#111418] dark:text-white">${service.toFixed(2)}</span>
                        </div>
                        <div className="my-4 h-px border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-sm font-medium text-gray-500">Total a pagar</span>
                            <span className="text-3xl font-black text-primary">${formatCantidad(total)}</span>
                        </div>
                        <button onClick={() => setStep(BookingStep.DETAILS)} className="flex w-full items-center justify-center rounded-xl h-14 bg-primary hover:bg-blue-600 text-white text-lg font-bold shadow-lg shadow-blue-200 dark:shadow-none group transition-all">
                            <span>Continuar a Mis Datos</span>
                            <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        {/* Barra fija en móvil: desglose siempre visible al hacer scroll */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-[#1a222d] border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)] px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total a pagar</p>
            <p className="text-xl font-black text-primary">${formatCantidad(total)}</p>
          </div>
          <button onClick={() => setStep(BookingStep.DETAILS)} className="flex-shrink-0 flex items-center justify-center rounded-xl h-12 px-6 bg-primary hover:bg-blue-600 text-white font-bold text-sm shadow-lg group transition-all">
            <span>Continuar</span>
            <span className="material-symbols-outlined ml-1.5 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>
        </div>
        <div className="lg:hidden h-20" aria-hidden="true" />
    </div>
    </>
  );

  const renderGuestDetailsStep = () => (
      <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
              <button
                  type="button"
                  onClick={() => setStep(BookingStep.SELECTION)}
                  className="self-start flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                  <span className="material-symbols-outlined text-lg">arrow_back</span> Volver
              </button>
              <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="material-symbols-outlined text-primary">person</span> Información Personal
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <strong className="text-[#111418] dark:text-white">Reserva como invitado:</strong> no necesitas crear cuenta ni iniciar sesión. Solo llena tus datos y continúa al pago.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      La reservación quedará a nombre de la persona cuyos datos ingreses. Si tienes sesión y quieres reservar a nombre de otra persona, puedes modificar los datos.
                  </p>
                  {formErrorMessage && (
                    <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                      <span className="material-symbols-outlined text-lg shrink-0">error</span>
                      {formErrorMessage}
                    </div>
                  )}
                  <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Nombre(s) *</label>
                              <input 
                                className={`w-full h-11 rounded-lg border px-4 text-sm outline-none focus:ring-1 ${firstNameError ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 dark:border-red-500' : 'border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] focus:border-primary'}`}
                                type="text"
                                value={guestDetails.firstName}
                                onChange={(e) => { setGuestDetails({...guestDetails, firstName: e.target.value}); setFirstNameError(''); setFormErrorMessage(''); }}
                              />
                              {firstNameError && <p className="text-sm text-red-600 dark:text-red-400">{firstNameError}</p>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Apellidos *</label>
                              <input 
                                className={`w-full h-11 rounded-lg border px-4 text-sm outline-none focus:ring-1 ${lastNameError ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 dark:border-red-500' : 'border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] focus:border-primary'}`}
                                type="text"
                                value={guestDetails.lastName}
                                onChange={(e) => { setGuestDetails({...guestDetails, lastName: e.target.value}); setLastNameError(''); setFormErrorMessage(''); }}
                              />
                              {lastNameError && <p className="text-sm text-red-600 dark:text-red-400">{lastNameError}</p>}
                          </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Correo electrónico *</label>
                          <input 
                            className={`w-full h-11 rounded-lg border px-4 text-sm outline-none focus:ring-1 ${emailError ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 dark:border-red-500' : 'border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] focus:border-primary'}`}
                            type="email"
                            value={guestDetails.email}
                            onChange={(e) => { setGuestDetails({...guestDetails, email: e.target.value}); setEmailError(''); setFormErrorMessage(''); }}
                          />
                          {emailError && <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5 relative">
                          <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Teléfono *</label>
                          <div className={`flex rounded-lg border overflow-visible ${phoneError ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-[#dbe0e6] dark:border-[#3a4451]'}`}>
                            <div className="flex items-center bg-gray-100 dark:bg-[#252e3a] border-r border-[#dbe0e6] dark:border-[#3a4451] px-2 min-w-[100px]">
                              <span className="text-2xl mr-2 select-none" title={currentLadaCountry()?.name}>{currentFlag()}</span>
                              <input
                                ref={ladaInputRef}
                                type="text"
                                inputMode="numeric"
                                placeholder="+52"
                                value={phoneLada}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const norm = raw.trim().startsWith('+') ? raw : '+' + raw.replace(/\D/g, '');
                                  setPhoneLada(norm || '+');
                                  setPhoneError('');
                                }}
                                onFocus={() => setLadaOpen(true)}
                                onBlur={() => setTimeout(() => setLadaOpen(false), 200)}
                                className="w-14 bg-transparent text-sm font-medium outline-none text-[#111418] dark:text-white"
                              />
                            </div>
                            {ladaOpen && (
                              <div className="absolute z-50 mt-11 left-0 right-0 lg:right-auto lg:w-80 max-h-56 overflow-auto bg-white dark:bg-[#1a222d] border border-[#e5e7eb] dark:border-[#2a3441] rounded-lg shadow-lg py-1">
                                {LADA_COUNTRIES.filter((c) => !phoneLada || phoneLada === '+' || c.code.replace(/\D/g, '').startsWith(phoneLada.replace(/\D/g, ''))).slice(0, 12).map((c) => (
                                  <button
                                    key={c.code + c.name}
                                    type="button"
                                    onClick={() => { setPhoneLada(c.code); setLadaOpen(false); setPhoneError(''); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252e3a]"
                                  >
                                    <span className="text-xl">{c.flag}</span>
                                    <span className="font-medium text-[#111418] dark:text-white">{c.code}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            <input
                              className={`flex-1 min-w-0 h-11 px-4 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-primary bg-white dark:bg-[#101822] text-[#111418] dark:text-white placeholder:text-gray-400 ${phoneError ? 'placeholder-red-300' : ''}`}
                              type="tel"
                              inputMode="tel"
                              placeholder="Ej. 55 1234 5678"
                              value={guestDetails.phone}
                              onChange={(e) => { setGuestDetails({ ...guestDetails, phone: e.target.value }); setPhoneError(''); setFormErrorMessage(''); }}
                            />
                          </div>
                          {phoneError && <p className="text-sm text-red-600 dark:text-red-400">{phoneError}</p>}
                      </div>
                  </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center gap-4 mt-2">
                  <button 
                    onClick={() => {
                        if (validateGuestDetails()) setStep(BookingStep.PAYMENT);
                    }} 
                    className="flex flex-1 w-full items-center justify-center rounded-xl h-14 px-4 bg-primary hover:bg-blue-600 text-white text-lg font-bold shadow-lg shadow-blue-200 dark:shadow-none group transition-all"
                   >
                      Continuar al Pago
                      <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
              </div>
          </div>
          <div className="lg:col-span-4 overflow-visible">
              <div className="lg:sticky lg:top-24 self-start z-30 w-full">
                <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] shadow-lg shadow-gray-200/50 dark:shadow-none p-6">
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Desglose de Precios</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{nights} noches x ${roomPrice.toFixed(0)}</span>
                      <span className="font-medium text-[#111418] dark:text-white">${roomTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Impuestos (16%)</span>
                      <span className="font-medium text-[#111418] dark:text-white">${taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Tarifa servicio</span>
                      <span className="font-medium text-[#111418] dark:text-white">${service.toFixed(2)}</span>
                    </div>
                    <div className="my-4 h-px border-t border-dashed border-gray-300 dark:border-gray-600" />
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-gray-500">Total a pagar</span>
                      <span className="text-2xl font-black text-primary">${formatCantidad(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
          </div>
      </div>
        {/* Móvil: barra fija con total para ver precios al hacer scroll */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-[#1a222d] border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total a pagar</p>
            <p className="text-xl font-black text-primary">${formatCantidad(total)}</p>
          </div>
        </div>
        <div className="lg:hidden h-16" aria-hidden="true" />
      </div>
  );

  const paymentMethods: { id: PaymentMethodType; label: string; icon: string; shortLabel: string }[] = [
    { id: 'card', label: 'Tarjeta de crédito o débito', icon: 'credit_card', shortLabel: 'Tarjeta' },
    { id: 'paypal', label: 'PayPal', icon: 'account_balance_wallet', shortLabel: 'PayPal' },
    { id: 'openpay', label: 'Open Pay', icon: 'payments', shortLabel: 'Open Pay' },
    { id: 'stripe', label: 'Stripe', icon: 'payment', shortLabel: 'Stripe' },
    { id: 'transfer', label: 'Transferencia o depósito bancario', icon: 'account_balance', shortLabel: 'Transferencia' },
  ];

  const renderPaymentStep = () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
             <button
                type="button"
                onClick={() => setStep(BookingStep.DETAILS)}
                className="self-start flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
             >
                <span className="material-symbols-outlined text-lg">arrow_back</span> Volver a datos
             </button>

             <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">payments</span> Método de pago
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                        paymentMethod === pm.id
                          ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                          : 'border-[#e5e7eb] dark:border-[#2a3441] text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">{pm.icon}</span>
                      <span className="text-center">{pm.shortLabel}</span>
                    </button>
                  ))}
                </div>
             </div>

             {/* Simulación según método elegido */}
             <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#111418] dark:text-white">
                  {paymentMethod === 'card' && <><span className="material-symbols-outlined text-primary">credit_card</span> Tarjeta de crédito o débito</>}
                  {paymentMethod === 'paypal' && <><span className="material-symbols-outlined text-primary">account_balance_wallet</span> PayPal</>}
                  {paymentMethod === 'openpay' && <><span className="material-symbols-outlined text-primary">payments</span> Open Pay</>}
                  {paymentMethod === 'stripe' && <><span className="material-symbols-outlined text-primary">payment</span> Stripe</>}
                  {paymentMethod === 'transfer' && <><span className="material-symbols-outlined text-primary">account_balance</span> Transferencia o depósito bancario</>}
                </h3>

                {paymentMethod === 'card' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Número de tarjeta</label>
                      <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="0000 0000 0000 0000" type="text" inputMode="numeric" maxLength={19} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Nombre como aparece en la tarjeta</label>
                      <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="JUAN PÉREZ" type="text" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Fecha de vencimiento</label>
                        <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="MM/AA" type="text" maxLength={5} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-300">CVV</label>
                        <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="123" type="text" inputMode="numeric" maxLength={4} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">El CVV son los 3 o 4 dígitos en el reverso de tu tarjeta.</p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Serás redirigido a PayPal para completar el pago de forma segura.</p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Correo de tu cuenta PayPal</label>
                      <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="tu@email.com" type="email" />
                    </div>
                    <button type="button" className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-[#003087] bg-[#003087] text-white font-bold text-sm hover:bg-[#004c8c] transition-colors">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.646h6.227c2.02 0 3.597.563 4.655 1.688 1.008 1.068 1.47 2.456 1.47 4.156 0 1.628-.405 2.994-1.21 4.19-.765 1.13-1.89 1.97-3.355 2.51l-1.87 5.54a.642.642 0 0 1-.633.499z"/></svg>
                      Iniciar sesión en PayPal
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Simulación: no se realizará ningún cargo real.</p>
                  </div>
                )}

                {paymentMethod === 'openpay' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Paga con tarjeta o SPEI a través de Open Pay.</p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Número de tarjeta Open Pay</label>
                      <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="0000 0000 0000 0000" type="text" inputMode="numeric" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Nombre del titular</label>
                      <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="Nombre en la tarjeta" type="text" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Vencimiento</label>
                        <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="MM/AA" type="text" maxLength={5} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-300">CVV</label>
                        <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="***" type="text" inputMode="numeric" maxLength={4} />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">O paga con SPEI (transferencia)</p>
                      <button type="button" className="w-full h-11 rounded-lg border-2 border-[#c41e3a] text-[#c41e3a] font-bold text-sm hover:bg-[#c41e3a]/10 transition-colors">Generar referencia SPEI</button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Simulación: no se realizará ningún cargo real.</p>
                  </div>
                )}

                {paymentMethod === 'stripe' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pago seguro procesado por Stripe.</p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Número de tarjeta</label>
                      <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="4242 4242 4242 4242" type="text" inputMode="numeric" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Nombre en la tarjeta</label>
                      <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="Nombre completo" type="text" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-300">MM / AA</label>
                        <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="12/34" type="text" maxLength={5} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-300">CVC</label>
                        <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm" placeholder="123" type="text" inputMode="numeric" maxLength={4} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-base">lock</span>
                      Pago cifrado con Stripe. Usa 4242 4242 4242 4242 para pruebas.
                    </div>
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Realiza el pago por transferencia o depósito y envía tu comprobante. La reserva se confirmará al verificar el pago.</p>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#252e3a] border border-gray-200 dark:border-[#2a3441] space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Banco</span>
                        <span className="font-medium text-[#111418] dark:text-white">Banco Ejemplo S.A.</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">CLABE</span>
                        <span className="font-mono font-medium text-[#111418] dark:text-white">012 180 012345678901 2</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Número de cuenta</span>
                        <span className="font-mono font-medium text-[#111418] dark:text-white">0123 4567 8901 2345</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Beneficiario</span>
                        <span className="font-medium text-[#111418] dark:text-white">Tirusmo Reservas S. de R.L.</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-[#2a3441]">
                        <span className="text-gray-500 dark:text-gray-400">Referencia (importante)</span>
                        <span className="font-mono font-bold text-primary">RES-ABC12XYZ</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Monto a transferir</span>
                        <span className="text-lg font-black text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Incluye la referencia en el concepto de tu transferencia.</p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">mail</span>
                      <p className="text-sm text-[#111418] dark:text-gray-200">
                        Debes enviar tu comprobante de pago a <a href="mailto:administracion@escapar.mx" className="font-semibold text-primary hover:underline">administracion@escapar.mx</a> para confirmar tu reserva. La reserva quedará en estatus <strong>Pendiente</strong> hasta que se verifique el pago.
                      </p>
                    </div>
                  </div>
                )}
             </div>

             {/* Terms and Conditions Checkbox */}
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-[#1a222d] p-4 rounded-xl border border-gray-100 dark:border-[#2a3441]">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 shadow-sm transition-all checked:border-primary checked:bg-primary hover:border-primary"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium select-none">
                        He leído y acepto los términos y condiciones
                    </span>
                </label>
                <button 
                    onClick={() => setShowTermsModal(true)}
                    className="text-primary font-bold hover:underline flex items-center gap-1 text-sm whitespace-nowrap bg-transparent border-none p-0 cursor-pointer"
                >
                    Ver términos
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
             </div>

             {reservationError && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                  <span className="material-symbols-outlined shrink-0">error</span>
                  {reservationError}
                </div>
             )}
             <button 
                onClick={handlePagarYConfirmar}
                disabled={!termsAccepted || savingReservation}
                className={`flex w-full items-center justify-center rounded-xl h-14 text-lg font-bold shadow-lg transition-all ${termsAccepted && !savingReservation ? 'bg-primary hover:bg-blue-600 text-white shadow-blue-200 dark:shadow-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'}`}
             >
                {savingReservation ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Guardando reserva...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">lock</span> Pagar y Confirmar (${total.toFixed(2)})
                  </>
                )}
             </button>
        </div>
      </div>
  );

  const confirmationNumberRef = useRef<string | null>(null);
  const getConfirmationNumber = () => {
    if (reservationId) return reservationId.slice(0, 8).toUpperCase();
    if (!confirmationNumberRef.current) confirmationNumberRef.current = `SJ-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    return confirmationNumberRef.current;
  };

  const downloadReservationPdf = () => {
    const mealPlanLabel = selectedMealPlan === 'desayuno' ? 'Desayuno' : selectedMealPlan === 'todo_incluido' ? 'Todo incluido' : selectedMealPlan === 'sin_plan' ? 'Sin plan de alimentos' : 'Sin plan';
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageW = 210;
    const col2X = 105;
    let y = margin;
    const lineHeight = 6;
    const sectionGap = 6;
    const cPrimary = { r: 43, g: 119, b: 238 };
    const cDark = { r: 45, g: 45, b: 45 };
    const cLabel = { r: 90, g: 90, b: 90 };
    const cValue = { r: 30, g: 30, b: 30 };
    const cFooter = { r: 115, g: 115, b: 115 };

    const addLine = (label: string, value: string, xLabel = margin, xValue = margin + 75, valueBold = false, valueColor: { r: number; g: number; b: number } | null = null) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(cLabel.r, cLabel.g, cLabel.b);
      doc.text(label, xLabel, y);
      doc.setFont('helvetica', valueBold ? 'bold' : 'normal');
      doc.setTextColor(valueColor ? valueColor.r : cValue.r, valueColor ? valueColor.g : cValue.g, valueColor ? valueColor.b : cValue.b);
      doc.text(value, xValue, y);
      y += lineHeight;
    };
    const addSection = (title: string) => {
      y += sectionGap;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cDark.r, cDark.g, cDark.b);
      doc.text(title, margin, y);
      y += lineHeight + 2;
    };

    // Igual que pantalla de confirmación: Número de confirmación + # en color primary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cDark.r, cDark.g, cDark.b);
    doc.text('Número de confirmación', margin, y);
    doc.setFontSize(18);
    doc.setTextColor(cPrimary.r, cPrimary.g, cPrimary.b);
    doc.text(`#${getConfirmationNumber()}`, margin + 52, y - 0.5);
    y += lineHeight + 4;
    doc.setDrawColor(cPrimary.r, cPrimary.g, cPrimary.b);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    addSection('Lugar');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addLine('Hotel:', hotel.name);
    addLine('Ubicación:', [hotel.location, hotel.state, hotel.country].filter(Boolean).join(', '));
    if (hotel.phone) addLine('Teléfono del hotel:', hotel.phone);

    // Fechas y Huéspedes en dos columnas (igual que pantalla de confirmación)
    addSection('');
    y -= lineHeight + 2;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cDark.r, cDark.g, cDark.b);
    doc.text('Fechas', margin, y);
    doc.text('Huéspedes', col2X, y);
    y += lineHeight + 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const addRow = (leftLabel: string, leftVal: string, rightLabel: string, rightVal: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(cLabel.r, cLabel.g, cLabel.b);
      if (leftLabel) doc.text(leftLabel, margin, y);
      if (rightLabel) doc.text(rightLabel, col2X, y);
      doc.setTextColor(cValue.r, cValue.g, cValue.b);
      if (leftVal) doc.text(leftVal, margin + 28, y);
      if (rightVal) doc.text(rightVal, col2X + 28, y);
      y += lineHeight;
    };
    addRow('Check-in:', searchParams.checkIn, 'Titular:', `${guestDetails.firstName} ${guestDetails.lastName}`);
    addRow('', '15:00 hrs', 'Correo:', guestDetails.email);
    addRow('Check-out:', searchParams.checkOut, 'Teléfono:', guestDetails.phone ? `${phoneLada} ${guestDetails.phone}` : '—');
    addRow('', '12:00 hrs', '', '');
    const personasStr = `${searchParams.guests.adults} adulto(s)${searchParams.guests.children > 0 ? `, ${searchParams.guests.children} niño(s)` : ''} · ${searchParams.guests.rooms} habitación(es)`;
    addRow('Noches:', String(nights), 'Personas:', personasStr);

    addSection('Habitación');
    addLine('Tipo:', selectedRoom?.name ?? 'Habitación estándar');
    if (selectedRoom?.type) addLine('Categoría:', selectedRoom.type);
    addLine('Precio/noche:', `$${formatCantidad(roomPrice)}`);
    if (selectedRoom?.amenities?.length) addLine('Amenidades:', selectedRoom.amenities.join(', '));

    addSection('Plan de alimentación');
    addLine(`${mealPlanLabel}, Costo plan:`, mealPlanTotalForStay > 0 ? `$${formatCantidad(mealPlanTotalForStay)}` : 'Incluido en la tarifa');

    addSection('Precio pagado');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const valueX = pageW - margin - 35;
    addLine(`${nights} noches x $${formatCantidad(roomPrice)}`, `$${formatCantidad(roomTotal)}`, margin, valueX);
    if (mealPlanTotalForStay > 0) addLine('Plan de alimentos', `$${formatCantidad(mealPlanTotalForStay)}`, margin, valueX);
    addLine('Impuestos (16%)', `$${formatCantidad(taxes)}`, margin, valueX);
    addLine('Tarifa de servicio', `$${formatCantidad(service)}`, margin, valueX);
    // Línea separadora como en la pantalla de confirmación
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += lineHeight + 2;
    addLine('Total pagado', `$${formatCantidad(total)}`, margin, valueX, true, cPrimary);

    if (guestDetails.specialRequests?.trim()) {
      addSection('Solicitudes especiales');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(cValue.r, cValue.g, cValue.b);
      const split = doc.splitTextToSize(guestDetails.specialRequests, pageW - 2 * margin);
      doc.text(split, margin, y);
      y += split.length * lineHeight;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(cFooter.r, cFooter.g, cFooter.b);
    y = Math.max(y + 12, 275);
    doc.text('Guarde este PDF como comprobante de su reserva.', margin, y);
    doc.text(`Confirmación #${getConfirmationNumber()} · ${hotel.name}`, margin, y + 5);

    doc.save(`reserva-${getConfirmationNumber()}.pdf`);
  };

  const renderConfirmationStep = () => {
    const mealPlanLabel = selectedMealPlan === 'desayuno' ? 'Desayuno' : selectedMealPlan === 'todo_incluido' ? 'Todo incluido' : selectedMealPlan === 'sin_plan' ? 'Sin plan de alimentos' : 'Sin plan';
    return (
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-10">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white dark:border-[#101822]">
            <span className="material-symbols-outlined text-6xl text-green-600 dark:text-green-500 filled">check</span>
          </div>
          <h1 className="text-3xl font-black mb-2 text-center text-[#111418] dark:text-white">¡Reserva Confirmada!</h1>
          <p className="text-gray-500 mb-2 text-center">Hemos enviado los detalles a <strong className="text-[#111418] dark:text-white">{guestDetails.email}</strong></p>
          {wasGuestReservation && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md mx-auto">
              Reservaste como invitado. <strong>Guarda tu número de confirmación</strong> para cualquier consulta. Si después creas una cuenta con este correo, podrás ver esta reserva en Mi cuenta.
            </p>
          )}
          {!wasGuestReservation && <div className="mb-6" />}

          <div className="bg-white dark:bg-[#1a222d] w-full rounded-2xl border border-[#e5e7eb] dark:border-[#2a3441] shadow-xl overflow-hidden mb-6">
            <div className="bg-gray-50 dark:bg-[#252e3a] px-6 py-4 border-b border-[#e5e7eb] dark:border-[#2a3441] flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Número de confirmación</span>
                <span className="text-xl font-mono font-bold text-primary">#{getConfirmationNumber()}</span>
            </div>
            <div className="p-6 space-y-6">
                {/* Lugar */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">apartment</span> Lugar
                  </h3>
                  <div className="flex gap-4">
                    {hotel.image && (
                      <img src={hotel.image} alt={hotel.name} className="w-24 h-24 object-cover rounded-xl shrink-0" />
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-[#111418] dark:text-white">{hotel.name}</h2>
                      <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="material-symbols-outlined text-sm filled text-red-500">location_on</span>
                        {hotel.location}
                        {hotel.state && `, ${hotel.state}`}
                        {hotel.country && `, ${hotel.country}`}
                      </p>
                      {hotel.phone && (
                        <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="material-symbols-outlined text-sm">phone</span>
                          {hotel.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Fechas */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">calendar_today</span> Fechas
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-[#101822] rounded-xl border border-gray-100 dark:border-[#2a3441]">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Check-in</p>
                      <p className="font-bold text-[#111418] dark:text-white">{searchParams.checkIn}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">15:00 hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Check-out</p>
                      <p className="font-bold text-[#111418] dark:text-white">{searchParams.checkOut}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">12:00 hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Noches</p>
                      <p className="font-bold text-[#111418] dark:text-white">{nights}</p>
                    </div>
                  </div>
                </section>

                {/* Huéspedes */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">group</span> Huéspedes
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-[#101822] rounded-xl border border-gray-100 dark:border-[#2a3441] space-y-2">
                    <p className="text-[#111418] dark:text-white font-medium">
                      {searchParams.guests.adults} adulto{searchParams.guests.adults !== 1 ? 's' : ''}
                      {searchParams.guests.children > 0 && `, ${searchParams.guests.children} niño${searchParams.guests.children !== 1 ? 's' : ''}`}
                      {searchParams.guests.rooms > 0 && ` · ${searchParams.guests.rooms} habitación${searchParams.guests.rooms !== 1 ? 'es' : ''}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-[#111418] dark:text-white">{guestDetails.firstName} {guestDetails.lastName}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{guestDetails.email}</p>
                    {guestDetails.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{phoneLada} {guestDetails.phone}</p>
                    )}
                  </div>
                </section>

                {/* Habitación */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">bed</span> Habitación
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-[#101822] rounded-xl border border-gray-100 dark:border-[#2a3441]">
                    <p className="font-bold text-[#111418] dark:text-white">{selectedRoom?.name ?? 'Habitación estándar'}</p>
                    {selectedRoom?.type && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Tipo: {selectedRoom.type}</p>}
                    <p className="text-sm text-primary font-semibold mt-1">${roomPrice.toFixed(2)} por noche</p>
                    {selectedRoom?.amenities && selectedRoom.amenities.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#2a3441]">
                        <p className="text-xs text-gray-400 font-medium mb-1.5">Amenidades</p>
                        <ul className="flex flex-wrap gap-2">
                          {selectedRoom.amenities.map((a, i) => (
                            <li key={i} className="text-xs px-2 py-1 bg-white dark:bg-[#1a222d] rounded-md border border-gray-200 dark:border-[#2a3441] text-gray-700 dark:text-gray-300">{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                {/* Plan de alimentación */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">restaurant</span> Plan de alimentación
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-[#101822] rounded-xl border border-gray-100 dark:border-[#2a3441] flex justify-between items-center flex-wrap gap-2">
                    <p className="font-medium text-[#111418] dark:text-white">{mealPlanLabel}</p>
                    {mealPlanTotalForStay > 0 ? (
                      <p className="text-sm text-primary font-semibold">${mealPlanTotalForStay.toFixed(2)} ({nights} noches)</p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Incluido en la tarifa</p>
                    )}
                  </div>
                </section>

                {/* Desglose de precio pagado */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">receipt_long</span> Precio pagado
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-[#101822] rounded-xl border border-gray-100 dark:border-[#2a3441] space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{nights} noches x ${roomPrice.toFixed(2)}</span>
                      <span className="font-medium text-[#111418] dark:text-white">${roomTotal.toFixed(2)}</span>
                    </div>
                    {mealPlanTotalForStay > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Plan de alimentos</span>
                        <span className="font-medium text-[#111418] dark:text-white">${mealPlanTotalForStay.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Impuestos (16%)</span>
                      <span className="font-medium text-[#111418] dark:text-white">${taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tarifa de servicio</span>
                      <span className="font-medium text-[#111418] dark:text-white">${service.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-[#2a3441] my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#111418] dark:text-white">Total pagado</span>
                      <span className="text-2xl font-black text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </section>

                {guestDetails.specialRequests?.trim() && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">notes</span> Solicitudes especiales
                    </h3>
                    <p className="p-4 bg-gray-50 dark:bg-[#101822] rounded-xl border border-gray-100 dark:border-[#2a3441] text-sm text-[#111418] dark:text-gray-300">{guestDetails.specialRequests}</p>
                  </section>
                )}
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Guarda este número de confirmación <strong className="text-[#111418] dark:text-white">#{getConfirmationNumber()}</strong> para cualquier consulta.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={downloadReservationPdf}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
            >
              <span className="material-symbols-outlined text-xl">download</span>
              Descargar PDF
            </button>
            <button onClick={onBack} className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Volver al Inicio
            </button>
          </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 py-8 px-4 md:px-10 lg:px-40 relative">
       {step < 4 && (
        <div className="mb-8">
            <h1 className="text-3xl font-black mb-2 dark:text-white">
                {step === 1 ? 'Revisión de Reserva' : step === 2 ? 'Datos del Huésped' : 'Finalizar Pago'}
            </h1>
        </div>
       )}
       {renderStepIndicator()}
       {step === 1 && renderSelectionStep()}
       {step === 2 && renderGuestDetailsStep()}
       {step === 3 && renderPaymentStep()}
       {step === 4 && renderConfirmationStep()}

       {/* Terms Modal Overlay */}
       {showTermsModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTermsModal(false)}></div>
            <div className="relative bg-white dark:bg-[#101822] w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-[#101822] z-10">
                    <h2 className="text-lg font-bold">Términos y Condiciones</h2>
                    <button onClick={() => setShowTermsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1">
                    <TermsAndConditions />
                </div>
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-[#1a2634] flex justify-end gap-3">
                    <button onClick={() => setShowTermsModal(false)} className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Cerrar
                    </button>
                    <button 
                        onClick={() => {
                            setTermsAccepted(true);
                            setShowTermsModal(false);
                        }} 
                        className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 shadow-md"
                    >
                        Aceptar y Cerrar
                    </button>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default BookingWizard;