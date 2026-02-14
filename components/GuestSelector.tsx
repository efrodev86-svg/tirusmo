import React, { useState } from 'react';

interface GuestSelectorProps {
  initialAdults: number;
  initialChildren: number;
  initialRooms: number;
  onApply: (adults: number, children: number, rooms: number) => void;
  onCancel: () => void;
}

export const GuestSelector: React.FC<GuestSelectorProps> = ({ 
  initialAdults, 
  initialChildren, 
  initialRooms, 
  onApply, 
  onCancel 
}) => {
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [rooms, setRooms] = useState(initialRooms);

  const increment = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value + 1);
  };

  const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, min: number) => {
    if (value > min) {
      setter(value - 1);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a2634] shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 w-[320px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 select-none">
      <div className="flex flex-col gap-6">
        
        {/* Adults */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-bold text-[#111418] dark:text-white">Adultos</span>
            <span className="text-xs text-gray-500">Desde 18 años</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => decrement(setAdults, adults, 1)}
              className={`w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors ${adults <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={adults <= 1}
            >
              <span className="material-symbols-outlined text-lg">remove</span>
            </button>
            <span className="w-4 text-center font-bold text-[#111418] dark:text-white">{adults}</span>
            <button 
              onClick={() => increment(setAdults, adults)}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        </div>

        {/* Children */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-bold text-[#111418] dark:text-white">Menores</span>
            <span className="text-xs text-gray-500">Hasta 17 años</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => decrement(setChildren, children, 0)}
              className={`w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors ${children <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={children <= 0}
            >
              <span className="material-symbols-outlined text-lg">remove</span>
            </button>
            <span className="w-4 text-center font-bold text-[#111418] dark:text-white">{children}</span>
            <button 
              onClick={() => increment(setChildren, children)}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

        {/* Rooms */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-bold text-[#111418] dark:text-white">Habitaciones</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => decrement(setRooms, rooms, 1)}
              className={`w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors ${rooms <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={rooms <= 1}
            >
              <span className="material-symbols-outlined text-lg">remove</span>
            </button>
            <span className="w-4 text-center font-bold text-[#111418] dark:text-white">{rooms}</span>
            <button 
              onClick={() => increment(setRooms, rooms)}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 pt-2">
          <button 
            onClick={onCancel}
            className="text-primary font-bold text-sm hover:underline px-2 py-1"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onApply(adults, children, rooms)}
            className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md"
          >
            Aplicar
          </button>
        </div>

      </div>
    </div>
  );
};