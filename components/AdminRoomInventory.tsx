import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AdminRoomInventoryProps {
  hotelId: string;
  onBack: () => void;
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
const AMENITIES_OPTIONS = [
  { name: 'Wifi 6', icon: 'wifi' },
  { name: 'Clima', icon: 'ac_unit' },
  { name: 'Jacuzzi', icon: 'hot_tub' },
  { name: '4K Smart TV', icon: 'tv' },
  { name: 'Minibar', icon: 'local_bar' },
  { name: 'Café', icon: 'coffee_maker' },
  { name: 'Balcón', icon: 'balcony' },
  { name: 'Servicio 24h', icon: 'room_service' },
];

export const AdminRoomInventory: React.FC<AdminRoomInventoryProps> = ({ hotelId, onBack }) => {
  const [hotel, setHotel] = useState<{ name: string; location: string; image: string | null } | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(''); // '' = todos
  const [search, setSearch] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'ESTÁNDAR', price: 0, status: 'DISPONIBLE' as const, image: '', amenities: [] as string[] });

  const idNum = Number(hotelId);
  const validId = !Number.isNaN(idNum) && idNum > 0;

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      setError('ID de hotel inválido');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: hotelRow, error: hotelErr } = await supabase.from('hotels').select('name, location, image').eq('id', idNum).single();
        if (hotelErr) throw hotelErr;
        if (hotelRow && !cancelled) setHotel({ name: hotelRow.name, location: hotelRow.location, image: hotelRow.image || null });

        const { data: roomsData, error: roomsErr } = await supabase.from('rooms').select('id, hotel_id, name, type, price, status, image, amenities').eq('hotel_id', idNum).order('id');
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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        if (!cancelled) setLoading(false);
      }
      return () => { cancelled = true; };
    })();
  }, [idNum, validId]);

  const filteredRooms = rooms.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    }
    return true;
  });

  const total = rooms.length;
  const disponibles = rooms.filter((r) => r.status === 'DISPONIBLE').length;
  const ocupadas = rooms.filter((r) => r.status === 'OCUPADA').length;
  const mantenimiento = rooms.filter((r) => r.status === 'MANTENIMIENTO').length;
  const ocupacionPct = total ? Math.round((ocupadas / total) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DISPONIBLE': return 'bg-[#10B981] text-white';
      case 'OCUPADA': return 'bg-[#3B82F6] text-white';
      case 'MANTENIMIENTO': return 'bg-[#F97316] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const toggleEditAmenity = (amenityName: string) => {
    if (!editingRoom) return;
    const has = editingRoom.amenities.includes(amenityName);
    const next = has ? editingRoom.amenities.filter((a) => a !== amenityName) : [...editingRoom.amenities, amenityName];
    setEditingRoom({ ...editingRoom, amenities: next });
  };

  const handleSaveEdit = async () => {
    if (!editingRoom) return;
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('rooms')
        .update({ name: editingRoom.name, type: editingRoom.type, price: editingRoom.price, status: editingRoom.status, image: editingRoom.image || '', amenities: editingRoom.amenities })
        .eq('id', editingRoom.id);
      if (err) throw err;
      setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? editingRoom : r)));
      setEditingRoom(null);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    setSaving(true);
    try {
      const { data, error: err } = await supabase
        .from('rooms')
        .insert({ hotel_id: idNum, name: newRoom.name.trim(), type: newRoom.type, price: newRoom.price, status: newRoom.status, image: newRoom.image || '', amenities: newRoom.amenities })
        .select('id, hotel_id, name, type, price, status, image, amenities')
        .single();
      if (err) throw err;
      const inserted: Room = { id: data.id, hotel_id: data.hotel_id, name: data.name, type: data.type, price: Number(data.price), status: data.status, image: data.image || '', amenities: Array.isArray(data.amenities) ? data.amenities : [] };
      setRooms((prev) => [...prev, inserted]);
      setShowCreateModal(false);
      setNewRoom({ name: '', type: 'ESTÁNDAR', price: 0, status: 'DISPONIBLE', image: '', amenities: [] });
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoomId) return;
    setSaving(true);
    try {
      const { error: err } = await supabase.from('rooms').delete().eq('id', deletingRoomId);
      if (err) throw err;
      setRooms((prev) => prev.filter((r) => r.id !== deletingRoomId));
      setDeletingRoomId(null);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!validId || error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error || 'Hotel inválido'}</p>
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold">Volver</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-20 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button type="button" onClick={onBack} className="cursor-pointer hover:text-primary">Hoteles</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-bold text-primary">{hotel?.name ?? '…'}</span>
        </div>
        <h1 className="text-xl font-bold text-[#111827]">Control de inventario de habitaciones</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[160px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
            <input type="text" placeholder="Buscar habitación..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button type="button" onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-200 whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva Habitación
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando habitaciones...</div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 bg-gray-100">
              {hotel?.image ? <img src={hotel.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-4xl">hotel</span></div>}
            </div>
            <div className="flex-1 w-full">
              <h2 className="text-2xl font-bold text-[#111827]">{hotel?.name}</h2>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[18px]">location_on</span>{hotel?.location}</p>
              <div className="flex flex-wrap gap-8 mt-4">
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p><p className="text-xl font-bold text-[#111827]">{total}</p></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Disponibles</p><p className="text-xl font-bold text-green-600">{disponibles}</p></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ocupación</p><p className="text-xl font-bold text-[#111827]">{ocupacionPct}%</p></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mantenimiento</p><p className="text-xl font-bold text-orange-500">{mantenimiento}</p></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setStatusFilter('')} className={`px-4 py-2 rounded-lg text-sm font-bold ${!statusFilter ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Todos</button>
              {STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-bold ${statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
              ))}
            </div>
            <span className="text-xs text-gray-400 font-medium">Mostrando {filteredRooms.length} de {total} habitaciones</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-48 relative overflow-hidden bg-gray-100">
                  {room.image ? <img src={room.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-5xl">bed</span></div>}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(room.status)}`}>{room.status}</div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-[#111827] leading-tight">{room.name}</h3>
                    <div className="text-right"><span className="text-xl font-bold text-primary">${Number(room.price).toLocaleString()}</span><p className="text-[9px] text-gray-400 uppercase font-bold">POR NOCHE</p></div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">HAB. {room.id} • {room.type}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
                    {(room.amenities || []).slice(0, 4).map((a, i) => (
                      <span key={i} className="text-gray-500 text-xs">{a}</span>
                    ))}
                  </div>
                  <div className="flex gap-3 border-t border-gray-100 pt-4">
                    <button type="button" onClick={() => setEditingRoom({ ...room })} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">Editar</button>
                    <button type="button" onClick={() => setDeletingRoomId(room.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-100 text-sm font-bold text-red-500 hover:bg-red-50">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredRooms.length === 0 && !loading && <div className="p-8 text-center text-gray-500">No hay habitaciones con los filtros actuales.</div>}
        </>
      )}

      {/* Edit modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setEditingRoom(null)} aria-hidden />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar habitación</h2>
              <button type="button" onClick={() => setEditingRoom(null)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined text-2xl">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-gray-700">Nombre</label><input type="text" value={editingRoom.name} onChange={(e) => setEditingRoom((r) => r ? { ...r, name: e.target.value } : null)} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-700">Tipo</label><select value={editingRoom.type} onChange={(e) => setEditingRoom((r) => r ? { ...r, type: e.target.value } : null)} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">{ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-700">Precio/noche</label><input type="number" min="0" value={editingRoom.price} onChange={(e) => setEditingRoom((r) => r ? { ...r, price: Number(e.target.value) } : null)} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-700">Estado</label><div className="flex gap-2 mt-1">{STATUSES.map((s) => (<button key={s} type="button" onClick={() => setEditingRoom((r) => r ? { ...r, status: s } : null)} className={`px-3 py-2 rounded-lg text-xs font-bold ${editingRoom.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{s}</button>))}</div></div>
              <div><label className="text-xs font-bold text-gray-700">URL imagen</label><input type="url" value={editingRoom.image} onChange={(e) => setEditingRoom((r) => r ? { ...r, image: e.target.value } : null)} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-700">Amenidades</label><div className="flex flex-wrap gap-2 mt-2">{AMENITIES_OPTIONS.map((a) => (<button key={a.name} type="button" onClick={() => toggleEditAmenity(a.name)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editingRoom.amenities.includes(a.name) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{a.name}</button>))}</div></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingRoom(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-lg disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} aria-hidden />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nueva habitación</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined text-2xl">close</span></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-gray-700">Nombre *</label><input type="text" value={newRoom.name} onChange={(e) => setNewRoom((r) => ({ ...r, name: e.target.value }))} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
              <div><label className="text-xs font-bold text-gray-700">Tipo</label><select value={newRoom.type} onChange={(e) => setNewRoom((r) => ({ ...r, type: e.target.value }))} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">{ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-700">Precio/noche</label><input type="number" min="0" value={newRoom.price || ''} onChange={(e) => setNewRoom((r) => ({ ...r, price: Number(e.target.value) || 0 }))} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-700">Estado</label><select value={newRoom.status} onChange={(e) => setNewRoom((r) => ({ ...r, status: e.target.value as typeof newRoom.status }))} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-700">URL imagen</label><input type="url" value={newRoom.image} onChange={(e) => setNewRoom((r) => ({ ...r, image: e.target.value }))} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-700">Amenidades</label><div className="flex flex-wrap gap-2 mt-2">{AMENITIES_OPTIONS.map((a) => (<button key={a.name} type="button" onClick={() => setNewRoom((r) => ({ ...r, amenities: r.amenities.includes(a.name) ? r.amenities.filter((x) => x !== a.name) : [...r.amenities, a.name] }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${newRoom.amenities.includes(a.name) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{a.name}</button>))}</div></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-lg disabled:opacity-50">{saving ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRoomId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeletingRoomId(null)} aria-hidden />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] relative z-10 p-8 text-center">
            <h2 className="text-xl font-bold text-[#111827] mb-3">¿Eliminar habitación?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeletingRoomId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">Cancelar</button>
              <button type="button" onClick={handleConfirmDelete} disabled={saving} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">{saving ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
