import React, { useState } from 'react';

export const CustomerProfile: React.FC = () => {
  const [formData, setFormData] = useState({
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+34 600 000 000',
    currentPassword: '',
    newPassword: '',
    notifications: {
        email: true,
        sms: false,
        promos: true
    }
  });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#111827]">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal y configuración de seguridad.</p>
      </div>

      <div className="flex flex-col gap-6 max-w-4xl">
        
        {/* Profile Photo */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
                <img 
                    src="https://ui-avatars.com/api/?name=Alex+Rivera&background=random&size=128" 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
                <button className="absolute bottom-0 right-0 bg-[#3B82F6] text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
            </div>
            <div className="text-center md:text-left flex-1">
                <h3 className="font-bold text-lg text-[#111827]">Foto de perfil</h3>
                <p className="text-sm text-gray-500 mb-3">Sube una nueva foto. Se recomiendan archivos JPG o PNG de al menos 400x400px.</p>
                <div className="flex gap-4 justify-center md:justify-start">
                    <button className="text-sm font-bold text-[#3B82F6] hover:underline">Cambiar foto</button>
                    <button className="text-sm font-bold text-gray-400 hover:text-red-500 hover:underline transition-colors">Eliminar</button>
                </div>
            </div>
        </div>

        {/* Personal Data */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h3 className="font-bold text-lg text-[#111827] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">badge</span>
                Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#111827]">Nombre Completo</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#111827]">Correo Electrónico</label>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-[#111827]">Teléfono</label>
                    <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h3 className="font-bold text-lg text-[#111827] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">lock</span>
                Seguridad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#111827]">Contraseña Actual</label>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#111827]">Nueva Contraseña</label>
                    <input 
                        type="password" 
                        placeholder="Mínimo 8 caracteres"
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h3 className="font-bold text-lg text-[#111827] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">notifications</span>
                Preferencias de Notificación
            </h3>
            <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            checked={formData.notifications.email}
                            onChange={(e) => setFormData({...formData, notifications: {...formData.notifications, email: e.target.checked}})}
                            className="w-5 h-5 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6] cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium">Notificaciones por Email</span>
                    </div>
                    <span className="text-xs text-gray-400">Reservas y recordatorios</span>
                </label>
                <div className="h-px bg-gray-100"></div>
                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            checked={formData.notifications.sms}
                            onChange={(e) => setFormData({...formData, notifications: {...formData.notifications, sms: e.target.checked}})}
                            className="w-5 h-5 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6] cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium">Notificaciones SMS</span>
                    </div>
                    <span className="text-xs text-gray-400">Avisos urgentes</span>
                </label>
                <div className="h-px bg-gray-100"></div>
                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            checked={formData.notifications.promos}
                            onChange={(e) => setFormData({...formData, notifications: {...formData.notifications, promos: e.target.checked}})}
                            className="w-5 h-5 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6] cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium">Ofertas y Promociones</span>
                    </div>
                    <span className="text-xs text-gray-400">Novedades del hotel</span>
                </label>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-2">
            <button className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
            </button>
            <button className="px-8 py-3 rounded-xl bg-[#3B82F6] text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                Guardar Cambios
            </button>
        </div>

      </div>
    </div>
  );
};