import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['PENDIENTE', 'CONFIRMADA', 'CHECKOUT', 'CANCELADA'] as const;

type ReservationRow = {
  id: string;
  guest: { name: string; email: string; img: string };
  hotel: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: string;
  status: string;
};

interface AdminReservationsProps {
  onSelectReservation?: (id: string) => void;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export const AdminReservations: React.FC<AdminReservationsProps> = ({ onSelectReservation }) => {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hotels, setHotels] = useState<{ id: number; name: string }[]>([]);

  const [search, setSearch] = useState('');
  const [filterHotelId, setFilterHotelId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [counts, setCounts] = useState({ total: 0, confirmadas: 0, pendientes: 0, canceladas: 0, hoy: 0 });
  const [emptyDueToPermissions, setEmptyDueToPermissions] = useState(false);

  const fetchReservations = useCallback(async (overridePage?: number) => {
    setLoading(true);
    setError(null);
    setEmptyDueToPermissions(false);
    const pageToUse = overridePage !== undefined ? overridePage : page;
    try {
      const term = search.trim();
      let searchReservationIds: string[] = [];
      if (term) {
        const { data: ids, error: rpcError } = await supabase.rpc('search_reservation_ids', { p_search_term: term });
        if (!rpcError) {
          searchReservationIds = (ids || []) as string[];
        } else {
          const looksLikeUuid = /^[0-9a-f-]{8,36}$/i.test(term);
          const { data: profilesMatch } = await supabase.from('profiles').select('id').or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
          const userIds = (profilesMatch || []).map((p: { id: string }) => p.id);
          if (userIds.length > 0 || looksLikeUuid) {
            const orParts: string[] = [];
            if (userIds.length > 0) orParts.push(`user_id.in.(${userIds.join(',')})`);
            if (looksLikeUuid) orParts.push(`id.eq.${term}`);
            if (orParts.length > 0) {
              const { data: res } = await supabase.from('reservations').select('id').or(orParts.join(','));
              searchReservationIds = (res || []).map((r: { id: string }) => r.id);
            }
          }
        }
      }

      let q = supabase
        .from('reservations')
        .select('id, user_id, hotel_id, room_id, check_in, check_out, total, status, guests, created_at, data, hotels(name), rooms(name)', { count: 'exact' });

      if (filterHotelId) q = q.eq('hotel_id', Number(filterHotelId));
      if (filterStatus) q = q.eq('status', filterStatus);
      if (filterDateFrom) q = q.gte('check_in', filterDateFrom);
      if (filterDateTo) q = q.lte('check_out', filterDateTo);

      if (term) {
        if (searchReservationIds.length > 0) {
          q = q.in('id', searchReservationIds);
        } else {
          q = q.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const from = pageToUse * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error: err, count } = await q.order('created_at', { ascending: false }).range(from, to);

      if (err) {
        const msg = err.message || String(err);
        const hint = msg.includes('column') || msg.includes('does not exist') || msg.includes('JWT')
          ? ' Revisa: 1) Ejecutar migración 20250208200000_reservations_schema_and_seed. 2) Iniciar sesión como admin.'
          : '';
        setError(msg + hint);
        setReservations([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const list = (data || []) as Record<string, unknown>[];
      const userIds = [...new Set(list.map((r) => r.user_id as string).filter(Boolean))] as string[];
      let profilesMap: Record<string, { full_name?: string; email?: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
        if (Array.isArray(profilesData)) {
          profilesMap = (profilesData as { id: string; full_name?: string; email?: string }[]).reduce(
            (acc, p) => ({ ...acc, [p.id]: { full_name: p.full_name, email: p.email } }),
            {}
          );
        }
      }

      const rows: ReservationRow[] = list.map((r) => {
        const profile = (r.user_id ? profilesMap[r.user_id as string] : null) || null;
        const hotel = r.hotels as { name?: string } | null;
        const room = r.rooms as { name?: string } | null;
        const data = (r.data as { guest_first_name?: string; guest_last_name?: string; guest_email?: string } | null) || null;
        const guestNameFromData = data?.guest_first_name || data?.guest_last_name
          ? [data.guest_first_name, data.guest_last_name].filter(Boolean).join(' ').trim()
          : data?.guest_email || '';
        // Titular de la reserva: priorizar datos ingresados en el formulario (pueden ser de otra persona si el usuario reservó a nombre de otro)
        const name = guestNameFromData || profile?.full_name || profile?.email || 'Sin nombre';
        const email = (data?.guest_email && data.guest_email.trim()) ? data.guest_email : (profile?.email || '');
        const checkIn = String(r.check_in || '');
        const checkOut = String(r.check_out || '');
        const nights = r.check_in && r.check_out
          ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        return {
          id: String(r.id),
          guest: {
            name,
            email,
            img: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          },
          hotel: hotel?.name || room?.name || '—',
          checkIn: formatDate(checkIn || null),
          checkOut: formatDate(checkOut || null),
          nights,
          total: formatCurrency(Number(r.total ?? 0)),
          status: String(r.status || 'PENDIENTE'),
        };
      });

      setReservations(rows);
      setTotalCount(count ?? 0);

      const hasActiveFilters = !!(term || filterHotelId || filterStatus || filterDateFrom || filterDateTo);
      if ((count ?? 0) === 0 && !hasActiveFilters) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
          if (profile && (profile as { user_type?: string }).user_type !== 'admin') {
            setEmptyDueToPermissions(true);
          }
        }
      }
    } catch (e) {
      const msg = (e && typeof e === 'object' && 'message' in e && (e as { message: string }).message) || (e instanceof Error ? e.message : String(e)) || 'Error al cargar reservaciones';
      const hint = msg.includes('column') || msg.includes('does not exist') ? ' Ejecuta la migración 20250208200000_reservations_schema_and_seed en Supabase (SQL Editor).' : '';
      setError(msg + hint);
      setReservations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, filterHotelId, filterStatus, filterDateFrom, filterDateTo, search]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('hotels').select('id, name').order('name');
      setHotels((data as { id: number; name: string }[]) || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { count: total } = await supabase.from('reservations').select('*', { count: 'exact', head: true });
        const { count: confirmadas } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'CONFIRMADA');
        const { count: pendientes } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'PENDIENTE');
        const { count: canceladas } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'CANCELADA');
        const today = new Date().toISOString().slice(0, 10);
        const { count: hoy } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('check_in', today);
        setCounts({
          total: total ?? 0,
          confirmadas: confirmadas ?? 0,
          pendientes: pendientes ?? 0,
          canceladas: canceladas ?? 0,
          hoy: hoy ?? 0,
        });
      } catch {
        setCounts({ total: 0, confirmadas: 0, pendientes: 0, canceladas: 0, hoy: 0 });
      }
    })();
  }, [reservations.length]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADA': return 'bg-green-100 text-green-700';
      case 'PENDIENTE': return 'bg-orange-100 text-orange-700';
      case 'CHECKOUT': return 'bg-blue-100 text-blue-700';
      case 'CANCELADA': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleRowClick = (id: string) => {
    if (onSelectReservation) onSelectReservation(id);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#111827]">Listado de Reservaciones</h1>
        <div className="flex items-center gap-4">
          <button type="button" className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px] filled">notifications</span>
          </button>
          <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Buscar</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Nombre, email o ID de reserva"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPage(0); fetchReservations(0); } }}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Hotel</label>
            <div className="relative">
              <select
                className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors text-gray-600 appearance-none"
                value={filterHotelId}
                onChange={(e) => { setFilterHotelId(e.target.value); setPage(0); }}
              >
                <option value="">Todos los hoteles</option>
                {hotels.map((h) => (
                  <option key={h.id} value={String(h.id)}>{h.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Check-in desde</label>
            <input
              type="date"
              className="w-full pl-2 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary text-gray-600"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0); }}
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Check-out hasta</label>
            <input
              type="date"
              className="w-full pl-2 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary text-gray-600"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(0); }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Estado</label>
            <div className="relative">
              <select
                className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary text-gray-600 appearance-none"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              >
                <option value="">Todos los estados</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="button" onClick={() => { setPage(0); fetchReservations(0); }} className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
              Filtrar
            </button>
            <button type="button" onClick={() => { setFilterHotelId(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); setSearch(''); setPage(0); fetchReservations(0); }} className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors flex items-center justify-center" title="Limpiar filtros">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/50">
                <th className="py-4 pl-6">ID Reserva</th>
                <th className="py-4">Huésped</th>
                <th className="py-4">Hotel</th>
                <th className="py-4">Check-in/Out</th>
                <th className="py-4">Monto Total</th>
                <th className="py-4">Estado</th>
                <th className="py-4 text-center pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <span className="material-symbols-outlined text-[48px] text-gray-300">event_busy</span>
                      <p className="font-medium">No hay reservaciones</p>
                      {emptyDueToPermissions ? (
                        <p className="text-sm max-w-md text-amber-700 bg-amber-50 p-3 rounded-lg">
                          Tu usuario no tiene rol de administrador. Solo los perfiles con <code className="bg-amber-100 px-1 rounded text-xs">user_type = &apos;admin&apos;</code> en la tabla <code className="bg-amber-100 px-1 rounded text-xs">profiles</code> pueden ver el listado. Pide a un admin que asigne tu perfil como administrador en Admin → Usuarios, o actualiza <code className="bg-amber-100 px-1 rounded text-xs">user_type</code> en Supabase (SQL Editor).
                        </p>
                      ) : (search || filterHotelId || filterStatus || filterDateFrom || filterDateTo) ? (
                        <p className="text-sm max-w-md">No hay resultados con los filtros actuales. Amplía criterios o limpia los filtros (botón de refrescar) para ver todas las reservaciones.</p>
                      ) : (
                        <p className="text-sm max-w-md">Si acabas de configurar la base de datos, ejecuta en Supabase (SQL Editor) el script <code className="bg-gray-100 px-1 rounded text-xs">supabase/scripts/seed_reservations.sql</code> para crear reservaciones de prueba.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="py-4 pl-6 font-bold text-primary cursor-pointer hover:underline" onClick={() => handleRowClick(res.id)}>#{res.id.slice(0, 8)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img src={res.guest.img} alt="" className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-[#111827]">{res.guest.name}</p>
                          <p className="text-xs text-gray-400">{res.guest.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600 font-medium w-[150px]">{res.hotel}</td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700">{res.checkIn} - {res.checkOut}</span>
                        <span className="text-xs text-gray-400">{res.nights} Noches</span>
                      </div>
                    </td>
                    <td className="py-4 font-bold text-[#111827]">{res.total}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-4 text-center pr-6">
                      <div className="flex justify-center gap-2">
                        <button type="button" className="text-gray-400 hover:text-primary transition-colors p-1" onClick={() => handleRowClick(res.id)} title="Ver detalle">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4">
          <span className="text-xs text-gray-400">
            {totalCount === 0 ? '0 reservaciones' : `Mostrando ${from} a ${to} de ${totalCount} reservaciones`}
          </span>
          <div className="flex gap-1">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page < 3 ? i : page - 2 + i;
              if (p < 0 || p >= totalPages) return null;
              return (
                <button type="button" key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-xs font-medium ${p === page ? 'bg-primary text-white shadow-md shadow-blue-200' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {p + 1}
                </button>
              );
            })}
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="px-3 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">calendar_today</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Hoy</div>
            <div className="text-2xl font-bold text-[#111827]">{counts.hoy}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
            <span className="material-symbols-outlined text-[22px] filled">check_circle</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confirmadas</div>
            <div className="text-2xl font-bold text-[#111827]">{counts.confirmadas}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <span className="material-symbols-outlined text-[22px] filled">more_horiz</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pendientes</div>
            <div className="text-2xl font-bold text-[#111827]">{counts.pendientes}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <span className="material-symbols-outlined text-[22px] filled">cancel</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Canceladas</div>
            <div className="text-2xl font-bold text-[#111827]">{counts.canceladas}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
