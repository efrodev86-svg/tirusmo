import React, { useState } from 'react';

interface CustomerCheckoutProps {
  onBack: () => void;
}

export const CustomerCheckout: React.FC<CustomerCheckoutProps> = ({ onBack }) => {
  const [rating, setRating] = useState(0);
  const [fiscalData, setFiscalData] = useState({
    rfc: '',
    razonSocial: '',
    cfdi: 'G03 - Gastos en general',
    email: 'facturacion@empresa.com'
  });

  const charges = [
    { desc: "Estancia Habitación 402 (3 noches)", date: "12-15 Oct", amount: 4500.00 },
    { desc: "Restaurante - Room Service", date: "13 Oct", amount: 450.00 },
    { desc: "Minibar - Consumos", date: "14 Oct", amount: 120.00 },
  ];

  const subtotal = 5070.00;
  const iva = 811.20;
  const total = 5881.20;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
       {/* Header */}
       <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button onClick={onBack} className="hover:text-blue-600 transition-colors">Inicio</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <button onClick={onBack} className="hover:text-blue-600 transition-colors">Seguimiento</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-bold text-[#111827]">Checkout y Facturación</span>
        </div>
        <h1 className="text-3xl font-black text-[#111827]">Checkout Digital y Facturación</h1>
        <p className="text-gray-500 mt-1">Finalice su estancia revisando sus cargos y completando sus datos de facturación.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Charges Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-blue-600 text-[24px]">receipt_long</span>
                    <h2 className="text-lg font-bold text-[#111827]">Resumen de Cargos</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[10px] text-gray-400 font-bold uppercase border-b border-gray-100">
                                <th className="pb-3 font-bold">Descripción</th>
                                <th className="pb-3 font-bold">Fecha</th>
                                <th className="pb-3 text-right font-bold">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600">
                            {charges.map((charge, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0">
                                    <td className="py-4 pr-4">{charge.desc}</td>
                                    <td className="py-4 pr-4">{charge.date}</td>
                                    <td className="py-4 text-right font-medium text-[#111827]">${charge.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={2} className="py-4 text-gray-500">IVA (16%)</td>
                                <td className="py-4 text-right font-medium text-[#111827]">${iva.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="pt-6 text-lg font-bold text-[#111827]">Total a Pagar</td>
                                <td className="pt-6 text-right text-2xl font-black text-[#3B82F6]">${total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Fiscal Data Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-blue-600 text-[24px]">domain</span>
                    <h2 className="text-lg font-bold text-[#111827]">Datos Fiscales</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#111827]">RFC</label>
                        <input 
                            type="text" 
                            placeholder="ABC123456XYZ"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                            value={fiscalData.rfc}
                            onChange={(e) => setFiscalData({...fiscalData, rfc: e.target.value})}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#111827]">Razón Social</label>
                        <input 
                            type="text" 
                            placeholder="Nombre de la empresa o persona"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                            value={fiscalData.razonSocial}
                            onChange={(e) => setFiscalData({...fiscalData, razonSocial: e.target.value})}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#111827]">Uso de CFDI</label>
                        <div className="relative">
                            <select 
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                                value={fiscalData.cfdi}
                                onChange={(e) => setFiscalData({...fiscalData, cfdi: e.target.value})}
                            >
                                <option>G03 - Gastos en general</option>
                                <option>P01 - Por definir</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#111827]">Correo para envío de Factura</label>
                        <input 
                            type="email" 
                            placeholder="facturacion@empresa.com"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                            value={fiscalData.email}
                            onChange={(e) => setFiscalData({...fiscalData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <button className="flex-1 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Realizar Checkout Digital
                    </button>
                    <button className="flex-1 bg-white hover:bg-gray-50 text-[#3B82F6] border border-blue-200 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Descargar Factura XML/PDF
                    </button>
                </div>
            </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
            
            {/* Stay Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-6">Información de Estancia</h3>
                <div className="flex flex-col gap-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Habitación</span>
                        <span className="font-bold text-[#111827]">402 - Deluxe King</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Fecha Entrada</span>
                        <span className="font-bold text-[#111827]">12 Oct 2023</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Fecha Salida</span>
                        <span className="font-bold text-[#111827]">15 Oct 2023</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-500">Estado</span>
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase">PENDIENTE SALIDA</span>
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-1">Su opinión nos importa</h3>
                <p className="text-gray-500 text-sm mb-4">¿Cómo calificaría su estancia?</p>
                
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <span className={`material-symbols-outlined text-[32px] ${rating >= star ? 'filled text-amber-400' : 'text-gray-300'}`}>star</span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-xs font-bold text-[#111827]">Comentarios Finales</label>
                    <textarea 
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 h-24 resize-none"
                        placeholder="Compártanos su experiencia..."
                    ></textarea>
                </div>

                <button className="w-full text-gray-500 font-bold text-sm hover:text-[#111827] transition-colors">
                    Enviar Comentarios
                </button>
            </div>

            {/* Support Box */}
            <div className="bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE] p-6 text-center">
                <div className="flex justify-center items-center gap-2 mb-2 text-[#1E40AF]">
                    <span className="material-symbols-outlined filled text-[20px]">help</span>
                    <h3 className="font-bold text-sm">¿Necesita ayuda?</h3>
                </div>
                <p className="text-xs text-[#1E3A8A] mb-4 leading-relaxed">
                    Si tiene alguna duda con sus cargos, contacte a recepción directamente desde su teléfono o chat.
                </p>
                <button className="bg-white hover:bg-blue-50 text-[#3B82F6] font-bold py-2.5 px-4 rounded-lg w-full text-xs shadow-sm transition-all border border-blue-100">
                    Contactar Recepción
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};