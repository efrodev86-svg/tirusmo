import React, { useState } from 'react';

interface AdminUserDetailProps {
  userId: string;
  onBack: () => void;
}

export const AdminUserDetail: React.FC<AdminUserDetailProps> = ({ userId, onBack }) => {
    // Mock data based on the design
    const [userData, setUserData] = useState({
        name: "Alejandro Martínez",
        email: "alejandro.m@example.com",
        phone: "+34 600 000 000",
        role: "Gestor de Reservas", // Maps to 'Admin' or specific role name from design
        status: true, // true = Activo
        image: "https://ui-avatars.com/api/?name=Alejandro+Martinez&background=random"
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        // Aquí iría la lógica para llamar a la API y eliminar el usuario
        console.log("Eliminando usuario:", userId);
        setIsDeleteModalOpen(false);
        onBack(); // Regresar al listado después de eliminar
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto pb-10 relative">
            {/* Header */}
            <div>
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    <span className="text-sm font-bold">Volver al listado</span>
                </button>
                <h1 className="text-2xl font-bold text-[#111827]">Información del Usuario</h1>
                <p className="text-gray-500 mt-1">Completa los datos para actualizar el perfil del usuario en la plataforma.</p>
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                
                {/* Profile Picture */}
                <div className="flex items-start gap-6 mb-8">
                    <div className="relative group cursor-pointer">
                        <img src={userData.image} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                        <button className="absolute bottom-0 right-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-blue-600 transition-colors z-10">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                    </div>
                    <div className="mt-2">
                        <h3 className="font-bold text-[#111827]">Foto de Perfil</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-3">JPG, GIF o PNG. Tamaño máximo 2MB.</p>
                        <div className="flex gap-3">
                            <button className="text-sm font-bold text-primary hover:underline">Cambiar foto</button>
                            <button className="text-sm font-bold text-red-500 hover:underline">Eliminar</button>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Nombre Completo</label>
                        <input 
                            type="text" 
                            value={userData.name}
                            onChange={(e) => setUserData({...userData, name: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-gray-800"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Correo Electrónico</label>
                        <input 
                            type="email" 
                            value={userData.email}
                            onChange={(e) => setUserData({...userData, email: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-gray-800"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Teléfono</label>
                        <input 
                            type="tel" 
                            value={userData.phone}
                            onChange={(e) => setUserData({...userData, phone: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-gray-800"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Rol de Usuario</label>
                        <div className="relative">
                            <select 
                                value={userData.role}
                                onChange={(e) => setUserData({...userData, role: e.target.value})}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-gray-800 appearance-none cursor-pointer"
                            >
                                <option>Gestor de Reservas</option>
                                <option>Administrador</option>
                                <option>Partner</option>
                                <option>Cliente</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none text-[20px]">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Status Toggle */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-between mb-8">
                    <div>
                        <h4 className="font-bold text-sm text-[#111827]">Estado de la cuenta</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Si está inactivo, el usuario no podrá acceder al panel.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={userData.status} onChange={() => setUserData({...userData, status: !userData.status})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        <span className="ml-3 text-sm font-bold text-gray-700 w-16 text-right">{userData.status ? 'Activo' : 'Inactivo'}</span>
                    </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={onBack} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-200">
                        Guardar Cambios
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl border border-red-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold text-red-600">Eliminar Cuenta</h3>
                    <p className="text-sm text-red-400 mt-1">Una vez que elimines una cuenta, no hay vuelta atrás. Por favor, ten seguridad.</p>
                </div>
                <button 
                    onClick={handleDeleteClick}
                    className="px-5 py-2.5 rounded-lg bg-white border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap"
                >
                    Eliminar Usuario
                </button>
            </div>

             {/* Delete Confirmation Modal */}
             {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                     {/* Backdrop */}
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
                    
                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-5">
                                <span className="material-symbols-outlined text-3xl text-red-500 filled">warning</span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-[#111827] mb-2">Confirmación de Eliminación</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                ¿Estás seguro de que deseas eliminar este usuario?<br/>
                                <span className="font-semibold text-gray-700">Esta acción no se puede deshacer.</span>
                            </p>

                            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3 mb-6 text-left">
                                <img src={userData.image} className="w-10 h-10 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#111827] text-sm truncate">{userData.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{userData.role}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-400 text-[20px]">person</span>
                            </div>

                            <div className="flex flex-col w-full gap-3">
                                <button 
                                    onClick={handleConfirmDelete}
                                    className="w-full py-3 px-4 bg-[#DC2626] hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm"
                                >
                                    Eliminar Permanentemente
                                </button>
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-[#DC2626]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};