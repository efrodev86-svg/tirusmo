import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AmenityRow = {
  id: number;
  slug: string;
  label: string;
  category: string;
  sort_order: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  conectividad: 'Conectividad',
  alberca_wellness: 'Alberca y bienestar',
  comida_bebida: 'Comida y bebida',
  habitacion: 'Habitación',
  servicios: 'Servicios',
  familia_mascotas: 'Familia y mascotas',
  deportes: 'Deportes',
  accesibilidad: 'Accesibilidad',
  general: 'General',
};

const CATEGORY_OPTIONS = [
  { value: 'conectividad', label: 'Conectividad' },
  { value: 'alberca_wellness', label: 'Alberca y bienestar' },
  { value: 'comida_bebida', label: 'Comida y bebida' },
  { value: 'habitacion', label: 'Habitación' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'familia_mascotas', label: 'Familia y mascotas' },
  { value: 'deportes', label: 'Deportes' },
  { value: 'accesibilidad', label: 'Accesibilidad' },
  { value: 'general', label: 'General' },
];

interface AdminAmenitiesProps {
  onBack: () => void;
}

export const AdminAmenities: React.FC<AdminAmenitiesProps> = ({ onBack }) => {
  const [items, setItems] = useState<AmenityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ slug: '', label: '', category: 'general', sort_order: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ slug: '', label: '', category: 'general', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAmenities = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('amenity_catalog')
        .select('id, slug, label, category, sort_order')
        .order('category')
        .order('sort_order');
      if (err) throw err;
      setItems((data as AmenityRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar amenidades');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAmenities(); }, []);

  const startEdit = (row: AmenityRow) => {
    setEditingId(row.id);
    setEditForm({ slug: row.slug, label: row.label, category: row.category, sort_order: row.sort_order });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('amenity_catalog')
        .update({ slug: editForm.slug.trim(), label: editForm.label.trim(), category: editForm.category, sort_order: editForm.sort_order })
        .eq('id', editingId);
      if (err) throw err;
      setEditingId(null);
      await fetchAmenities();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const createAmenity = async () => {
    const slug = createForm.slug.trim().toLowerCase().replace(/\s+/g, '_');
    const label = createForm.label.trim();
    if (!slug || !label) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('amenity_catalog')
        .insert({ slug, label, category: createForm.category, sort_order: createForm.sort_order });
      if (err) throw err;
      setShowCreate(false);
      setCreateForm({ slug: '', label: '', category: 'general', sort_order: 0 });
      await fetchAmenities();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const deleteAmenity = async (id: number) => {
    if (!window.confirm('¿Eliminar esta amenidad del catálogo? Los hoteles que la usen seguirán teniendo el slug guardado.')) return;
    setDeletingId(id);
    setError(null);
    try {
      const { error: err } = await supabase.from('amenity_catalog').delete().eq('id', id);
      if (err) throw err;
      await fetchAmenities();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const byCategory = items.reduce<Record<string, AmenityRow[]>>((acc, row) => {
    (acc[row.category] ??= []).push(row);
    return acc;
  }, {});

  const sortedCategories = [...new Set(items.map((r) => r.category))].sort();
  const displayCategory = (cat: string) => CATEGORY_LABELS[cat] ?? cat;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Catálogo de amenidades</h1>
            <p className="text-sm text-gray-500">Lista maestra para asignar a hoteles y usar en filtros.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-blue-200 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Nueva amenidad
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-lg text-[#111827] mb-4">Nueva amenidad</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Slug (ej. cancha_tenis)</label>
              <input
                type="text"
                value={createForm.slug}
                onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                placeholder="cancha_tenis"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Etiqueta (texto a mostrar)</label>
              <input
                type="text"
                value={createForm.label}
                onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Cancha de tenis"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Orden</label>
              <input
                type="number"
                min="0"
                value={createForm.sort_order}
                onChange={(e) => setCreateForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="button" onClick={createAmenity} disabled={saving || !createForm.slug.trim() || !createForm.label.trim()} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-50">Guardar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">Cargando amenidades...</div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedCategories.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No hay amenidades en el catálogo. Crea la primera arriba.</div>
          ) : (
            sortedCategories.map((category) => (
              <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-bold text-[#111827]">{displayCategory(category)}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {(byCategory[category] ?? []).sort((a, b) => a.sort_order - b.sort_order).map((row) => (
                    <li key={row.id} className="px-6 py-3 flex items-center justify-between gap-4">
                      {editingId === row.id ? (
                        <>
                          <div className="flex flex-wrap gap-3 flex-1">
                            <input
                              type="text"
                              value={editForm.slug}
                              onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                              className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              placeholder="slug"
                            />
                            <input
                              type="text"
                              value={editForm.label}
                              onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                              className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              placeholder="Etiqueta"
                            />
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            >
                              {CATEGORY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={editForm.sort_order}
                              onChange={(e) => setEditForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={cancelEdit} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                            <button type="button" onClick={saveEdit} disabled={saving} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50">Guardar</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 min-w-0">
                            <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded shrink-0">{row.slug}</code>
                            <span className="font-medium text-[#111827] truncate">{row.label}</span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => startEdit(row)} className="px-3 py-1.5 text-primary hover:bg-blue-50 rounded-lg text-xs font-bold">Editar</button>
                            <button type="button" onClick={() => deleteAmenity(row.id)} disabled={deletingId === row.id} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold disabled:opacity-50">Eliminar</button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
