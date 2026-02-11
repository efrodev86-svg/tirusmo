import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type HotelForm = {
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  stars: number;
  description: string;
  tags: string[];
  isSoldOut: boolean;
};

interface AdminHotelEditProps {
  hotelId: string;
  onBack: () => void;
}

export const AdminHotelEdit: React.FC<AdminHotelEditProps> = ({ hotelId, onBack }) => {
  const [form, setForm] = useState<HotelForm>({
    name: '',
    location: '',
    price: 0,
    rating: 0,
    reviews: 0,
    image: '',
    amenities: [],
    stars: 5,
    description: '',
    tags: [],
    isSoldOut: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { data, error: err } = await supabase
        .from('hotels')
        .select('id, name, location, price, rating, reviews, image, amenities, stars, description, tags, "isSoldOut"')
        .eq('id', idNum)
        .single();
      if (err || !data) {
        if (!cancelled) setError(err?.message || 'Hotel no encontrado');
        setLoading(false);
        return;
      }
      if (!cancelled) {
        setForm({
          name: data.name || '',
          location: data.location || '',
          price: Number(data.price) || 0,
          rating: Number(data.rating) || 0,
          reviews: Number(data.reviews) || 0,
          image: data.image || '',
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          stars: Number(data.stars) || 5,
          description: data.description || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          isSoldOut: Boolean(data.isSoldOut),
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [idNum, validId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validId || !form.name.trim() || !form.location.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('hotels')
        .update({
          name: form.name.trim(),
          location: form.location.trim(),
          price: form.price,
          rating: form.rating,
          reviews: form.reviews,
          image: form.image.trim() || null,
          amenities: form.amenities,
          stars: form.stars,
          description: form.description.trim() || null,
          tags: form.tags,
          isSoldOut: form.isSoldOut,
        })
        .eq('id', idNum);
      if (err) throw err;
      onBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const amenitiesText = form.amenities.join(', ');
  const tagsText = form.tags.join(', ');

  if (!validId || loading) {
    return (
      <div className="p-8">
        {loading && <p className="text-gray-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">Volver</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] leading-tight">Editar información del hotel</h1>
            <p className="text-xs text-gray-400 font-medium">ID: #{hotelId}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 max-w-2xl">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ubicación *</label>
              <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Precio</label>
                <input type="number" min="0" step="0.01" value={form.price || ''} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estrellas</label>
                <select value={form.stars} onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rating</label>
                <input type="number" min="0" max="5" step="0.1" value={form.rating || ''} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nº reviews</label>
                <input type="number" min="0" value={form.reviews || ''} onChange={(e) => setForm((f) => ({ ...f, reviews: Number(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL imagen</label>
                <input type="url" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Amenidades (separadas por coma)</label>
              <input type="text" value={amenitiesText} onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Wifi, Alberca, Spa" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tags (separados por coma)</label>
              <input type="text" value={tagsText} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="playa, lujo" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isSoldOut" checked={form.isSoldOut} onChange={(e) => setForm((f) => ({ ...f, isSoldOut: e.target.checked }))} className="rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="isSoldOut" className="text-sm font-medium text-gray-700">Agotado / Sin disponibilidad</label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
            <button type="button" onClick={onBack} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 shadow-md shadow-blue-200">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
