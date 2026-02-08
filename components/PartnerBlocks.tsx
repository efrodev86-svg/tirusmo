import React from 'react';

interface PartnerBlocksProps {
    onCreateBlock?: () => void;
}

export const PartnerBlocks: React.FC<PartnerBlocksProps> = ({ onCreateBlock }) => {
  const blocks = [
    { id: 1, room: "Master Suite 101", startDate: "25 Oct, 2023", endDate: "27 Oct, 2023", reason: "Mantenimiento AC", status: "Programado", type: "Mantenimiento" },
    { id: 2, room: "Junior Suite 202", startDate: "24 Oct, 2023", endDate: "24 Oct, 2023", reason: "Limpieza Profunda", status: "Activo", type: "Limpieza" },
    { id: 3, room: "Estándar King 305", startDate: "01 Nov, 2023", endDate: "05 Nov, 2023", reason: "Remodelación", status: "Programado", type: "Obras" },
    { id: 4, room: "Doble Deluxe 401", startDate: "15 Dic, 2023", endDate: "20 Dic, 2023", reason: "Uso Interno", status: "Programado", type: "Administrativo" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-[#111827]">Bloqueos de Habitaciones</h1>
            <div className="flex items-center gap-4">
                 <button className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px] filled">notifications</span>
                </button>
                <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                    <img src="https://ui-avatars.com/api/?name=Partner+User&background=10B981&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
                     <input type="text" placeholder="Buscar habitación..." className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-64" />
                </div>
                <div className="relative">
                     <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                         <option>Todos los estados</option>
                         <option>Activo</option>
                         <option>Programado</option>
                         <option>Pasado</option>
                     </select>
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                </div>
            </div>
            <button 
                onClick={onCreateBlock}
                className="bg-[#EF4444] hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center shadow-sm shadow-red-200"
            >
                <span className="material-symbols-outlined text-[20px]">block</span>
                Bloquear Habitación
            </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/50">
                        <th className="py-4 pl-6">Habitación</th>
                        <th className="py-4">Fechas</th>
                        <th className="py-4">Tipo</th>
                        <th className="py-4">Motivo</th>
                        <th className="py-4 text-center">Estado</th>
                        <th className="py-4 text-right pr-6">Acciones</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {blocks.map((block) => (
                        <tr key={block.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-4 pl-6 font-bold text-[#111827]">{block.room}</td>
                            <td className="py-4 text-gray-600 font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400 text-[16px]">date_range</span>
                                    {block.startDate} - {block.endDate}
                                </div>
                            </td>
                            <td className="py-4">
                                 <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">
                                    {block.type}
                                 </span>
                            </td>
                            <td className="py-4 text-gray-500">{block.reason}</td>
                            <td className="py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${block.status === 'Activo' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {block.status}
                                </span>
                            </td>
                            <td className="py-4 text-right pr-6">
                                <div className="flex justify-end gap-2">
                                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg" title="Editar">
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg" title="Eliminar">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Empty State visual helper if needed, currently using mock data */}
            {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                    <p>No hay bloqueos registrados</p>
                </div>
            )}
        </div>
    </div>
  );
};