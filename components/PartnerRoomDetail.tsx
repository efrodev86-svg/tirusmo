import React, { useState, useEffect } from 'react';

interface PartnerRoomDetailProps {
  roomId: number | null;
  onBack: () => void;
}

export const PartnerRoomDetail: React.FC<PartnerRoomDetailProps> = ({ roomId, onBack }) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    capacity: 2,
    price: 0,
    amenities: [] as string[]
  });

  // Mock data initialization if editing
  useEffect(() => {
    if (roomId) {
      // En una app real, aquí haríamos fetch(roomId)
      setFormData({
        name: 'Master Suite 101',
        description: 'Una suite de lujo con vista panorámica al océano, acabados en mármol y una terraza privada perfecta para disfrutar del atardecer.',
        type: 'Master Suite',
        capacity: 4,
        price: 250.00,
        amenities: ['WiFi Gratuito', 'Aire Acondicionado', 'Smart TV', 'Minibar']
      });
    }
  }, [roomId]);

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const amenitiesList = [
    { id: 'wifi', label: 'WiFi Gratuito' },
    { id: 'ac', label: 'Aire Acondicionado' },
    { id: 'tv', label: 'Smart TV' },
    { id: 'minibar', label: 'Minibar' },
    { id: 'safe', label: 'Caja Fuerte' },
    { id: 'room_service', label: 'Room Service' },
    { id: 'dryer', label: 'Secador de Pelo' },
    { id: 'coffee', label: 'Cafetera' }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-2xl font-bold text-[#111827]">
                {roomId ? 'Editar Habitación' : 'Nueva Habitación'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    24 Octubre, 2023
                </div>
                <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                    <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
          </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col gap-8">
        
        {/* Basic Info */}
        <div>
            <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-[22px] filled">info</span>
                Información Básica
            </h3>
            
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">Nombre de la Habitación</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Suite Presidential con Vista al Mar"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700 placeholder:text-gray-300"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">Descripción Detallada</label>
                    <textarea 
                        placeholder="Describe las características únicas de esta habitación..."
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700 placeholder:text-gray-300 min-h-[120px] resize-y"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-gray-700">Tipo de Habitación</label>
                        <div className="relative">
                            <select 
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700 appearance-none"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="">Seleccionar tipo...</option>
                                <option value="Master Suite">Master Suite</option>
                                <option value="Junior Suite">Junior Suite</option>
                                <option value="Doble">Doble</option>
                                <option value="Estándar">Estándar</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-gray-700">Capacidad Máx.</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700"
                                value={formData.capacity}
                                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                            />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">person</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-gray-700">Precio / Noche</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700 placeholder:text-gray-300"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <hr className="border-gray-100" />

        {/* Amenities */}
        <div>
            <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-[22px] filled">cleaning_services</span>
                Amenidades y Servicios
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {amenitiesList.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:border-gray-300 transition-colors bg-white group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm transition-all checked:border-primary checked:bg-primary hover:border-primary"
                                checked={formData.amenities.includes(item.label)}
                                onChange={() => toggleAmenity(item.label)}
                            />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                            </span>
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{item.label}</span>
                    </label>
                ))}
            </div>
        </div>

        <hr className="border-gray-100" />

        {/* Gallery */}
        <div>
            <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-[22px] filled">image</span>
                Galería de Fotos
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors group text-gray-400 hover:text-primary">
                    <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">add_a_photo</span>
                    <span className="text-xs font-bold uppercase tracking-wide">Añadir Foto</span>
                </div>
                
                {/* Mock Images */}
                <div className="relative rounded-xl overflow-hidden min-h-[200px] group">
                    <img src="https://ui-avatars.com/api/?name=Room+1&background=random" alt="Room preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-red-500 hover:bg-red-50">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </div>
                </div>
                <div className="relative rounded-xl overflow-hidden min-h-[200px] group">
                    <img src="https://ui-avatars.com/api/?name=Room+2&background=random" alt="Room preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-red-500 hover:bg-red-50">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">Formatos permitidos: JPG, PNG. Tamaño máximo: 5MB por imagen. Recomendado: 1200x800px.</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-100">
            <button 
                onClick={onBack}
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
                Cancelar
            </button>
            <button 
                className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all"
                onClick={() => { alert('Habitación guardada'); onBack(); }}
            >
                Guardar Habitación
            </button>
        </div>

      </div>
    </div>
  );
};