import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ROOM_TYPES = ['ESTÁNDAR', 'DOBLE DELUXE', 'SUITE', 'SUITE DE LUJO', 'PREMIUM'];
const STATUSES = ['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO'] as const;
const AMENITIES_OPTIONS = [
  'Wifi 6', 'Clima', 'Jacuzzi', '4K Smart TV', 'Minibar', 'Café', 'Balcón', 'Servicio 24h',
];

interface PartnerRoomDetailProps {
  hotelId: number | null;
  roomId: number | null;
  onBack: () => void;
}

export const PartnerRoomDetail: React.FC<PartnerRoomDetailProps> = ({ hotelId, roomId, onBack }) => {
  const [loading, setLoading] = useState(!!roomId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ESTÁNDAR' as string,
    price: 0,
    status: 'DISPONIBLE' as (typeof STATUSES)[number],
    image: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    if (roomId == null || roomId <= 0) {
      setLoading(false);
      if (hotelId != null && hotelId > 0) {
        setFormData({
          name: '',
          type: 'ESTÁNDAR',
          price: 0,
          status: 'DISPONIBLE',
          image: '',
          amenities: [],
        });
      }
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await supabase
          .from('rooms')
          .select('id, name, type, price, status, image, amenities')
          .eq('id', roomId)
          .single();
        if (fetchErr) throw fetchErr;
        if (cancelled || !data) return;
        setFormData({
          name: (data.name as string) || '',
          type: (data.type as string) || 'ESTÁNDAR',
          price: Number(data.price) || 0,
          status: (data.status as (typeof STATUSES)[number]) || 'DISPONIBLE',
          image: (data.image as string) || '',
          amenities: Array.isArray(data.amenities) ? (data.amenities as string[]) : [],
        });
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar habitación');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (roomId != null && roomId > 0) {
      setSaving(true);
      setError(null);
      try {
        const { error: updateErr } = await supabase
          .from('rooms')
          .update({
            name: formData.name.trim(),
            type: formData.type,
            price: formData.price,
            status: formData.status,
            image: formData.image || '',
            amenities: formData.amenities,
          })
          .eq('id', roomId);
        if (updateErr) throw updateErr;
        onBack();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al guardar');
      } finally {
        setSaving(false);
      }
    } else {
      if (hotelId == null || hotelId <= 0) {
        setError('No hay hotel asignado. No se puede crear la habitación.');
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const { error: insertErr } = await supabase.from('rooms').insert({
          hotel_id: hotelId,
          name: formData.name.trim(),
          type: formData.type,
          price: formData.price,
          status: formData.status,
          image: formData.image || '',
          amenities: formData.amenities,
        });
        if (insertErr) throw insertErr;
        onBack();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al crear habitación');
      } finally {
        setSaving(false);
      }
    }
  };

  if (hotelId == null && (roomId == null || roomId <= 0)) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
        <div className="flex justify-between items-center mb-2">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-[#111827]">Nueva Habitación</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Sin hotel asignado</p>
          <p className="text-sm text-amber-700 mt-1">No se puede crear una habitación sin un hotel asociado.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
        <div className="flex justify-between items-center mb-2">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-[#111827]">Editar Habitación</h1>
        </div>
        <div className="p-8 text-center text-gray-500">Cargando habitación...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-[#111827]">
            {roomId ? 'Editar Habitación' : 'Nueva Habitación'}
          </h1>
        </div>
        <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
          <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col gap-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[22px] filled">info</span>
            Información Básica
          </h3>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Nombre de la Habitación *</label>
              <input
                type="text"
                placeholder="Ej: Suite Vista al Mar"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700 placeholder:text-gray-300"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Tipo de Habitación</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Estado</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as (typeof STATUSES)[number] })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s === 'DISPONIBLE' ? 'Disponible' : s === 'OCUPADA' ? 'Ocupada' : 'En Mantenimiento'}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Precio / Noche ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">URL de imagen</label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700 placeholder:text-gray-300"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[22px] filled">cleaning_services</span>
            Amenidades
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {AMENITIES_OPTIONS.map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:border-gray-300 transition-colors bg-white group"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border border-gray-300 text-primary focus:ring-primary"
                  checked={formData.amenities.includes(item)}
                  onChange={() => toggleAmenity(item)}
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Habitación'}
          </button>
        </div>
      </form>
    </div>
  );
};
