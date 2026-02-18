import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const STATUS_OPTIONS = ['PENDIENTE', 'CONFIRMADA', 'CHECKOUT', 'CANCELADA'] as const;

type ReservationRow = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestImg: string;
  room: string;
  guestsDetail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: string;
};

interface PartnerReservationsProps {
  hotelId: number | null;
  onSelectReservation?: (id: string) => void;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function formatShortId(uuid: string): string {
  if (!uuid) return '—';
  const part = uuid.split('-')[0] || uuid;
  return part.length >= 8 ? part.slice(0, 8).toUpperCase() : part.toUpperCase();
}

const statusLabel: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CHECKOUT: 'Check-out',
  CANCELADA: 'Cancelada',
};

const statusColor: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMADA: 'bg-green-100 text-green-700 border-green-200',
  CHECKOUT: 'bg-blue-100 text-blue-700 border-blue-200',
  CANCELADA: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const PartnerReservations: React.FC<PartnerReservationsProps> = ({ hotelId, onSelectReservation }) => {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [counts, setCounts] = useState({ total: 0, confirmadas: 0, pendientes: 0, canceladas: 0, llegadasHoy: 0 });

  // Reservaciones del hotel (por hotel_id), no las del usuario/partner
  const fetchReservations = useCallback(async () => {
    if (hotelId == null || hotelId <= 0) {
      setReservations([]);
      setCounts({ total: 0, confirmadas: 0, pendientes: 0, canceladas: 0, llegadasHoy: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('reservations')
        .select('id, user_id, hotel_id, room_id, check_in, check_out, total, status, guests, created_at, data, rooms(name)')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (err) throw err;

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

      const today = new Date().toISOString().slice(0, 10);
      let llegadasHoy = 0;

      const rows: ReservationRow[] = list.map((r) => {
        const profile = (r.user_id ? profilesMap[r.user_id as string] : null) || null;
        const room = r.rooms as { name?: string } | null;
        const guestData = (r.data as { guest_first_name?: string; guest_last_name?: string; guest_email?: string } | null) || null;
        const dataName = guestData ? [guestData.guest_first_name, guestData.guest_last_name].filter(Boolean).join(' ').trim() : '';
        const guestName = dataName || profile?.full_name || profile?.email || 'Sin nombre';
        const guestEmail = (guestData?.guest_email && guestData.guest_email.trim()) ? guestData.guest_email : (profile?.email || '');
        const checkIn = String(r.check_in || '');
        const checkOut = String(r.check_out || '');
        const nights = r.check_in && r.check_out
          ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        if (checkIn.slice(0, 10) === today) llegadasHoy += 1;
        return {
          id: String(r.id),
          guestName,
          guestEmail,
          guestImg: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=random`,
          room: room?.name || '—',
          guestsDetail: `${Number(r.guests) || 1} huésped(es)`,
          checkIn: formatDate(checkIn || null),
          checkOut: formatDate(checkOut || null),
          nights,
          total: Number(r.total) || 0,
          status: String(r.status || 'PENDIENTE'),
        };
      });

      setReservations(rows);
      setCounts({
        total: rows.length,
        confirmadas: rows.filter((r) => r.status === 'CONFIRMADA').length,
        pendientes: rows.filter((r) => r.status === 'PENDIENTE').length,
        canceladas: rows.filter((r) => r.status === 'CANCELADA').length,
        llegadasHoy,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar reservaciones');
      setReservations([]);
      setCounts({ total: 0, confirmadas: 0, pendientes: 0, canceladas: 0, llegadasHoy: 0 });
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const filtered = reservations.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.guestName.toLowerCase().includes(q) ||
        (r.guestEmail && r.guestEmail.toLowerCase().includes(q)) ||
        formatShortId(r.id).toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (hotelId == null || hotelId <= 0) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full">
        <h1 className="text-2xl font-bold text-[#111827]">Reservaciones del hotel</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Sin hotel asignado</p>
          <p className="text-sm text-amber-700 mt-1">Contacte al administrador para ver las reservaciones de su hotel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Reservaciones del hotel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Todas las reservaciones de tu hotel</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors" onClick={() => fetchReservations()} title="Actualizar">
            <span className="material-symbols-outlined text-[20px] filled">refresh</span>
          </button>
          <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
            <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">BÚSQUEDA</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="ID o nombre de huésped"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">ESTADO</label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white appearance-none cursor-pointer"
              >
                <option value="">Todos los estados</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{statusLabel[s] || s}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-[20px] pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando reservaciones...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-white">
                    <th className="py-4 pl-6 w-[120px]">ID RESERVA</th>
                    <th className="py-4 w-[250px]">HUÉSPED</th>
                    <th className="py-4 w-[180px]">HABITACIÓN</th>
                    <th className="py-4 text-center">FECHAS</th>
                    <th className="py-4 text-center">MONTO TOTAL</th>
                    <th className="py-4 text-center">ESTADO</th>
                    <th className="py-4 text-right pr-6">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((res) => (
                    <tr
                      key={res.id}
                      onClick={() => onSelectReservation?.(res.id)}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 pl-6">
                        <span className="font-bold text-[#1E3A8A] group-hover:underline">#{formatShortId(res.id)}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img src={res.guestImg} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt={res.guestName} />
                          <div>
                            <p className="font-bold text-[#111827]">{res.guestName}</p>
                            <p className="text-xs text-gray-400">{res.guestEmail || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-medium text-gray-700">{res.room}</p>
                        <p className="text-xs text-gray-400">{res.guestsDetail}</p>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-gray-700">{res.checkIn} – {res.checkOut}</span>
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-1">{res.nights} NOCHES</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-bold text-[#111827] text-base">${res.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${statusColor[res.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabel[res.status] || res.status}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-6">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectReservation?.(res.id); }}
                          className="bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4 mt-auto bg-white">
              <span className="text-xs text-gray-400 font-medium">Mostrando {filtered.length} de {counts.total} reservaciones del hotel</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#EFF6FF] p-5 rounded-2xl border border-[#DBEAFE] shadow-sm">
          <div className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider mb-2">LLEGADAS HOY</div>
          <div className="text-3xl font-bold text-[#1E3A8A]">{counts.llegadasHoy}</div>
        </div>
        <div className="bg-[#FFF7ED] p-5 rounded-2xl border border-[#FFEDD5] shadow-sm">
          <div className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider mb-2">PENDIENTES</div>
          <div className="text-3xl font-bold text-[#7C2D12]">{counts.pendientes}</div>
        </div>
        <div className="bg-[#ECFDF5] p-5 rounded-2xl border border-[#D1FAE5] shadow-sm">
          <div className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-2">CONFIRMADAS</div>
          <div className="text-3xl font-bold text-[#064E3B]">{counts.confirmadas}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">TOTAL</div>
          <div className="text-3xl font-bold text-[#111827]">{counts.total}</div>
        </div>
      </div>
    </div>
  );
};
