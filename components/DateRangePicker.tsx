import React, { useState } from 'react';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ checkIn, checkOut, onChange, onClose }) => {
  // Mostrar mes actual y el siguiente
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const getDaysArray = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    // Padding for empty start days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const handleDateClick = (date: Date) => {
    const day = startOfDay(date);
    const start = checkIn ? startOfDay(checkIn) : null;
    const end = checkOut ? startOfDay(checkOut) : null;

    if (!start || (start && end)) {
      onChange(day, null);
    } else if (start && !end) {
      if (day < start) {
        onChange(day, null);
      } else if (day.getTime() === start.getTime()) {
        const nextDay = new Date(start);
        nextDay.setDate(nextDay.getDate() + 1);
        onChange(start, nextDay);
      } else {
        onChange(start, day);
      }
    }
  };

  const renderMonth = (offset: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + offset;
    // Handle year rollover logic handled by Date constructor automatically
    const currentMonthDate = new Date(year, month, 1);
    const displayYear = currentMonthDate.getFullYear();
    const displayMonth = currentMonthDate.getMonth();
    
    const days = getDaysArray(displayYear, displayMonth);

    return (
      <div className="flex-1 min-w-[300px] p-4">
        <div className="text-center font-bold mb-4 capitalize text-gray-800 dark:text-white text-lg">
          {MONTH_NAMES[displayMonth]} <span className="text-gray-400">{displayYear}</span>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-semibold uppercase tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} />;
            
            // Interaction States
            const isSelectedStart = isSameDay(date, checkIn);
            const isSelectedEnd = isSameDay(date, checkOut);
            
            // Range Logic
            let isInRange = false;
            if (checkIn && checkOut && date > checkIn && date < checkOut) {
              isInRange = true;
            }
            // Hover Logic (visualize range before selection)
            if (checkIn && !checkOut && hoverDate && date > checkIn && date <= hoverDate) {
               isInRange = true;
            }

            const isStart = isSelectedStart || (checkIn && !checkOut && isSameDay(date, checkIn));
            const isEnd = isSelectedEnd;
            const isRangeEnd = isEnd || (checkIn && !checkOut && hoverDate && isSameDay(date, hoverDate));

            // Styles
            let wrapperClasses = "relative w-full h-10 flex items-center justify-center cursor-pointer";
            
            // Circle button style
            let btnClass = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative z-10";
            
            if (isStart) {
              btnClass += " bg-primary text-white shadow-md hover:scale-105";
            } else if (isEnd) {
              btnClass += " bg-primary text-white shadow-md hover:scale-105";
            } else if (isInRange) {
              btnClass += " text-primary font-bold";
            } else {
              btnClass += " hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200";
            }

            // Connection Lines
            const showLeftConnect = isInRange || isEnd || (checkIn && !checkOut && hoverDate && date <= hoverDate && date > checkIn);
            const showRightConnect = isInRange || isStart && (checkOut || (hoverDate && hoverDate > date));

            return (
              <div 
                key={idx} 
                className={wrapperClasses}
                onMouseEnter={() => setHoverDate(date)}
                onClick={() => handleDateClick(date)}
              >
                 {showLeftConnect && (
                    <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-primary/10 dark:bg-primary/20"></div>
                 )}
                 {showRightConnect && (
                    <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-primary/10 dark:bg-primary/20"></div>
                 )}
                 <div className={btnClass}>
                    {date.getDate()}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-white dark:bg-[#1a2634] shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
       <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
           <h3 className="font-bold text-lg dark:text-white pl-2">Selecciona fechas</h3>
           <div className="flex gap-2">
               <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                 <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">chevron_left</span>
               </button>
               <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                 <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">chevron_right</span>
               </button>
           </div>
       </div>
       <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
          {renderMonth(0)}
          <div className="hidden md:block">
            {renderMonth(1)}
          </div>
       </div>
       <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-blue-600 shadow-lg shadow-primary/30 transition-all">Listo</button>
       </div>
    </div>
  );
};