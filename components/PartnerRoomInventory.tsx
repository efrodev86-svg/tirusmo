import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PartnerRoomInventoryProps {
  hotelId: number | null;
  onCreateRoom: () => void;
  onEditRoom: (id: number) => void;
}

type Room = {
  id: number;
  hotel_id: number;
  name: string;
  type: string;
  price: number;
  status: string;
  image: string;
  amenities: string[];
};

const ROOM_TYPES = ['ESTÁNDAR', 'DOBLE DELUXE', 'SUITE', 'SUITE DE LUJO', 'PREMIUM'];
const STATUSES = ['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO'] as const;

const statusLabel: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCUPADA: 'Ocupada',
  MANTENIMIENTO: 'En Mantenimiento',
};

export const PartnerRoomInventory: React.FC<PartnerRoomInventoryProps> = ({ hotelId, onCreateRoom, onEditRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roomToDelete, setRoomToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (hotelId == null || hotelId <= 0) {
      setLoading(false);
      setRooms([]);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: roomsData, error: roomsErr } = await supabase
          .from('rooms')
          .select('id, hotel_id, name, type, price, status, image, amenities')
          .eq('hotel_id', hotelId)
          .order('id');
        if (roomsErr) throw roomsErr;
        const list: Room[] = (roomsData ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as number,
          hotel_id: r.hotel_id as number,
          name: (r.name as string) || '',
          type: (r.type as string) || 'ESTÁNDAR',
          price: Number(r.price) || 0,
          status: (r.status as string) || 'DISPONIBLE',
          image: (r.image as string) || '',
          amenities: Array.isArray(r.amenities) ? (r.amenities as string[]) : [],
        }));
        if (!cancelled) setRooms(list);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar habitaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [hotelId]);

  const filteredRooms = rooms.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const total = rooms.length;
  const disponibles = rooms.filter((r) => r.status === 'DISPONIBLE').length;
  const ocupadas = rooms.filter((r) => r.status === 'OCUPADA').length;
  const mantenimiento = rooms.filter((r) => r.status === 'MANTENIMIENTO').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONIBLE': return 'bg-green-100 text-green-700';
      case 'OCUPADA': return 'bg-blue-100 text-blue-700';
      case 'MANTENIMIENTO': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;
    setDeleting(true);
    try {
      const { error: err } = await supabase.from('rooms').delete().eq('id', roomToDelete);
      if (err) throw err;
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete));
      setRoomToDelete(null);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  if (hotelId == null || hotelId <= 0) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full">
        <h1 className="text-2xl font-bold text-[#111827]">Inventario de Habitaciones</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Sin hotel asignado</p>
          <p className="text-sm text-amber-700 mt-1">Contacte al administrador para que asocie su cuenta a un hotel y pueda gestionar las habitaciones.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full">
        <h1 className="text-2xl font-bold text-[#111827]">Inventario de Habitaciones</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full relative">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-[#111827]">Inventario de Habitaciones</h1>
        <div className="flex items-center gap-4">
          <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px] filled">notifications</span>
          </button>
          <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
            <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos los tipos</option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Estado</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel[s] || s}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
          </div>
        </div>
        <button
          onClick={onCreateRoom}
          className="bg-[#1E3A8A] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nueva Habitación
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando habitaciones...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 pl-6">IMAGEN</th>
                    <th className="py-4">NOMBRE</th>
                    <th className="py-4">TIPO</th>
                    <th className="py-4 text-center">PRECIO BASE</th>
                    <th className="py-4 text-center">ESTADO</th>
                    <th className="py-4 text-right pr-6">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredRooms.map((room) => (
                    <tr
                      key={room.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onEditRoom(room.id)}
                    >
                      <td className="py-4 pl-6">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          {room.image ? (
                            <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="material-symbols-outlined text-[24px]">bed</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-[#111827]">{room.name}</p>
                        {room.amenities.length > 0 && (
                          <p className="text-xs text-gray-400">{room.amenities.slice(0, 3).join(' · ')}</p>
                        )}
                      </td>
                      <td className="py-4 text-gray-600">{room.type}</td>
                      <td className="py-4 text-center">
                        <p className="font-bold text-[#111827]">${Number(room.price).toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">Por noche</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusColor(room.status)}`}>
                          {statusLabel[room.status] || room.status}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-6">
                        <div className="flex justify-end gap-2 text-gray-400" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditRoom(room.id); }}
                            className="hover:text-primary transition-colors"
                            title="Ver / Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditRoom(room.id); }}
                            className="hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRoomToDelete(room.id); }}
                            className="hover:text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4 mt-auto bg-white">
              <span className="text-xs text-gray-400 font-medium">Mostrando {filteredRooms.length} de <span className="text-gray-900 font-bold">{total}</span> habitaciones</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
            <span className="material-symbols-outlined text-[20px] filled">check_circle</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DISPONIBLES</div>
            <div className="text-2xl font-bold text-[#111827]">{disponibles}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <span className="material-symbols-outlined text-[20px] filled">bed</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OCUPADAS</div>
            <div className="text-2xl font-bold text-[#111827]">{ocupadas}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <span className="material-symbols-outlined text-[20px] filled">build</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">EN MANTENIMIENTO</div>
            <div className="text-2xl font-bold text-[#111827]">{mantenimiento}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
            <span className="material-symbols-outlined text-[20px] filled">analytics</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL HABITACIONES</div>
            <div className="text-2xl font-bold text-[#111827]">{total}</div>
          </div>
        </div>
      </div>

      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => !deleting && setRoomToDelete(null)} aria-hidden />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-3xl text-red-600 filled">delete</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar habitación?</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Estás a punto de eliminar esta habitación del inventario. <br />
                <span className="font-semibold text-gray-700">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRoomToDelete(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200 text-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-200 text-sm disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
