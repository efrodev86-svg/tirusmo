import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CustomerStayTrackingProps {
  reservationId: string;
  onBack: () => void;
  onBilling?: () => void;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  if (!address.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        q: address.trim(),
        format: 'json',
        limit: '1',
      })}`,
      { headers: { 'Accept-Language': 'es', 'User-Agent': 'escapar-mx-hotel-app/1.0' } }
    );
    const data = await res.json();
    const first = Array.isArray(data) && data[0];
    if (first?.lat != null && first?.lon != null) return { lat: Number(first.lat), lon: Number(first.lon) };
    return null;
  } catch {
    return null;
  }
}

export const CustomerStayTracking: React.FC<CustomerStayTrackingProps> = ({ reservationId, onBack, onBilling }) => {
  const [reservation, setReservation] = useState<{
    id: string;
    hotelName: string;
    roomName: string;
    image: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    roomsCount: number;
    amenities: string[];
    address: string;
    /** Campo location del hotel (ubicación/dirección) */
    location: string;
    /** Teléfono de contacto del hotel */
    hotelPhone: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('id, check_in, check_out, guests, data, hotels(name, location, image, phone), rooms(name, amenities)')
        .eq('id', reservationId)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setReservation(null);
        setLoading(false);
        return;
      }
      const r = data as Record<string, unknown>;
      const hotel = r.hotels as { name?: string; location?: string; image?: string; phone?: string } | null;
      const room = r.rooms as { name?: string; amenities?: string[] } | null;
      const checkIn = r.check_in ? new Date(String(r.check_in)) : null;
      const checkOut = r.check_out ? new Date(String(r.check_out)) : null;
      const guestsNum = Number(r.guests ?? 1);
      const reservationData = (r.data as { rooms?: number } | null) || {};
      const roomsCount = Math.max(1, Number(reservationData.rooms) || 1);
      const location = (hotel?.location && String(hotel.location).trim()) || '';
      const address = location || 'Sin dirección';
      setReservation({
        id: String(r.id).slice(0, 8).toUpperCase(),
        hotelName: hotel?.name || 'Hotel',
        roomName: room?.name || 'Habitación',
        image: hotel?.image || 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=600&auto=format&fit=crop',
        checkIn: checkIn ? `${checkIn.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}, 15:00` : '—',
        checkOut: checkOut ? `${checkOut.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}, 12:00` : '—',
        guests: `${guestsNum} adulto(s)`,
        roomsCount,
        amenities: Array.isArray(room?.amenities) ? room.amenities : ['Wi-Fi', 'Clima'],
        address,
        location: location || '—',
        hotelPhone: hotel?.phone && String(hotel.phone).trim() ? String(hotel.phone).trim() : null,
      });
      setLoading(false);
      if (address && address !== 'Sin dirección') {
        setMapLoading(true);
        const coords = await geocodeAddress(address);
        if (!cancelled) {
          setMapCoords(coords);
          setMapLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [reservationId]);

  const timeline = [
    { title: "Reserva Confirmada", desc: "¡Tu lugar está asegurado!", status: "completed", icon: "check_circle" },
    { title: "Pago Verificado", desc: "Transacción exitosa completada", status: "completed", icon: "payments" },
    { title: "Preparando Estancia", desc: "El hotel ha recibido tus peticiones especiales y está preparando tu habitación.", status: "current", icon: "bed", tag: "ACTUAL" },
    { title: "Check-in Ready", desc: "Muestra tu código al llegar", status: "pending", icon: "qr_code" },
    { title: "En el Hotel", desc: "Comparte tu experiencia con nosotros", status: "pending", icon: "camera_alt" },
    { title: "Checkout", desc: "Procesa tu salida y factura", status: "pending", icon: "receipt_long" },
  ];

  if (loading || !reservation) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
        <button onClick={onBack} className="text-gray-500 hover:text-[#111827] flex items-center gap-2 mb-4 font-medium transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Volver a mis reservas
        </button>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          {loading ? (
            <>
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-pulse">hourglass_empty</span>
              <p className="text-gray-500 mt-2">Cargando reserva…</p>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-4xl text-gray-300">error_outline</span>
              <p className="text-gray-500 mt-2">No se encontró la reserva.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const mapsQuery = encodeURIComponent(reservation.address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const osmEmbedUrl = mapCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lon - 0.02},${mapCoords.lat - 0.02},${mapCoords.lon + 0.02},${mapCoords.lat + 0.02}&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lon}`
    : null;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div>
        <button onClick={onBack} className="text-gray-500 hover:text-[#111827] flex items-center gap-2 mb-4 font-medium transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Volver a mis reservas
        </button>
        <h1 className="text-3xl font-black text-[#111827]">Seguimiento de tu Estancia</h1>
        <p className="text-gray-500 mt-1">Sigue cada paso de tu viaje con nosotros en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Timeline Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <h2 className="text-lg font-bold text-[#111827] mb-6">Tu Ruta de Viaje</h2>
                <div className="relative pl-4">
                    {/* Vertical Line */}
                    <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-gray-100"></div>
                    
                    <div className="flex flex-col gap-8">
                        {timeline.map((step, i) => (
                            <div key={i} className={`relative flex gap-4 ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shrink-0 z-10 bg-white ${step.status === 'completed' ? 'border-[#3B82F6] text-[#3B82F6]' : step.status === 'current' ? 'border-[#3B82F6] bg-blue-50 text-[#3B82F6]' : 'border-gray-200 text-gray-300'}`}>
                                    <span className="material-symbols-outlined text-[24px] filled">
                                        {step.status === 'completed' ? 'check' : step.icon}
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className={`font-bold text-lg ${step.status === 'current' ? 'text-[#3B82F6]' : 'text-[#111827]'}`}>
                                            {step.title}
                                        </h3>
                                        {step.tag && (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                {step.tag}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed max-w-md">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Entrance Pass */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-32 h-32 bg-[#ECFDF5] rounded-xl flex items-center justify-center text-center p-2 border border-[#D1FAE5] shrink-0">
                    <span className="text-[10px] font-bold text-[#065F46]">Disponible 24h antes de tu llegada</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold text-lg text-[#111827] mb-2">Tu Pase de Entrada</h3>
                    <p className="text-sm text-gray-500 mb-6">Escanea este código QR en el quiosco de recepción para un check-in sin contacto y recibe tu llave digital al instante.</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button className="bg-[#3B82F6] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Descargar QR
                        </button>
                        <button className="bg-gray-100 hover:bg-gray-200 text-[#111827] px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">share</span>
                            Compartir
                        </button>
                    </div>
                </div>
            </div>

            {/* Available Actions */}
            <div className="bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE] p-8">
                <h3 className="font-bold text-lg text-[#3B82F6] mb-6 text-center">Acciones Disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button className="bg-white p-6 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#3B82F6] mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined filled">add_a_photo</span>
                        </div>
                        <span className="font-bold text-[#111827]">Compartir Fotos</span>
                        <span className="text-xs text-gray-500 mt-1">Sube momentos de tu estancia</span>
                    </button>
                    <button 
                        onClick={onBilling}
                        className="bg-white p-6 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center text-center group"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#3B82F6] mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined filled">description</span>
                        </div>
                        <span className="font-bold text-[#111827]">Facturación</span>
                        <span className="text-xs text-gray-500 mt-1">Solicita tu factura ahora</span>
                    </button>
                </div>
            </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
            
            {/* Reservation Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-48 bg-gray-200 relative">
                    <img src={reservation.image} className="w-full h-full object-cover" alt={reservation.roomName} />
                </div>
                <div className="p-6">
                    <h3 className="font-bold text-lg text-[#111827]">{reservation.roomName}</h3>
                    <p className="text-xs text-gray-400 mb-6 font-medium">Reserva {reservation.id}</p>
                    
                    <div className="flex flex-col gap-3 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Entrada</span>
                            <span className="font-bold text-[#111827]">{reservation.checkIn}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Salida</span>
                            <span className="font-bold text-[#111827]">{reservation.checkOut}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Huéspedes</span>
                            <span className="font-bold text-[#111827]">{reservation.guests}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Número de habitaciones</span>
                            <span className="font-bold text-[#111827]">{reservation.roomsCount}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {reservation.amenities.map((amenity, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">
                                {amenity}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Location + Map */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <p className="text-lg font-bold text-[#111827] mb-1">{reservation.hotelName}</p>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[#111827] leading-tight text-sm">Ubicación del Hotel</h3>
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3B82F6] text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                        <span className="material-symbols-outlined text-[16px] filled">directions</span> Indicaciones
                    </a>
                </div>
                <div className="h-48 rounded-xl mb-4 overflow-hidden border border-gray-100 bg-gray-100">
                    {mapLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 animate-pulse">map</span>
                            <span className="text-sm text-gray-500 ml-2">Cargando mapa…</span>
                        </div>
                    ) : osmEmbedUrl ? (
                        <iframe
                            title="Mapa del hotel"
                            src={osmEmbedUrl}
                            className="w-full h-full border-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                            <span className="material-symbols-outlined text-[40px]">location_on</span>
                            <span className="text-sm mt-1">{reservation.hotelName}</span>
                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] text-xs font-bold mt-2 hover:underline">
                                Ver en Google Maps
                            </a>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Ubicación</p>
                        <p className="text-sm text-[#111827] leading-relaxed flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#111827] mt-0.5 filled shrink-0">location_on</span>
                            {reservation.location}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Teléfono de Contacto</p>
                        {reservation.hotelPhone ? (
                            <a href={`tel:${reservation.hotelPhone.replace(/\D/g, '')}`} className="text-sm font-medium text-[#3B82F6] hover:underline flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">phone</span>
                                {reservation.hotelPhone}
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500">—</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Support */}
            <button className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100">
                        <span className="material-symbols-outlined text-[20px] filled">support_agent</span>
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-[#111827] text-sm">Asistencia 24/7</span>
                        <span className="block text-[10px] text-gray-500">¿Necesitas ayuda con algo?</span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>

        </div>
      </div>
    </div>
  );
};