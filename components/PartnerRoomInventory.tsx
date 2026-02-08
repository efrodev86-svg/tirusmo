import React, { useState } from 'react';

interface PartnerRoomInventoryProps {
    onCreateRoom: () => void;
    onEditRoom: (id: number) => void;
}

export const PartnerRoomInventory: React.FC<PartnerRoomInventoryProps> = ({ onCreateRoom, onEditRoom }) => {
  const [rooms, setRooms] = useState([
    {
      id: 1,
      name: "Master Suite 101",
      location: "Planta Alta • Vista Mar",
      type: "Master Suite",
      capacity: 4,
      price: 250.00,
      status: "Disponible",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: 2,
      name: "Junior Suite 202",
      location: "Planta Media • Balcón",
      type: "Junior Suite",
      capacity: 2,
      price: 180.00,
      status: "Ocupada",
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: 3,
      name: "Estándar King 305",
      location: "Planta Baja • Acceso Jardín",
      type: "Doble",
      capacity: 3,
      price: 120.00,
      status: "En Mantenimiento",
      image: "https://ui-avatars.com/api/?name=Estan+King&background=random"
    }
  ]);

  const [roomToDelete, setRoomToDelete] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Disponible': return 'bg-green-100 text-green-700';
          case 'Ocupada': return 'bg-blue-100 text-blue-700';
          case 'En Mantenimiento': return 'bg-orange-100 text-orange-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  const handleDelete = () => {
    if (roomToDelete) {
        setRooms(rooms.filter(room => room.id !== roomToDelete));
        setRoomToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-[#111827]">Inventario de Habitaciones</h1>
            <div className="flex items-center gap-4">
                <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px] filled">notifications</span>
                </button>
                <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                    <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative">
                     <select className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                         <option>Todos los tipos</option>
                         <option>Master Suite</option>
                         <option>Junior Suite</option>
                         <option>Doble</option>
                     </select>
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                </div>
                <div className="relative">
                     <select className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                         <option>Estado</option>
                         <option>Disponible</option>
                         <option>Ocupada</option>
                         <option>Mantenimiento</option>
                     </select>
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                </div>
            </div>
            <button 
                onClick={onCreateRoom}
                className="bg-[#1E3A8A] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
            >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Nueva Habitación
            </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/50">
                            <th className="py-4 pl-6">IMAGEN</th>
                            <th className="py-4">NOMBRE</th>
                            <th className="py-4">TIPO</th>
                            <th className="py-4 text-center">CAPACIDAD</th>
                            <th className="py-4 text-center">PRECIO BASE</th>
                            <th className="py-4 text-center">ESTADO</th>
                            <th className="py-4 text-right pr-6">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {rooms.map((room) => (
                            <tr 
                                key={room.id} 
                                className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onEditRoom(room.id)}
                            >
                                <td className="py-4 pl-6">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                        <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                    </div>
                                </td>
                                <td className="py-4">
                                    <p className="font-bold text-[#111827]">{room.name}</p>
                                    <p className="text-xs text-gray-400">{room.location}</p>
                                </td>
                                <td className="py-4 text-gray-600">{room.type}</td>
                                <td className="py-4 text-center">
                                    <div className="flex items-center justify-center gap-1 text-gray-600">
                                        <span className="font-bold">{room.capacity}</span>
                                        <span className="material-symbols-outlined text-[16px] filled text-gray-400">person</span>
                                    </div>
                                </td>
                                <td className="py-4 text-center">
                                    <p className="font-bold text-[#111827]">${room.price.toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-400">Por noche</p>
                                </td>
                                <td className="py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusColor(room.status)}`}>
                                        {room.status}
                                    </span>
                                </td>
                                <td className="py-4 text-right pr-6">
                                    <div className="flex justify-end gap-2 text-gray-400" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEditRoom(room.id); }}
                                            className="hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEditRoom(room.id); }}
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setRoomToDelete(room.id); }}
                                            className="hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4 mt-auto bg-white">
                 <span className="text-xs text-gray-400 font-medium">Mostrando {rooms.length} de <span className="text-gray-900 font-bold">24</span> habitaciones</span>
                 <div className="flex gap-2 items-center">
                     <button className="text-xs font-bold text-gray-500 hover:text-primary px-2">Anterior</button>
                     <button className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold flex items-center justify-center shadow-md">1</button>
                     <button className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center transition-colors">2</button>
                     <button className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center transition-colors">3</button>
                     <button className="text-xs font-bold text-gray-500 hover:text-primary px-2">Siguiente</button>
                 </div>
            </div>
        </div>

        {/* Summary Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                     <span className="material-symbols-outlined text-[20px] filled">check_circle</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DISPONIBLES</div>
                    <div className="text-2xl font-bold text-[#111827]">18</div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                     <span className="material-symbols-outlined text-[20px] filled">bed</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OCUPADAS</div>
                    <div className="text-2xl font-bold text-[#111827]">4</div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                     <span className="material-symbols-outlined text-[20px] filled">build</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">EN MANTENIMIENTO</div>
                    <div className="text-2xl font-bold text-[#111827]">2</div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                     <span className="material-symbols-outlined text-[20px] filled">analytics</span>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL HABITACIONES</div>
                    <div className="text-2xl font-bold text-[#111827]">{rooms.length}</div>
                </div>
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {roomToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setRoomToDelete(null)}></div>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <span className="material-symbols-outlined text-3xl text-red-600 filled">delete</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar habitación?</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Estás a punto de eliminar esta habitación del inventario. <br/>
                            <span className="font-semibold text-gray-700">Esta acción no se puede deshacer.</span>
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setRoomToDelete(null)}
                                className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200 text-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-200 text-sm"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};