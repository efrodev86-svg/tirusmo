import React, { useState } from 'react';

interface AdminRoomInventoryProps {
  hotelId: string;
  onBack: () => void;
}

interface Room {
    id: number;
    name: string;
    type: string;
    price: number;
    status: string;
    image: string;
    amenities: string[];
    color?: string;
}

export const AdminRoomInventory: React.FC<AdminRoomInventoryProps> = ({ hotelId, onBack }) => {
  // Mock Data
  const hotelInfo = {
    name: "Grand SPA Resort",
    location: "Costa del Sol, Málaga, España",
    totalRooms: 48,
    occupancy: "92%",
    maintenance: 2,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP3pLgh2y6TTH9MWzXMUWpr3UsqYEa5HnrYpKUF4HoNHzCaq1N-mtHns-GaRnq5zh0_UgKocBzYaXzlhuBF0Vi6jD-gwqlGyqZa70fwyGeU6rBVSfz-EY_yJBZx-yAbI15V8nhp_8ksTQaXq9pSuK5IH9McYauZMvLBnsG-IdH4dr8kKdBJWBiazXque5PAKY-_fYwVBe3pyX3XtZ_ka1dI0_cDMKVYRGCyYMyBEABqDM9wBM805itA_UYUhzJIk-jmBwEdal38Q"
  };

  const initialRooms: Room[] = [
    {
      id: 402,
      name: "Royal Presidential Suite",
      type: "SUITE DE LUJO",
      price: 450,
      status: "DISPONIBLE",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=600&auto=format&fit=crop",
      amenities: ["Wifi 6", "Clima", "Jacuzzi", "4K Smart TV"],
      color: "bg-green-500"
    },
    {
      id: 305,
      name: "Deluxe Ocean View",
      type: "DOBLE DELUXE",
      price: 280,
      status: "OCUPADA",
      image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=600&auto=format&fit=crop",
      amenities: ["Wifi 6", "Minibar", "Balcón"],
      color: "bg-blue-500"
    },
    {
      id: 102,
      name: "Classic Garden View",
      type: "ESTÁNDAR",
      price: 150,
      status: "MANTENIMIENTO",
      image: "https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=600&auto=format&fit=crop",
      amenities: ["Wifi 6", "Café"],
      color: "bg-orange-500"
    },
    {
      id: 204,
      name: "Junior Suite Terrace",
      type: "SUITE",
      price: 320,
      status: "DISPONIBLE",
      image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=600&auto=format&fit=crop",
      amenities: ["Wifi 6", "Balcón", "Sofá"],
      color: "bg-green-500"
    },
    {
        id: 501,
        name: "Penthouse Experience",
        type: "PREMIUM",
        price: 850,
        status: "OCUPADA",
        image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=600&auto=format&fit=crop",
        amenities: ["Privacidad", "Bar", "Pool"],
        color: "bg-blue-500"
      },
      {
        id: 105,
        name: "Double Queen",
        type: "ESTÁNDAR",
        price: 180,
        status: "DISPONIBLE",
        image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=600&auto=format&fit=crop",
        amenities: ["Wifi 6", "4K Smart TV", "Desk"],
        color: "bg-green-500"
      }
  ];

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

  const allAmenities = [
      { name: "Wifi 6", icon: "wifi" },
      { name: "Clima", icon: "ac_unit" },
      { name: "Jacuzzi", icon: "hot_tub" },
      { name: "4K Smart TV", icon: "tv" },
      { name: "Minibar", icon: "local_bar" },
      { name: "Café", icon: "coffee_maker" },
      { name: "Balcón", icon: "balcony" },
      { name: "Servicio 24h", icon: "room_service" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'DISPONIBLE': return 'bg-[#10B981] text-white';
        case 'OCUPADA': return 'bg-[#3B82F6] text-white';
        case 'MANTENIMIENTO': return 'bg-[#F97316] text-white';
        default: return 'bg-gray-500 text-white';
    }
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom({...room});
  };

  const handleSaveRoom = () => {
    if (editingRoom) {
        setRooms(prev => prev.map(r => r.id === editingRoom.id ? editingRoom : r));
        setEditingRoom(null);
    }
  };

  const handleDeleteClick = (id: number) => {
      setDeletingRoomId(id);
  };

  const handleConfirmDelete = () => {
      if (deletingRoomId) {
          setRooms(prev => prev.filter(r => r.id !== deletingRoomId));
          setDeletingRoomId(null);
      }
  };

  const toggleAmenity = (amenityName: string) => {
    if (!editingRoom) return;
    const hasAmenity = editingRoom.amenities.includes(amenityName);
    let newAmenities;
    if (hasAmenity) {
        newAmenities = editingRoom.amenities.filter(a => a !== amenityName);
    } else {
        newAmenities = [...editingRoom.amenities, amenityName];
    }
    setEditingRoom({...editingRoom, amenities: newAmenities});
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-20 relative min-h-screen">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-0 z-20">
         <div className="flex items-center gap-2 text-sm text-gray-500">
             <span className="cursor-pointer hover:text-primary" onClick={onBack}>Hoteles</span>
             <span className="material-symbols-outlined text-xs">chevron_right</span>
             <span className="font-bold text-primary">{hotelInfo.name}</span>
         </div>
         <div className="flex-1 w-full md:w-auto md:max-w-md mx-4">
            <h1 className="text-xl font-bold text-[#111827] hidden md:block">Gestión de Inventario de Habitaciones</h1>
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
                 <input 
                    type="text" 
                    placeholder="Buscar habitación..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                 />
             </div>
             <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-200 whitespace-nowrap">
                 <span className="material-symbols-outlined text-[18px]">add</span>
                 Nueva Habitación
             </button>
             <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200 shrink-0">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
             </div>
         </div>
      </div>

      {/* Hotel Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 shadow-sm">
              <img src={hotelInfo.image} className="w-full h-full object-cover" alt="Hotel" />
          </div>
          <div className="flex-1 w-full">
              <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold text-[#111827]">{hotelInfo.name}</h2>
                  <div className="flex gap-2">
                      <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                          <span className="material-symbols-outlined text-[20px]">settings</span>
                      </button>
                      <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                          <span className="material-symbols-outlined text-[20px]">share</span>
                      </button>
                  </div>
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-6">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  {hotelInfo.location}
              </div>
              <div className="flex flex-wrap gap-8">
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL HABITACIONES</p>
                      <p className="text-xl font-bold text-[#111827]">{hotelInfo.totalRooms} Unidades</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">OCUPACIÓN ACTUAL</p>
                      <p className="text-xl font-bold text-green-600">{hotelInfo.occupancy}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">MANTENIMIENTO</p>
                      <p className="text-xl font-bold text-orange-500">{hotelInfo.maintenance} Habitaciones</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Todos los Tipos
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm">
                  Disponibilidad
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
          </div>
          <span className="text-xs text-gray-400 font-medium">Mostrando <span className="text-gray-700 font-bold">{rooms.length}</span> de {hotelInfo.totalRooms} habitaciones</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  {/* Image Area */}
                  <div className="h-48 relative overflow-hidden">
                      <img src={room.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${getStatusBadge(room.status)}`}>
                          {room.status}
                      </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                      <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg text-[#111827] leading-tight w-3/4">{room.name}</h3>
                          <div className="text-right">
                              <span className="text-xl font-bold text-primary">${room.price}</span>
                              <p className="text-[9px] text-gray-400 uppercase font-bold">POR NOCHE</p>
                          </div>
                      </div>
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">
                          HABITACIÓN {room.id} • {room.type}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
                          {room.amenities.map((amenity, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-gray-500 text-xs">
                                  <span className="material-symbols-outlined text-[16px]">
                                      {amenity.includes('Wifi') ? 'wifi' : 
                                       amenity.includes('Clima') ? 'ac_unit' : 
                                       amenity.includes('Jacuzzi') ? 'hot_tub' : 
                                       amenity.includes('Café') ? 'coffee_maker' : 
                                       amenity.includes('TV') ? 'tv' : 'check_circle'}
                                  </span>
                                  {amenity}
                              </div>
                          ))}
                      </div>

                      <div className="flex gap-3 border-t border-gray-100 pt-4">
                          <button 
                            onClick={() => handleEditClick(room)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                              Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(room.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-100 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                          >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Eliminar
                          </button>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-30">
          <button className="w-14 h-14 bg-blue-100 text-primary rounded-full shadow-lg shadow-blue-200 flex items-center justify-center hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl font-bold">add</span>
          </button>
      </div>

       {/* Edit Room Modal */}
       {editingRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setEditingRoom(null)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-[#111827]">Edición de Habitación</h2>
                        <p className="text-sm text-gray-500 mt-1">Modificando <span className="font-bold text-primary">{editingRoom.name}</span></p>
                    </div>
                    <button onClick={() => setEditingRoom(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto">
                    <div className="flex flex-col lg:flex-row gap-8 mb-8">
                        {/* Image Section */}
                        <div className="w-full lg:w-1/3">
                            <label className="text-xs font-bold text-gray-700 block mb-2">Imagen Principal</label>
                            <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer bg-gray-50 h-[200px]">
                                <img src={editingRoom.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">upload</span> Cambiar Imagen
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic">* Formatos recomendados: JPG, PNG. Máx 5MB.</p>
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 flex flex-col gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Nombre de la Habitación</label>
                                <input 
                                    type="text" 
                                    value={editingRoom.name}
                                    onChange={(e) => setEditingRoom({...editingRoom, name: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Tipo de Habitación</label>
                                    <div className="relative">
                                        <select 
                                            value={editingRoom.type}
                                            onChange={(e) => setEditingRoom({...editingRoom, type: e.target.value})}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none uppercase"
                                        >
                                            <option>SUITE DE LUJO</option>
                                            <option>DOBLE DELUXE</option>
                                            <option>ESTÁNDAR</option>
                                            <option>SUITE</option>
                                            <option>PREMIUM</option>
                                        </select>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Precio por Noche (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                                        <input 
                                            type="number" 
                                            value={editingRoom.price}
                                            onChange={(e) => setEditingRoom({...editingRoom, price: Number(e.target.value)})}
                                            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-700">Estado de Disponibilidad</label>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setEditingRoom({...editingRoom, status: 'DISPONIBLE'})}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all border ${editingRoom.status === 'DISPONIBLE' ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/10 ring-1 ring-[#10B981]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        DISPONIBLE
                                    </button>
                                    <button 
                                        onClick={() => setEditingRoom({...editingRoom, status: 'OCUPADA'})}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all border ${editingRoom.status === 'OCUPADA' ? 'border-blue-500 text-blue-600 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        OCUPADA
                                    </button>
                                    <button 
                                        onClick={() => setEditingRoom({...editingRoom, status: 'MANTENIMIENTO'})}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all border ${editingRoom.status === 'MANTENIMIENTO' ? 'border-orange-500 text-orange-600 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        MANTENIMIENTO
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amenities Section */}
                    <div>
                        <h4 className="text-sm font-bold text-[#111827] mb-4">Amenidades y Servicios</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {allAmenities.map((amenity) => {
                                const isSelected = editingRoom.amenities.includes(amenity.name);
                                return (
                                    <div 
                                        key={amenity.name}
                                        onClick={() => toggleAmenity(amenity.name)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary/30 bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-300'}`}>
                                            {isSelected && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                                        </div>
                                        <span className="material-symbols-outlined text-gray-500 text-[18px]">{amenity.icon}</span>
                                        <span className={`text-sm ${isSelected ? 'font-bold text-primary' : 'text-gray-600'}`}>{amenity.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                   <button 
                        onClick={() => setEditingRoom(null)} 
                        className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                        Cancelar
                   </button>
                   <button 
                        onClick={handleSaveRoom} 
                        className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:bg-blue-600 shadow-md shadow-blue-200 transition-all"
                    >
                        Guardar Cambios
                   </button>
                </div>
            </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRoomId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeletingRoomId(null)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200 p-8 text-center">
                <button onClick={() => setDeletingRoomId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>
                
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl text-red-500 filled">delete</span>
                </div>

                <h2 className="text-xl font-bold text-[#111827] mb-3 leading-tight">Confirmación de Eliminación de Habitación</h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    ¿Estás seguro de que deseas eliminar esta habitación?<br/>
                    Esta acción no se puede deshacer.
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeletingRoomId(null)} 
                        className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmDelete} 
                        className="flex-1 py-3 px-4 bg-[#EF4444] hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};