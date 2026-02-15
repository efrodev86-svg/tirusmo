import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type HotelRow = {
  id: number;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string | null;
  amenities: string[] | null;
  stars: number;
  description: string | null;
  tags: string[] | null;
  isSoldOut: boolean | null;
  partner_id?: string | null;
  created_at?: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
};

interface AdminHotelsProps {
  onSelectHotel?: (id: string) => void;
  onManageRooms?: (hotelId: string) => void;
  /** Navega a la página de registrar hotel (formulario completo como editar). */
  onNavigateToCreate?: () => void;
  /** Navega al catálogo de amenidades. */
  onNavigateToAmenities?: () => void;
  refreshKey?: number;
}

const PAGE_SIZES = [5, 10, 20, 50];

export const AdminHotels: React.FC<AdminHotelsProps> = ({ onSelectHotel, onManageRooms, onNavigateToCreate, onNavigateToAmenities, refreshKey = 0 }) => {
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [roomCounts, setRoomCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCount = async () => {
    let q = supabase.from('hotels').select('id', { count: 'exact', head: true });
    if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,location.ilike.%${search.trim()}%`);
    const { count } = await q;
    return count ?? 0;
  };

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      const total = await fetchCount();
      setTotalCount(total);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      let q = supabase
        .from('hotels')
        .select('id, name, location, price, rating, reviews, image, amenities, stars, description, tags, "isSoldOut", partner_id, created_at, check_in_time, check_out_time')
        .order('id', { ascending: true })
        .range(from, to);
      if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,location.ilike.%${search.trim()}%`);
      const { data, error: err } = await q;
      if (err) throw err;
      const list = (data as HotelRow[]) ?? [];
      setHotels(list);
      if (list.length > 0) {
        const { data: counts } = await supabase.from('rooms').select('hotel_id').in('hotel_id', list.map((h) => h.id));
        const byHotel: Record<number, number> = {};
        (counts ?? []).forEach((r: { hotel_id: number }) => { byHotel[r.hotel_id] = (byHotel[r.hotel_id] || 0) + 1; });
        setRoomCounts(byHotel);
      } else setRoomCounts({});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar hoteles');
      setHotels([]);
      setRoomCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotels(); }, [currentPage, pageSize, search, refreshKey]);

  const handleSearch = () => { setSearch(searchInput); setCurrentPage(1); };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);
  const totalRooms = Object.values(roomCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-[#111827]">Administración de Hoteles</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
            <input type="text" placeholder="Buscar por nombre o ubicación..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 text-gray-600" />
          </div>
          <button type="button" onClick={handleSearch} className="px-4 py-2.5 bg-gray-100 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200">Buscar</button>
          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-200 shrink-0">
            <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500">Mostrar</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white">
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm text-gray-500">por página</span>
        </div>
        <div className="flex gap-2">
          {onNavigateToAmenities && (
            <button type="button" onClick={onNavigateToAmenities} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">tune</span>
              Amenidades
            </button>
          )}
          <button type="button" onClick={() => onNavigateToCreate?.()} className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-blue-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Registrar Hotel
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando hoteles...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/30">
                    <th className="py-4 pl-6">Hotel</th>
                    <th className="py-4">Ubicación</th>
                    <th className="py-4 text-right">Precio</th>
                    <th className="py-4 text-center">Check-in / Check-out</th>
                    <th className="py-4 text-center">Habitaciones</th>
                    <th className="py-4 text-center">Rating</th>
                    <th className="py-4 text-center">Estado</th>
                    <th className="py-4 text-center pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {hotels.map((hotel) => (
                    <tr key={hotel.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3 min-w-[200px] cursor-pointer group/hotel" onClick={() => onSelectHotel?.(String(hotel.id))}>
                          <img src={hotel.image || 'https://ui-avatars.com/api/?name=H&background=e5e7eb&color=6b7280'} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover/hotel:scale-105 transition-transform" />
                          <div>
                            <p className="font-bold text-[#111827] group-hover/hotel:text-primary">{hotel.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">ID: #{hotel.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-600 min-w-[150px]">{hotel.location}</td>
                      <td className="py-4 text-right font-medium">${Number(hotel.price).toLocaleString()}</td>
                      <td className="py-4 text-center text-sm text-gray-600">
                        {hotel.check_in_time || '15:00'} / {hotel.check_out_time || '11:00'}
                      </td>
                      <td className="py-4 text-center font-medium text-[#111827]">{roomCounts[hotel.id] ?? 0}</td>
                      <td className="py-4 text-center">
                        <span className="inline-flex items-center gap-0.5 text-yellow-600 font-medium">
                          <span className="material-symbols-outlined text-[16px] filled">star</span>
                          {Number(hotel.rating)}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${hotel.isSoldOut ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {hotel.isSoldOut ? 'Agotado' : 'Activo'}
                        </span>
                      </td>
                      <td className="py-4 pr-6">
                        <div className="flex justify-end items-center">
                          <button
                            type="button"
                            onClick={() => (onManageRooms ? onManageRooms(String(hotel.id)) : onSelectHotel?.(String(hotel.id)))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                          >
                            <span className="material-symbols-outlined text-[16px]">bed</span>
                            Gestionar habitaciones / Inventario
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hotels.length === 0 && !loading && <div className="p-8 text-center text-gray-500">No hay hoteles que coincidan.</div>}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-4 bg-gray-50/30">
              <span className="text-xs text-gray-400 font-medium">Mostrando {from}-{to} de {totalCount} hoteles</span>
              <div className="flex gap-2">
                <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <button key={p} type="button" onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center ${currentPage === p ? 'bg-primary text-white shadow-md shadow-blue-200' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                  );
                })}
                <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">hotel</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Hoteles</div>
            <div className="text-2xl font-bold text-[#111827]">{totalCount}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
            <span className="material-symbols-outlined text-[24px] filled">check_circle</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Activos</div>
            <div className="text-2xl font-bold text-[#111827]">{hotels.filter((h) => !h.isSoldOut).length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
            <span className="material-symbols-outlined text-[24px] filled">bed</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Habitaciones (página)</div>
            <div className="text-2xl font-bold text-[#111827]">{totalRooms}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500">
            <span className="material-symbols-outlined text-[24px] filled">star</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rating promedio</div>
            <div className="text-2xl font-bold text-[#111827]">{hotels.length ? (hotels.reduce((a, h) => a + Number(h.rating), 0) / hotels.length).toFixed(1) : '—'}</div>
          </div>
        </div>
      </div>

    </div>
  );
};
