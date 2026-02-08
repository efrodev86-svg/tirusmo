import React from 'react';

interface AdminUsersProps {
  onEditUser?: (id: string) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onEditUser }) => {
  // Mock Data
  const users = [
    { 
      id: 'USR-9283', 
      name: 'Alejandro Martínez', 
      email: 'a.martinez@example.com', 
      role: 'Admin', 
      date: '24 Oct, 2023', 
      status: 'Activo', 
      img: 'https://ui-avatars.com/api/?name=Alejandro+Martinez&background=random' 
    },
    { 
      id: 'USR-9284', 
      name: 'Sofía López', 
      email: 's.lopez@partner.com', 
      role: 'Partner', 
      date: '15 Oct, 2023', 
      status: 'Activo', 
      img: 'https://ui-avatars.com/api/?name=Sofia+Lopez&background=random' 
    },
    { 
      id: 'USR-9285', 
      name: 'Carlos Ruíz', 
      email: 'cruiz@gmail.com', 
      role: 'Cliente', 
      date: '10 Oct, 2023', 
      status: 'Inactivo', 
      img: 'https://ui-avatars.com/api/?name=Carlos+Ruiz&background=random' 
    },
    { 
      id: 'USR-9286', 
      name: 'Miguel Ángel', 
      email: 'm.angel@outlook.com', 
      role: 'Cliente', 
      date: '08 Oct, 2023', 
      status: 'Activo', 
      img: 'https://ui-avatars.com/api/?name=Miguel+Angel&background=random' 
    },
    { 
      id: 'USR-9287', 
      name: 'Lucía Alva', 
      email: 'l.alva@hotels.com', 
      role: 'Partner', 
      date: '05 Oct, 2023', 
      status: 'Activo', 
      img: 'https://ui-avatars.com/api/?name=Lucia+Alva&background=EBF5FF&color=2b7cee' 
    },
  ];

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'Admin': return 'bg-blue-100 text-blue-700';
      case 'Partner': return 'bg-purple-100 text-purple-700';
      case 'Cliente': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-[#111827]">Gestión de Usuarios</h1>
            <div className="flex items-center gap-4 w-full md:w-auto">
                 {/* Search Bar */}
                <div className="relative flex-1 md:w-80">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar usuario..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-600" 
                    />
                </div>
                <button className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors relative shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[22px] filled">notifications</span>
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-200 shrink-0">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-[#111827]">Listado de Usuarios</h2>
                    <p className="text-sm text-gray-500">Administra los accesos y roles de la plataforma</p>
                </div>
                <button className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    Nuevo Usuario
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/30">
                            <th className="py-4 pl-6">Nombre</th>
                            <th className="py-4">Email</th>
                            <th className="py-4">Rol</th>
                            <th className="py-4">Fecha de Registro</th>
                            <th className="py-4">Estado</th>
                            <th className="py-4 text-center pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {users.map((user, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <img src={user.img} className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <p className="font-bold text-[#111827]">{user.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">ID: {user.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-gray-600">{user.email}</td>
                                <td className="py-4">
                                    <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4 text-gray-600">{user.date}</td>
                                <td className="py-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${user.status === 'Activo' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-xs font-bold ${user.status === 'Activo' ? 'text-green-600' : 'text-gray-400'}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-center pr-6">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => onEditUser && onEditUser(user.id)}
                                            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-4 bg-gray-50/30">
                <span className="text-xs text-gray-400 font-medium">Mostrando 5 de 128 usuarios</span>
                <div className="flex gap-2">
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 rounded bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-200">1</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white text-gray-600 text-xs font-medium flex items-center justify-center hover:bg-gray-50">2</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white text-gray-600 text-xs font-medium flex items-center justify-center hover:bg-gray-50">3</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};