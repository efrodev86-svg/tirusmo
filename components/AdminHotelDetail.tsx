import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type MealPlanItem = { type: string; cost: number; cost_children?: number };

type PlanInclusionItem = { title: string; description: string };

type HotelData = {
  id: number;
  name: string;
  location: string;
  municipality: string | null;
  state: string | null;
  country: string | null;
  price: number;
  rating: number;
  reviews: number;
  image: string | null;
  amenities: string[];
  stars: number;
  description: string | null;
  tags: string[];
  isSoldOut: boolean;
  partner_id: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  meal_plans: MealPlanItem[];
  travel_styles: string[];
  pet_friendly: boolean;
  plan_inclusions: PlanInclusionItem[];
};

type RoomSummary = { type: string; total: number; available: number; price: number };

type ProfilePartner = { id: string; full_name: string | null; email: string; phone: string | null };

interface AdminHotelDetailProps {
  hotelId: string;
  onBack: () => void;
  onManageRooms?: () => void;
  onEditHotel?: () => void;
}

export const AdminHotelDetail: React.FC<AdminHotelDetailProps> = ({ hotelId, onBack, onManageRooms, onEditHotel }) => {
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [roomSummary, setRoomSummary] = useState<RoomSummary[]>([]);
  const [partner, setPartner] = useState<ProfilePartner | null>(null);
  const [partnersList, setPartnersList] = useState<ProfilePartner[]>([]);
  const [assignPartnerId, setAssignPartnerId] = useState<string>('');
  const [savingPartner, setSavingPartner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlanInclusionsModal, setShowPlanInclusionsModal] = useState(false);
  const [amenityLabels, setAmenityLabels] = useState<Record<string, string>>({});

  const idNum = Number(hotelId);
  const isIdValid = !Number.isNaN(idNum) && idNum > 0;

  useEffect(() => {
    let cancelled = false;
    supabase.from('amenity_catalog').select('slug, label').then(({ data }) => {
      if (!cancelled && data) {
        const map: Record<string, string> = {};
        data.forEach((r: { slug: string; label: string }) => { map[r.slug] = r.label; });
        setAmenityLabels(map);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isIdValid) {
      setError('ID de hotel inválido');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: hotelRow, error: hotelErr } = await supabase
          .from('hotels')
          .select('id, name, location, municipality, state, country, price, rating, reviews, image, amenities, stars, description, tags, "isSoldOut", partner_id, check_in_time, check_out_time, meal_plans, travel_styles, pet_friendly, plan_inclusions')
          .eq('id', idNum)
          .single();
        if (hotelErr) throw hotelErr;
        if (!hotelRow || cancelled) return;
        const h: HotelData = {
          id: hotelRow.id,
          name: hotelRow.name,
          location: hotelRow.location,
          municipality: hotelRow.municipality ?? null,
          state: hotelRow.state ?? null,
          country: hotelRow.country ?? null,
          price: Number(hotelRow.price),
          rating: Number(hotelRow.rating),
          reviews: Number(hotelRow.reviews) || 0,
          image: hotelRow.image || null,
          amenities: Array.isArray(hotelRow.amenities) ? hotelRow.amenities : [],
          stars: Number(hotelRow.stars) || 0,
          description: hotelRow.description || null,
          tags: Array.isArray(hotelRow.tags) ? hotelRow.tags : [],
          isSoldOut: Boolean(hotelRow.isSoldOut),
          partner_id: hotelRow.partner_id ? String(hotelRow.partner_id) : null,
          check_in_time: hotelRow.check_in_time ?? null,
          check_out_time: hotelRow.check_out_time ?? null,
          meal_plans: Array.isArray(hotelRow.meal_plans) ? hotelRow.meal_plans.map((m: { type?: string; cost?: number; cost_children?: number }) => ({ type: String(m?.type ?? ''), cost: Number(m?.cost ?? 0), cost_children: Number(m?.cost_children ?? 0) })) : [],
          travel_styles: Array.isArray(hotelRow.travel_styles) ? hotelRow.travel_styles : [],
          pet_friendly: Boolean(hotelRow.pet_friendly),
          plan_inclusions: Array.isArray(hotelRow.plan_inclusions)
            ? hotelRow.plan_inclusions.map((x: { title?: string; description?: string }) => ({ title: String(x?.title ?? ''), description: String(x?.description ?? '') }))
            : [],
        };
        setHotel(h);

        const { data: rooms } = await supabase.from('rooms').select('type, status, price').eq('hotel_id', idNum);
        if (rooms && !cancelled) {
          const byType: Record<string, { total: number; available: number; price: number }> = {};
          rooms.forEach((r: { type: string; status: string; price: number }) => {
            const t = r.type || 'ESTÁNDAR';
            if (!byType[t]) byType[t] = { total: 0, available: 0, price: Number(r.price) || 0 };
            byType[t].total += 1;
            if (r.status === 'DISPONIBLE') byType[t].available += 1;
          });
          setRoomSummary(Object.entries(byType).map(([type, v]) => ({ type, total: v.total, available: v.available, price: v.price })));
        }

        if (h.partner_id) {
          const { data: profileRow } = await supabase.from('profiles').select('id, full_name, email, phone').eq('id', h.partner_id).single();
          if (profileRow && !cancelled) setPartner(profileRow as ProfilePartner);
        } else setPartner(null);

        const { data: partnersData } = await supabase.from('profiles').select('id, full_name, email, phone').eq('user_type', 'partner').order('full_name');
        if (partnersData && !cancelled) setPartnersList((partnersData as ProfilePartner[]) || []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        if (!cancelled) setLoading(false);
      }
      return () => { cancelled = true; };
    })();
  }, [idNum, isIdValid]);

  useEffect(() => {
    setAssignPartnerId(partner?.id ?? '');
  }, [partner?.id]);

  const totalRooms = roomSummary.reduce((a, r) => a + r.total, 0);
  const availableRooms = roomSummary.reduce((a, r) => a + r.available, 0);
  const occupancyPct = totalRooms ? Math.round((1 - availableRooms / totalRooms) * 100) : 0;
  const avgPrice = roomSummary.length ? roomSummary.reduce((a, r) => a + r.price, 0) / roomSummary.length : 0;

  const handleAssignPartner = async () => {
    if (!hotel) return;
    setSavingPartner(true);
    try {
      const newPartnerId = assignPartnerId || null;
      const { error: err } = await supabase.from('hotels').update({ partner_id: newPartnerId }).eq('id', hotel.id);
      if (err) throw err;
      setHotel((prev) => (prev ? { ...prev, partner_id: newPartnerId } : null));
      if (newPartnerId) {
        const p = partnersList.find((x) => x.id === newPartnerId);
        setPartner(p || null);
      } else setPartner(null);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSavingPartner(false);
    }
  };

  if (!isIdValid || loading) {
    return (
      <div className="p-8">
        {loading && <p className="text-gray-500">Cargando hotel...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">Volver</button>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error || 'Hotel no encontrado'}</p>
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold">Volver a Hoteles</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] leading-tight">{hotel.name}</h1>
            <p className="text-xs text-gray-400 font-medium">ID: #{hotel.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button type="button" onClick={onEditHotel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar Información
          </button>
          <button type="button" onClick={onManageRooms} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-200">
            <span className="material-symbols-outlined text-[18px]">bed</span>
            Gestionar Habitaciones / Inventario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Precio base</span>
          <div className="text-2xl font-bold text-[#111827] mt-1">${Number(hotel.price).toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ocupación</span>
          <div className="text-2xl font-bold text-[#111827] mt-1">{occupancyPct}%</div>
          <div className="text-xs text-gray-400">{totalRooms - availableRooms} de {totalRooms} habitaciones</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Habitaciones</span>
          <div className="text-2xl font-bold text-[#111827] mt-1">{totalRooms}</div>
          <div className="text-xs text-gray-400">{availableRooms} disponibles</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rating</span>
          <div className="text-2xl font-bold text-[#111827] mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-yellow-500 filled text-[20px]">star</span>
            {Number(hotel.rating)} ({hotel.reviews} reviews)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-6">Información de la Propiedad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ubicación</p>
              <div className="flex gap-2 items-start">
                <span className="material-symbols-outlined text-[#111827] mt-0.5 filled">location_on</span>
                <p className="text-gray-600 text-sm">{hotel.location}</p>
              </div>
            </div>
            {(hotel.municipality || hotel.state || hotel.country) && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Municipio / Estado / País</p>
                <p className="text-gray-600 text-sm">
                  {[hotel.municipality, hotel.state, hotel.country].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Check-in / Check-out</p>
              <div className="flex gap-2 items-center text-sm text-gray-600">
                <span className="material-symbols-outlined text-[18px] text-primary">login</span>
                <span>{hotel.check_in_time || '15:00'}</span>
                <span className="text-gray-300">/</span>
                <span className="material-symbols-outlined text-[18px] text-primary">logout</span>
                <span>{hotel.check_out_time || '11:00'}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Estilo de Viaje</p>
              <div className="flex flex-wrap gap-2">
                {(hotel.travel_styles && hotel.travel_styles.length > 0)
                  ? hotel.travel_styles.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold">{s}</span>
                    ))
                  : <span className="text-gray-400 text-sm">—</span>}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pet friendly</p>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[20px] ${hotel.pet_friendly ? 'text-primary' : 'text-gray-400'}`}>pets</span>
                <span className={`text-sm font-bold ${hotel.pet_friendly ? 'text-primary' : 'text-gray-500'}`}>{hotel.pet_friendly ? 'Sí' : 'No'}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Amenidades</p>
              <div className="flex flex-wrap gap-2">
                {(hotel.amenities || []).map((slug, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                    {amenityLabels[slug] ?? slug}
                  </span>
                ))}
                {(!hotel.amenities || hotel.amenities.length === 0) && <span className="text-gray-400 text-sm">—</span>}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Estado</p>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${hotel.isSoldOut ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {hotel.isSoldOut ? 'Agotado' : 'Activo'}
              </span>
            </div>
            <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Planes</p>
                {hotel.meal_plans && hotel.meal_plans.length > 0 ? (
                  <ul className="space-y-1">
                    {hotel.meal_plans.map((m, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                        <span className="capitalize">{m.type.replace('_', ' ')}</span>
                        <span className="text-gray-500">—</span>
                        <span className="font-semibold text-[#111827]">
                          Adultos: {Number(m.cost) === 0 ? 'Incluido' : `$${Number(m.cost).toLocaleString('es-MX')} MXN`}
                          {' · '}
                          Menores: {Number(m.cost_children ?? 0) === 0 ? 'Incluido' : `$${Number(m.cost_children).toLocaleString('es-MX')} MXN`}
                        </span>
                        {m.type === 'todo_incluido' && (
                          <button
                            type="button"
                            onClick={() => setShowPlanInclusionsModal(true)}
                            className="ml-1 flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-primary hover:bg-primary/10 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            Qué incluye
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">Sin planes de alimentos</p>
                )}
              </div>
            {showPlanInclusionsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPlanInclusionsModal(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-[#111827] dark:text-white">Detalle plan Todo Incluido</h3>
                    <button type="button" onClick={() => setShowPlanInclusionsModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1">
                    {hotel.plan_inclusions && hotel.plan_inclusions.length > 0 ? (
                      <ul className="space-y-4">
                        {hotel.plan_inclusions.map((item, i) => (
                          <li key={i}>
                            <p className="font-bold text-[#111827] dark:text-white text-sm">{item.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{item.description}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no se ha definido qué incluye el plan Todo Incluido. Usa &quot;Editar Información&quot; y en la sección Planes podrás agregar las inclusiones del Todo Incluido.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</p>
              <p className="text-gray-600 text-sm leading-relaxed">{hotel.description || '—'}</p>
            </div>
          </div>
          {hotel.image && (
            <div className="mt-6">
              <p className="font-bold text-[#111827] mb-2 text-sm">Imagen</p>
              <img src={hotel.image} alt="" className="rounded-xl max-h-48 object-cover" />
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">Partner asignado</h3>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Los partners se crean en Usuarios (tipo Partner). Aquí solo asignas uno al hotel.</p>
          {partner ? (
            <div className="space-y-1 text-sm mb-4">
              <p className="font-bold text-[#111827]">{partner.full_name || '—'}</p>
              <p className="text-gray-600">{partner.email || '—'}</p>
              {partner.phone ? <p className="text-gray-600">{partner.phone}</p> : null}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4">Ningún partner asignado.</p>
          )}
          <label className="text-xs font-bold text-gray-700 block mb-2">Asignar o cambiar partner</label>
          <select value={assignPartnerId} onChange={(e) => setAssignPartnerId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2">
            <option value="">— Ninguno —</option>
            {partnersList.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.email})</option>
            ))}
          </select>
          {partnersList.length === 0 && <p className="text-amber-600 text-xs mb-2">No hay usuarios tipo Partner. Crea uno en Admin → Usuarios.</p>}
          <button type="button" onClick={handleAssignPartner} disabled={savingPartner} className="w-full px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-50">
            {savingPartner ? 'Guardando...' : 'Asignar partner'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-[#111827]">Disponibilidad de Habitaciones</h3>
          <button type="button" onClick={onManageRooms} className="text-sm font-bold text-primary hover:underline">
            Gestionar inventario
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                <th className="py-3">Tipo</th>
                <th className="py-3 text-center">Total</th>
                <th className="py-3 text-center">Disponible</th>
                <th className="py-3 text-center">Precio/noche</th>
                <th className="py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {roomSummary.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">No hay habitaciones. Usa &quot;Gestionar Habitaciones&quot; para agregar.</td></tr>
              )}
              {roomSummary.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-4 font-bold text-[#111827]">{r.type}</td>
                  <td className="py-4 text-center text-gray-600">{r.total}</td>
                  <td className="py-4 text-center font-bold text-green-600">{r.available}</td>
                  <td className="py-4 text-center text-gray-600">${Number(r.price).toLocaleString()}</td>
                  <td className="py-4 text-right">
                    <button type="button" onClick={onManageRooms} className="text-primary text-xs font-bold hover:underline">Gestionar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
