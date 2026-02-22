import React, { useEffect, useState, useRef } from 'react';
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

  const BUCKET_ROOM_IMAGES = 'hotel-room-images';
  const [galleryImages, setGalleryImages] = useState<{ id: number; url: string; sort_order: number; description: string | null; url_medium?: string | null; url_small?: string | null }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [deleteConfirmImage, setDeleteConfirmImage] = useState<{ id: number; url: string; url_medium?: string | null; url_small?: string | null } | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropPct, setCropPct] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [cropNatural, setCropNatural] = useState<{ w: number; h: number } | null>(null);
  const [cropDisplay, setCropDisplay] = useState<{ w: number; h: number } | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const cropDragRef = useRef<{ active: boolean; startX: number; startY: number; startLeft: number; startTop: number }>({ active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  const CROP_ASPECT = 4 / 3;
  const CROP_PREVIEW_MAX = { w: 640, h: 480 };
  const CROP_OUTPUT_SIZES = [{ w: 720, h: 480 }, { w: 420, h: 280 }] as const;
  const WEBP_QUALITY = 0.88;

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

  useEffect(() => {
    if (!editingRoom) {
      setGalleryImages([]);
      return;
    }
    let cancelled = false;
    setGalleryLoading(true);
    const selectFull = 'id, url, sort_order, description, url_medium, url_small';
    const selectMinimal = 'id, url, sort_order';
    supabase
      .from('room_images')
      .select(selectFull)
      .eq('room_id', editingRoom.id)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const rows = data as { id: number; url: string; sort_order: number; description?: string | null; url_medium?: string | null; url_small?: string | null }[];
          setGalleryImages(rows.map((r) => ({ ...r, description: r.description ?? null, url_medium: r.url_medium ?? null, url_small: r.url_small ?? null })));
          setGalleryLoading(false);
          return;
        }
        if (error && !/column|description|url_medium|url_small|schema/i.test(String(error.message))) {
          setGalleryImages([]);
          setGalleryLoading(false);
          return;
        }
        supabase
          .from('room_images')
          .select(selectMinimal)
          .eq('room_id', editingRoom.id)
          .order('sort_order', { ascending: true })
          .then(({ data: data2, error: err2 }) => {
            if (cancelled) return;
            if (err2) {
              setGalleryImages([]);
              return;
            }
            const rows = (data2 ?? []) as { id: number; url: string; sort_order: number }[];
            setGalleryImages(rows.map((r) => ({ ...r, description: null, url_medium: null, url_small: null })));
          })
          .finally(() => { if (!cancelled) setGalleryLoading(false); });
      });
    return () => { cancelled = true; };
  }, [editingRoom?.id]);

  const openCropStep = (file: File) => {
    setUploadError(null);
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceFile(file);
    setCropSourceUrl(URL.createObjectURL(file));
    setCropPct(null);
    setCropNatural(null);
    setCropDisplay(null);
  };

  const closeCropStep = () => {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceFile(null);
    setCropSourceUrl(null);
    setCropPct(null);
    setCropNatural(null);
    setCropDisplay(null);
  };

  const onCropImageLoad = () => {
    const img = cropImageRef.current;
    if (!img || !cropSourceUrl) return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;
    const aspect = nw / nh;
    const width = aspect >= CROP_ASPECT ? (CROP_ASPECT / aspect) : 1;
    const height = aspect >= CROP_ASPECT ? 1 : (1 / CROP_ASPECT) * aspect;
    setCropNatural({ w: nw, h: nh });
    const scale = Math.min(CROP_PREVIEW_MAX.w / nw, CROP_PREVIEW_MAX.h / nh, 1);
    setCropDisplay({ w: Math.round(nw * scale), h: Math.round(nh * scale) });
    setCropPct({ left: (1 - width) / 2, top: (1 - height) / 2, width, height });
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cropPct) return;
    cropDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startLeft: cropPct.left, startTop: cropPct.top };
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropDragRef.current.active || !cropPct || !cropDisplay) return;
    const dx = (e.clientX - cropDragRef.current.startX) / cropDisplay.w;
    const dy = (e.clientY - cropDragRef.current.startY) / cropDisplay.h;
    const newLeft = Math.max(0, Math.min(1 - cropPct.width, cropDragRef.current.startLeft + dx));
    const newTop = Math.max(0, Math.min(1 - cropPct.height, cropDragRef.current.startTop + dy));
    setCropPct((p) => p ? { ...p, left: newLeft, top: newTop } : null);
    cropDragRef.current.startLeft = newLeft;
    cropDragRef.current.startTop = newTop;
    cropDragRef.current.startX = e.clientX;
    cropDragRef.current.startY = e.clientY;
  };

  const handleCropMouseUp = () => { cropDragRef.current.active = false; };

  const handleCropAccept = async () => {
    const img = cropImageRef.current;
    if (!img || !cropPct || !cropNatural || !editingRoom) return;
    setUploadLoading(true);
    setUploadError(null);
    try {
      const { w: nw, h: nh } = cropNatural;
      const sx = cropPct.left * nw;
      const sy = cropPct.top * nh;
      const sw = cropPct.width * nw;
      const sh = cropPct.height * nh;
      const drawToBlob = (outW: number, outH: number): Promise<Blob | null> => {
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return Promise.resolve(null);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        return new Promise((resolve) => { canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY); });
      };
      const blobs = await Promise.all(CROP_OUTPUT_SIZES.map((s) => drawToBlob(s.w, s.h)));
      if (blobs.some((b) => !b)) throw new Error('No se pudo generar alguna imagen');
      const uuid = crypto.randomUUID();
      const paths = [`${editingRoom.id}/${uuid}.webp`, `${editingRoom.id}/${uuid}-m.webp`];
      for (let i = 0; i < 2; i++) {
        const { error: upErr } = await supabase.storage.from(BUCKET_ROOM_IMAGES).upload(paths[i], blobs[i]!, { contentType: 'image/webp', upsert: false });
        if (upErr) throw upErr;
      }
      const publicUrl = supabase.storage.from(BUCKET_ROOM_IMAGES).getPublicUrl(paths[0]).data.publicUrl;
      const publicUrlMedium = supabase.storage.from(BUCKET_ROOM_IMAGES).getPublicUrl(paths[1]).data.publicUrl;
      const maxOrder = galleryImages.length === 0 ? 0 : Math.max(...galleryImages.map((i) => i.sort_order), 0);
      const { data: row, error: insErr } = await supabase.from('room_images').insert({
        room_id: editingRoom.id,
        url: publicUrl,
        sort_order: maxOrder + 1,
        description: null,
        url_medium: publicUrlMedium,
        url_small: null,
      }).select('id, url, sort_order, description, url_medium, url_small').single();
      if (insErr) throw insErr;
      const r = row as { id: number; url: string; sort_order: number; description?: string | null; url_medium?: string | null; url_small?: string | null };
      setGalleryImages((prev) => [...prev, { id: r.id, url: publicUrl, sort_order: r.sort_order, description: r.description ?? null, url_medium: r.url_medium ?? null, url_small: null }]);
      setEditingRoom((prev) => prev && galleryImages.length === 0 ? { ...prev, image: publicUrl } : prev);
      closeCropStep();
    } catch (err: unknown) {
      setUploadError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Error al guardar');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingRoom) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpeg', 'jpg', 'png', 'webp'].includes(ext)) {
      setUploadError('Formato no válido. Usa JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar 5 MB.');
      return;
    }
    openCropStep(file);
  };

  useEffect(() => {
    if (!cropSourceUrl) return;
    const onMove = (e: MouseEvent) => {
      if (!cropDragRef.current.active || !cropPct || !cropDisplay) return;
      const dx = (e.clientX - cropDragRef.current.startX) / cropDisplay.w;
      const dy = (e.clientY - cropDragRef.current.startY) / cropDisplay.h;
      const newLeft = Math.max(0, Math.min(1 - cropPct.width, cropDragRef.current.startLeft + dx));
      const newTop = Math.max(0, Math.min(1 - cropPct.height, cropDragRef.current.startTop + dy));
      setCropPct((p) => p ? { ...p, left: newLeft, top: newTop } : null);
      cropDragRef.current.startLeft = newLeft;
      cropDragRef.current.startTop = newTop;
      cropDragRef.current.startX = e.clientX;
      cropDragRef.current.startY = e.clientY;
    };
    const onUp = () => { cropDragRef.current.active = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [cropSourceUrl, cropPct?.width, cropPct?.height, cropDisplay]);

  const getStoragePathFromUrl = (url: string): string | null => {
    const match = url.match(/\/object\/public\/hotel-room-images\/(.+)$/);
    return match?.[1] ?? null;
  };

  const getStoragePathsToRemove = (imageUrl: string, urlMedium?: string | null, _urlSmall?: string | null): string[] => {
    const paths: string[] = [];
    const p1 = getStoragePathFromUrl(imageUrl);
    if (p1) {
      paths.push(p1);
      if (!urlMedium && p1.endsWith('.webp')) paths.push(p1.replace(/\.webp$/, '-m.webp'));
    }
    if (urlMedium) { const p = getStoragePathFromUrl(urlMedium); if (p && !paths.includes(p)) paths.push(p); }
    return paths;
  };

  const openDeleteConfirm = (imageId: number, imageUrl: string, urlMedium?: string | null, urlSmall?: string | null) => {
    setDeleteConfirmImage({ id: imageId, url: imageUrl, url_medium: urlMedium ?? null, url_small: urlSmall ?? null });
  };

  const handleGalleryDeleteConfirm = async () => {
    if (!deleteConfirmImage) return;
    const { id: imageId, url: imageUrl, url_medium: urlMedium, url_small: urlSmall } = deleteConfirmImage;
    setDeleteConfirmImage(null);
    try {
      const { error: delErr } = await supabase.from('room_images').delete().eq('id', imageId);
      if (delErr) throw delErr;
      setGalleryImages((prev) => prev.filter((i) => i.id !== imageId));
      const paths = getStoragePathsToRemove(imageUrl, urlMedium ?? undefined, urlSmall ?? undefined);
      if (paths.length) await supabase.storage.from(BUCKET_ROOM_IMAGES).remove(paths);
      if (editingRoom && galleryImages.find((i) => i.id === imageId) && galleryImages[0]?.id === imageId && galleryImages.length > 1) {
        setEditingRoom((r) => r ? { ...r, image: galleryImages[1].url } : null);
      } else if (editingRoom && galleryImages.length === 1 && galleryImages[0].id === imageId) {
        setEditingRoom((r) => r ? { ...r, image: '' } : null);
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Error al eliminar');
    }
  };

  const handleGalleryDescriptionChange = async (imageId: number, description: string) => {
    setGalleryImages((prev) => prev.map((i) => (i.id === imageId ? { ...i, description: description || null } : i)));
    await supabase.from('room_images').update({ description: description.trim() || null }).eq('id', imageId);
  };

  const handleSetAsMainImage = async (imageId: number) => {
    const selected = galleryImages.find((i) => i.id === imageId);
    const currentFirst = galleryImages[0];
    if (!selected || selected.id === currentFirst.id) return;
    try {
      const newSortSelected = currentFirst.sort_order - 1;
      await supabase.from('room_images').update({ sort_order: newSortSelected }).eq('id', imageId);
      await supabase.from('room_images').update({ sort_order: selected.sort_order }).eq('id', currentFirst.id);
      setGalleryImages((prev) => {
        const idx = prev.findIndex((i) => i.id === imageId);
        if (idx <= 0) return prev;
        const selectedImg = prev[idx];
        const rest = prev.filter((i) => i.id !== imageId);
        const restWithNewSort = rest.map((i) => (i.id === currentFirst.id ? { ...i, sort_order: selected.sort_order } : i));
        const sortedRest = restWithNewSort.sort((a, b) => a.sort_order - b.sort_order);
        return [{ ...selectedImg, sort_order: newSortSelected }, ...sortedRest];
      });
      setEditingRoom((r) => r ? { ...r, image: selected.url } : null);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Error al cambiar imagen principal');
    }
  };

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
      const imageToSave = galleryImages.length > 0 ? galleryImages[0].url : (editingRoom.image || '');
      const roomToSave = { ...editingRoom, image: imageToSave };
      const { error: err } = await supabase
        .from('rooms')
        .update({ name: roomToSave.name, type: roomToSave.type, price: roomToSave.price, status: roomToSave.status, image: roomToSave.image, amenities: roomToSave.amenities })
        .eq('id', roomToSave.id);
      if (err) throw err;
      setRooms((prev) => prev.map((r) => (r.id === roomToSave.id ? roomToSave : r)));
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
              <div>
                <label className="text-xs font-bold text-gray-700">Galería de imágenes</label>
                <p className="text-[10px] text-gray-500 mt-0.5">La primera imagen es la principal de la habitación.</p>
                <button type="button" onClick={() => { setUploadError(null); setGalleryModalOpen(true); }} className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-600">
                  <span className="material-symbols-outlined text-[18px]">photo_library</span>
                  Gestionar galería
                  {galleryImages.length > 0 && <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{galleryImages.length}</span>}
                </button>
              </div>
              <div><label className="text-xs font-bold text-gray-700">Amenidades</label><div className="flex flex-wrap gap-2 mt-2">{AMENITIES_OPTIONS.map((a) => (<button key={a.name} type="button" onClick={() => toggleEditAmenity(a.name)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editingRoom.amenities.includes(a.name) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{a.name}</button>))}</div></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingRoom(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-lg disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery modal (when editing a room) */}
      {editingRoom && galleryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50" onClick={() => { closeCropStep(); setDeleteConfirmImage(null); setGalleryModalOpen(false); }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Galería de imágenes de la habitación</h3>
              <button type="button" onClick={() => { closeCropStep(); setDeleteConfirmImage(null); setGalleryModalOpen(false); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"><span className="material-symbols-outlined text-[24px]">close</span></button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <input id="room-gallery-file-input" ref={galleryFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleGalleryUpload} disabled={uploadLoading} className="hidden" aria-hidden />
              {uploadError && <p className="text-sm text-red-600 mb-3">{uploadError}</p>}
              {cropSourceUrl ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-600">Ajusta el recorte (arrastra el marco punteado). Se guardará en WebP (grande 720×480, mediano 420×280).</p>
                  <div className="inline-block mx-auto" style={cropDisplay ? { width: cropDisplay.w, height: cropDisplay.h } : undefined} onMouseMove={handleCropMouseMove} onMouseUp={handleCropMouseUp} onMouseLeave={handleCropMouseUp}>
                    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
                      <img ref={cropImageRef} src={cropSourceUrl} alt="Recorte" className="block w-full h-full object-contain" style={cropDisplay ? { width: cropDisplay.w, height: cropDisplay.h } : undefined} onLoad={onCropImageLoad} draggable={false} />
                      {cropPct && (
                        <div role="presentation" className="absolute border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move" style={{ left: `${cropPct.left * 100}%`, top: `${cropPct.top * 100}%`, width: `${cropPct.width * 100}%`, height: `${cropPct.height * 100}%` }} onMouseDown={handleCropMouseDown} />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={closeCropStep} disabled={uploadLoading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancelar</button>
                    <button type="button" onClick={handleCropAccept} disabled={uploadLoading || !cropPct} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium text-sm disabled:opacity-50">{uploadLoading ? 'Guardando...' : 'Aceptar'}</button>
                  </div>
                </div>
              ) : galleryLoading ? (
                <p className="text-sm text-gray-500 py-8 text-center">Cargando galería...</p>
              ) : galleryImages.length === 0 ? (
                <label htmlFor="room-gallery-file-input" className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 min-h-[200px] cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors">
                  {uploadLoading ? <span className="text-sm text-gray-500">Subiendo...</span> : (<><span className="material-symbols-outlined text-[40px] text-gray-400 mb-2">add_photo_alternate</span><span className="text-sm font-medium text-gray-600">Añadir imagen</span><span className="text-xs text-gray-400 mt-1">JPEG, PNG o WebP, máx. 5 MB</span></>)}
                </label>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <p className="text-sm font-bold text-gray-700">Imagen principal</p>
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
                        <img src={galleryImages[0].url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} /><div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400"><span className="material-symbols-outlined text-4xl">broken_image</span></div>
                        <button type="button" onClick={() => openDeleteConfirm(galleryImages[0].id, galleryImages[0].url, galleryImages[0].url_medium, galleryImages[0].url_small)} className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-red-500 text-white opacity-90 hover:opacity-100 shadow" title="Eliminar"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                      </div>
                      <input type="text" value={galleryImages[0].description ?? ''} onChange={(e) => setGalleryImages((prev) => prev.map((i) => (i.id === galleryImages[0].id ? { ...i, description: e.target.value } : i)))} onBlur={(e) => handleGalleryDescriptionChange(galleryImages[0].id, e.target.value)} placeholder="Descripción" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary" />
                    </div>
                    <label htmlFor="room-gallery-file-input" className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 min-w-[120px] h-[120px] cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors shrink-0">
                      {uploadLoading ? <span className="text-xs text-gray-500">Subiendo...</span> : (<><span className="material-symbols-outlined text-[28px] text-gray-400 mb-1">add_photo_alternate</span><span className="text-xs font-medium text-gray-600 text-center px-2">Añadir otra imagen</span></>)}
                    </label>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Otras imágenes</p>
                    <div className="grid grid-cols-4 gap-4">
                      {galleryImages.slice(1).map((img) => (
                        <div key={img.id} className="flex flex-col gap-1.5">
                          <div className="relative aspect-square max-w-[180px] w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={img.url_medium || img.url} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => openDeleteConfirm(img.id, img.url, img.url_medium, img.url_small)} className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600" title="Eliminar"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                            <button type="button" onClick={() => handleSetAsMainImage(img.id)} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white shadow hover:bg-blue-600" title="Establecer como imagen principal"><span className="material-symbols-outlined text-[18px]">check</span></button>
                          </div>
                          <input type="text" value={img.description ?? ''} onChange={(e) => setGalleryImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, description: e.target.value } : i)))} onBlur={(e) => handleGalleryDescriptionChange(img.id, e.target.value)} placeholder="Descripción" className="w-full px-1.5 py-1 border border-gray-200 rounded text-[10px] placeholder:text-gray-400 focus:ring-1 focus:ring-primary focus:border-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button type="button" onClick={() => { closeCropStep(); setDeleteConfirmImage(null); setGalleryModalOpen(false); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700">Cerrar</button>
            </div>
            {deleteConfirmImage && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 rounded-xl" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
                  <p className="text-gray-800 font-medium mb-4">¿Eliminar esta imagen de la galería?</p>
                  <div className="flex justify-center gap-3">
                    <button type="button" onClick={() => setDeleteConfirmImage(null)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">Cancelar</button>
                    <button type="button" onClick={handleGalleryDeleteConfirm} className="px-4 py-2.5 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600">Eliminar</button>
                  </div>
                </div>
              </div>
            )}
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
