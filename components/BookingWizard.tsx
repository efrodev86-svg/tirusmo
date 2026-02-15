import React, { useState, useEffect, useRef } from 'react';
import { Hotel, SearchParams, BookingStep, GuestDetails } from '../types';
import { TermsAndConditions } from './TermsAndConditions';
import { supabase } from '../lib/supabase';

const STICKY_TOP_PX = 24;

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

  const selectedRoom = hotelRooms.find((r) => r.id === selectedRoomId);
  const roomPrice = selectedRoom?.price ?? hotel.price;

  const selectedPlanItem = selectedMealPlan ? hotel.meal_plans?.find((p) => p.type === selectedMealPlan) : null;
  const mealPlanCostPerNight = selectedPlanItem?.cost ?? 0;

  // Calculate Totals
  const nights = 4; // Mock calculation, normally diff(checkOut, checkIn)
  const roomTotal = nights * roomPrice;
  const mealPlanTotalForStay = mealPlanCostPerNight * nights;
  const subtotalBeforeTax = roomTotal + mealPlanTotalForStay;
  const taxes = subtotalBeforeTax * 0.12;
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
  const validateGuestDetails = () => {
    return guestDetails.firstName && guestDetails.lastName && guestDetails.email && guestDetails.phone;
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
                            <span>Impuestos (12%)</span>
                            <span className="font-medium text-[#111418] dark:text-white">${taxes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Tarifa servicio</span>
                            <span className="font-medium text-[#111418] dark:text-white">${service.toFixed(2)}</span>
                        </div>
                        <div className="my-4 h-px border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-sm font-medium text-gray-500">Total a pagar</span>
                            <span className="text-3xl font-black text-primary">${total.toFixed(2)}</span>
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
            <p className="text-xl font-black text-primary">${total.toFixed(2)}</p>
          </div>
          <button onClick={() => setStep(BookingStep.DETAILS)} className="flex-shrink-0 flex items-center justify-center rounded-xl h-12 px-6 bg-primary hover:bg-blue-600 text-white font-bold text-sm shadow-lg group transition-all">
            <span>Continuar</span>
            <span className="material-symbols-outlined ml-1.5 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>
        </div>
        <div className="lg:hidden h-20" aria-hidden="true" />
    </div>
  );

  const renderGuestDetailsStep = () => (
      <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="material-symbols-outlined text-primary">person</span> Información Personal
                  </h3>
                  <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Nombre(s) *</label>
                              <input 
                                className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm outline-none focus:border-primary focus:ring-1" 
                                type="text"
                                value={guestDetails.firstName}
                                onChange={(e) => setGuestDetails({...guestDetails, firstName: e.target.value})}
                              />
                          </div>
                          <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Apellidos *</label>
                              <input 
                                className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm outline-none focus:border-primary focus:ring-1" 
                                type="text"
                                value={guestDetails.lastName}
                                onChange={(e) => setGuestDetails({...guestDetails, lastName: e.target.value})}
                              />
                          </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Correo electrónico *</label>
                          <input 
                            className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm outline-none focus:border-primary focus:ring-1" 
                            type="email"
                            value={guestDetails.email}
                            onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                          />
                      </div>
                      <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Teléfono *</label>
                          <input 
                            className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4 text-sm outline-none focus:border-primary focus:ring-1" 
                            type="tel"
                            value={guestDetails.phone}
                            onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                          />
                      </div>
                  </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center gap-4 mt-2">
                  <button onClick={() => setStep(BookingStep.SELECTION)} className="flex w-full sm:w-auto items-center justify-center rounded-xl h-14 px-8 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-base font-bold transition-colors">
                      <span className="material-symbols-outlined mr-2 text-xl">arrow_back</span> Volver
                  </button>
                  <button 
                    onClick={() => {
                        if (validateGuestDetails()) setStep(BookingStep.PAYMENT);
                        else alert("Por favor complete todos los campos obligatorios.");
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
                      <span>Impuestos (12%)</span>
                      <span className="font-medium text-[#111418] dark:text-white">${taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Tarifa servicio</span>
                      <span className="font-medium text-[#111418] dark:text-white">${service.toFixed(2)}</span>
                    </div>
                    <div className="my-4 h-px border-t border-dashed border-gray-300 dark:border-gray-600" />
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-gray-500">Total a pagar</span>
                      <span className="text-2xl font-black text-primary">${total.toFixed(2)}</span>
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
            <p className="text-xl font-black text-primary">${total.toFixed(2)}</p>
          </div>
        </div>
        <div className="lg:hidden h-16" aria-hidden="true" />
      </div>
  );

  const renderPaymentStep = () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
             <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-[#e5e7eb] dark:border-[#2a3441] p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">credit_card</span> Información de Pago
                </h3>
                {/* Mock Card Form */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-300">Número de tarjeta</label>
                        <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4" placeholder="0000 0000 0000 0000"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">Expira</label>
                            <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4" placeholder="MM/YY"/>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">CVV</label>
                            <input className="w-full h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3a4451] bg-white dark:bg-[#101822] px-4" placeholder="123"/>
                        </div>
                    </div>
                </div>
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

             <button 
                onClick={() => setStep(BookingStep.CONFIRMATION)}
                disabled={!termsAccepted}
                className={`flex w-full items-center justify-center rounded-xl h-14 text-lg font-bold shadow-lg transition-all ${termsAccepted ? 'bg-primary hover:bg-blue-600 text-white shadow-blue-200 dark:shadow-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'}`}
             >
                <span className="material-symbols-outlined mr-2">lock</span> Pagar y Confirmar (${total.toFixed(2)})
             </button>
        </div>
      </div>
  );

  const renderConfirmationStep = () => (
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-10">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white dark:border-[#101822]">
            <span className="material-symbols-outlined text-6xl text-green-600 dark:text-green-500 filled">check</span>
          </div>
          <h1 className="text-3xl font-black mb-2 text-center text-[#111418] dark:text-white">¡Reserva Confirmada!</h1>
          <p className="text-gray-500 mb-10 text-center">Hemos enviado los detalles a {guestDetails.email}</p>
          
          <div className="bg-white dark:bg-[#1a222d] w-full rounded-2xl border border-[#e5e7eb] dark:border-[#2a3441] shadow-xl overflow-hidden mb-10">
            <div className="bg-gray-50 dark:bg-[#252e3a] px-8 py-5 border-b border-[#e5e7eb] dark:border-[#2a3441] flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Confirmación</span>
                <span className="text-xl font-mono font-bold">#SJ-{Math.floor(Math.random()*10000)}</span>
            </div>
            <div className="p-8">
                <h2 className="text-xl font-bold mb-2">{hotel.name}</h2>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-6">
                    <span className="material-symbols-outlined text-sm filled text-red-500">location_on</span> {hotel.location}
                </div>
                <div className="grid grid-cols-2 gap-6 p-4 bg-background-light dark:bg-[#101822] rounded-xl border border-gray-100 dark:border-[#2a3441]">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Check-in</p>
                        <p className="font-bold">{searchParams.checkIn}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Check-out</p>
                        <p className="font-bold">{searchParams.checkOut}</p>
                    </div>
                </div>
            </div>
          </div>
          
          <button onClick={onBack} className="bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Volver al Inicio
          </button>
      </div>
  );

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