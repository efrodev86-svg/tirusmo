import React, { useState } from 'react';

interface AdminHotelDetailProps {
  hotelId: string;
  onBack: () => void;
  onManageRooms?: () => void;
}

export const AdminHotelDetail: React.FC<AdminHotelDetailProps> = ({ hotelId, onBack, onManageRooms }) => {
  // State for hotel data to allow updates
  const [hotelData, setHotelData] = useState({
    name: "Grand SPA Resort",
    address: "Blvd. Kukulcan Km 14.5, Zona Hotelera, 77500 Cancún, Q.R.",
    city: "Cancún",
    country: "México",
    phone: "+52 998 123 4567",
    stars: "5",
    owner: "Carlos Méndez (Partner Premium)",
    partnerUser: "cmendez_grandspa",
    partnerEmail: "c.mendez@grandspa.com",
    partnerPassword: "password123",
    description: "Resort de lujo frente al mar con servicios de SPA de clase mundial, 5 restaurantes gourmet y piscinas infinitas. Especializado en experiencias premium para adultos y familias.",
    services: ["WIFI ALTA VELOCIDAD", "PARKING", "GYM 24/7", "ALL INCLUSIVE"],
    status: "Activo",
    since: "12/05/2021",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAP3pLgh2y6TTH9MWzXMUWpr3UsqYEa5HnrYpKUF4HoNHzCaq1N-mtHns-GaRnq5zh0_UgKocBzYaXzlhuBF0Vi6jD-gwqlGyqZa70fwyGeU6rBVSfz-EY_yJBZx-yAbI15V8nhp_8ksTQaXq9pSuK5IH9McYauZMvLBnsG-IdH4dr8kKdBJWBiazXque5PAKY-_fYwVBe3pyX3XtZ_ka1dI0_cDMKVYRGCyYMyBEABqDM9wBM805itA_UYUhzJIk-jmBwEdal38Q",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=200&auto=format&fit=crop"
    ]
  });

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState(hotelData);
  const [showPassword, setShowPassword] = useState(false);

  const reservations = [
    { id: "RES-9402", name: "Lucía Martínez", date: "15 Jun - 20 Jun (5 Noches)", room: "Suite Presidencial", price: "$2,250.00", status: "CONFIRMADO", initials: "LM", color: "bg-blue-100 text-blue-600" },
    { id: "RES-9398", name: "Roberto Sánchez", date: "18 Jun - 19 Jun (1 Noche)", room: "Doble Deluxe", price: "$210.00", status: "PENDIENTE", initials: "RS", color: "bg-blue-100 text-blue-600" },
    { id: "RES-9385", name: "Ana Holand", date: "22 Jun - 28 Jun (6 Noches)", room: "Suite Presidencial", price: "$2,700.00", status: "CONFIRMADO", initials: "AH", color: "bg-purple-100 text-purple-600" },
  ];

  const rooms = [
    { type: "Suite Presidencial", total: 12, available: 4, price: "$450.00" },
    { type: "Doble Deluxe", total: 45, available: 12, price: "$210.00" },
    { type: "Standard King", total: 50, available: 28, price: "$185.00" },
    { type: "Junior Suite", total: 17, available: 0, price: "$320.00" },
  ];

  const handleOpenEdit = () => {
    setFormData(hotelData);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setHotelData(formData);
    setShowEditModal(false);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-10 relative">
      
      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack} 
                className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm"
            >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-[#111827] leading-tight">{hotelData.name}</h1>
                <p className="text-xs text-gray-400 font-medium">Administración de Propiedad / ID: #{hotelId}</p>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
             <button 
                onClick={handleOpenEdit}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar Información
            </button>
            <button 
                onClick={onManageRooms}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
            >
                <span className="material-symbols-outlined text-[18px]">bed</span>
                Gestionar Habitaciones
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Revenue Mensual</span>
                <span className="material-symbols-outlined text-green-500 text-[20px]">trending_up</span>
            </div>
            <div className="text-3xl font-bold text-[#111827] mt-2 mb-1">$45,280.00</div>
            <div className="text-xs font-bold text-green-600">+12.5% vs mes anterior</div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ocupación Actual</span>
                <span className="material-symbols-outlined text-blue-500 text-[20px]">donut_large</span>
            </div>
            <div className="text-3xl font-bold text-[#111827] mt-2 mb-1">84%</div>
            <div className="text-xs text-gray-400">104 de 124 habitaciones</div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ADR (Promedio/Día)</span>
                <span className="material-symbols-outlined text-purple-500 text-[20px]">payments</span>
            </div>
            <div className="text-3xl font-bold text-[#111827] mt-2 mb-1">$185.00</div>
            <div className="text-xs text-gray-400">Tarifa promedio diaria</div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reviews</span>
                <span className="material-symbols-outlined text-yellow-400 text-[20px] filled">star</span>
            </div>
            <div className="text-3xl font-bold text-[#111827] mt-2 mb-1">4.9</div>
            <div className="text-xs text-gray-400">Basado en 856 reseñas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Property Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-[#111827] mb-6">Información de la Propiedad</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {/* Location */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ubicación</p>
                        <div className="flex gap-2 items-start">
                             <span className="material-symbols-outlined text-[#111827] mt-0.5 filled">location_on</span>
                             <p className="text-gray-600 text-sm leading-relaxed">{hotelData.address}</p>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Servicios Incluidos</p>
                        <div className="flex flex-wrap gap-2">
                            {hotelData.services.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">{s}</span>
                            ))}
                        </div>
                    </div>

                    {/* Owner */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Propietario / Partner</p>
                        <p className="text-gray-600 text-sm">{hotelData.owner}</p>
                    </div>

                     {/* Status */}
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Estado Operativo</p>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Activo</span>
                            <span className="text-xs text-gray-400">Desde: {hotelData.since}</span>
                        </div>
                    </div>

                     {/* Description */}
                     <div className="md:col-span-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{hotelData.description}</p>
                    </div>
                </div>

                {/* Gallery */}
                <div className="mt-8">
                    <p className="font-bold text-[#111827] mb-4 text-sm">Galería de Fotos</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-64">
                         {/* Large Image */}
                         <div className="col-span-2 row-span-2 rounded-xl overflow-hidden relative group">
                            <img src={hotelData.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        
                        {/* Middle Column */}
                         <div className="rounded-xl overflow-hidden">
                            <img src={hotelData.images[1]} className="w-full h-full object-cover" />
                        </div>
                         <div className="rounded-xl overflow-hidden">
                            <img src={hotelData.images[3]} className="w-full h-full object-cover" />
                        </div>

                        {/* Right Column */}
                        <div className="rounded-xl overflow-hidden">
                            <img src={hotelData.images[2]} className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">
                            <span className="material-symbols-outlined mb-1">photo_camera</span>
                            <span className="text-[10px] font-bold">VER +12</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Reservations */}
        <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                <h3 className="font-bold text-lg text-[#111827] mb-6">Reservaciones Recientes</h3>
                <div className="flex flex-col gap-6">
                    {reservations.map((res, i) => (
                        <div key={i} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${res.color}`}>
                                {res.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-sm text-[#111827] truncate">{res.name}</h4>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${res.status === 'CONFIRMADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{res.status}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mb-2">ID: #{res.id}</p>
                                
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                    <span className="truncate">{res.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <span className="material-symbols-outlined text-[16px]">bed</span>
                                    <span className="truncate">{res.room}</span>
                                </div>
                                <div className="font-bold text-[#111827] text-sm">{res.price}</div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>

      {/* Room Availability Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-[#111827]">Disponibilidad de Habitaciones</h3>
            <button className="text-sm font-bold text-primary hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                        <th className="py-3">TIPO DE HABITACIÓN</th>
                        <th className="py-3 text-center">TOTAL</th>
                        <th className="py-3 text-center">DISPONIBLE</th>
                        <th className="py-3 text-center">PRECIO/NOCHE</th>
                        <th className="py-3 text-right">ACCIÓN</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {rooms.map((room, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="py-4 font-bold text-[#111827]">{room.type}</td>
                            <td className="py-4 text-center text-gray-600">{room.total}</td>
                            <td className="py-4 text-center">
                                <span className={`font-bold ${room.available === 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {room.available}
                                </span>
                            </td>
                            <td className="py-4 text-center text-gray-600">{room.price}</td>
                            <td className="py-4 text-right">
                                <button className="text-primary text-xs font-bold hover:underline" onClick={onManageRooms}>Gestionar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
            
            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[800px] relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white">
                   <div>
                      <h2 className="text-xl font-bold text-[#111827]">Edición de Hotel</h2>
                      <p className="text-sm text-gray-500 mt-1">Modifica los detalles de la propiedad y accesos del partner.</p>
                   </div>
                   <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <span className="material-symbols-outlined text-2xl">close</span>
                   </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-8 overflow-y-auto">
                    
                    {/* General Info */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-primary uppercase mb-4 tracking-wider">INFORMACIÓN GENERAL</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Nombre del Hotel</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Categoría (Estrellas)</label>
                                <div className="relative">
                                    <select 
                                        value={formData.stars}
                                        onChange={(e) => setFormData({...formData, stars: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                                    >
                                        <option value="5">5 Estrellas</option>
                                        <option value="4">4 Estrellas</option>
                                        <option value="3">3 Estrellas</option>
                                    </select>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Descripción de la Propiedad</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location & Contact */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-primary uppercase mb-4 tracking-wider">UBICACIÓN Y CONTACTO</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Ciudad</label>
                                <input 
                                    type="text" 
                                    value={formData.city} 
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">País</label>
                                <input 
                                    type="text" 
                                    value={formData.country} 
                                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                             <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Teléfono de Contacto</label>
                                <input 
                                    type="text" 
                                    value={formData.phone} 
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Partner Access */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-primary uppercase mb-4 tracking-wider">ASOCIACIÓN Y ACCESO AL PARTNER</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Propietario / Partner Asociado</label>
                                <div className="relative">
                                    <select 
                                        value={formData.owner}
                                        onChange={(e) => setFormData({...formData, owner: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                                    >
                                        <option>Carlos Méndez (Premium)</option>
                                        <option>Partner Standard</option>
                                    </select>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Nombre de Usuario (Acceso)</label>
                                <input 
                                    type="text" 
                                    value={formData.partnerUser} 
                                    onChange={(e) => setFormData({...formData, partnerUser: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                             <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Email del Partner</label>
                                <input 
                                    type="email" 
                                    value={formData.partnerEmail} 
                                    onChange={(e) => setFormData({...formData, partnerEmail: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                             <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">Contraseña</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={formData.partnerPassword} 
                                        onChange={(e) => setFormData({...formData, partnerPassword: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Room Specs Header (As per image) */}
                    <div>
                         <h4 className="text-sm font-bold text-primary uppercase mb-4 tracking-wider">ESPECIFICACIONES DE HABITACIONES</h4>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                   <button 
                        onClick={() => setShowEditModal(false)} 
                        className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                   </button>
                   <button 
                        onClick={handleSaveEdit} 
                        className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:bg-blue-600 shadow-md shadow-blue-200 transition-all"
                    >
                        Guardar Cambios
                   </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};