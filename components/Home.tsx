import React, { useState, useEffect, useRef } from 'react';
import { SearchParams } from '../types';
import { getDestinations } from '../services/hotelService';
import { DateRangePicker } from './DateRangePicker';
import { GuestSelector } from './GuestSelector';

interface HomeProps {
  onSearch: (params: SearchParams) => void;
  onSelectFeatured: (hotelId: number) => void;
}

const Home: React.FC<HomeProps> = ({ onSearch, onSelectFeatured }) => {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("2023-10-15");
  const [checkOut, setCheckOut] = useState("2023-10-19");
  
  // Guest State
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  
  const [budget, setBudget] = useState("");
  
  // Error de validación: falta destino o presupuesto
  const [destBudgetError, setDestBudgetError] = useState(false);
  
  // Travel Style State (solo se puede seleccionar uno)
  const TRAVEL_STYLE_OPTIONS = ['Romántico', 'Pareja', 'Amigos', 'Familiar'] as const;
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [petFriendly, setPetFriendly] = useState(false);
  
  const [destinations, setDestinations] = useState<string[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const destInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDestinations().then(setDestinations);
  }, []);

  // DatePicker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Guest Selector State
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const guestSelectorRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destInputRef.current && !destInputRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (guestSelectorRef.current && !guestSelectorRef.current.contains(event.target as Node)) {
        setShowGuestSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDestinationList = () =>
    destinations.length ? destinations : ['Cancún, México', 'Puerto Vallarta, México', 'Los Cabos, México'];

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestination(val);
    setDestBudgetError(false);
    const list = getDestinationList();
    const filtered = val.length > 0
      ? list.filter((d) => d.toLowerCase().includes(val.toLowerCase()))
      : list;
    setFilteredDestinations(filtered);
    setShowDestDropdown(true);
  };

  const handleDestinationFocus = () => {
    const list = getDestinationList();
    const filtered = destination.length > 0
      ? list.filter((d) => d.toLowerCase().includes(destination.toLowerCase()))
      : list;
    setFilteredDestinations(filtered);
    setShowDestDropdown(true);
  };

  const handleDestinationSelect = (dest: string) => {
    setDestination(dest);
    setShowDestDropdown(false);
    setDestBudgetError(false);
  };

  // Date Helpers
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "..";
    const date = parseDate(dateString);
    if (!date) return "..";
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    if (start) setCheckIn(formatDate(start));
    if (end) {
      setCheckOut(formatDate(end));
    } else {
      setCheckOut('');
    }
  };

  const handleGuestApply = (a: number, c: number, r: number) => {
    setAdults(a);
    setChildren(c);
    setRooms(r);
    setShowGuestSelector(false);
  };

  const handleSearchClick = () => {
    if (!checkIn || !checkOut) {
      alert("Por favor seleccione las fechas de Entrada y Salida.");
      return;
    }

    const budgetNum = budget ? parseInt(String(budget).replace(/\D/g, ''), 10) : 0;
    const hasDestination = !!destination?.trim();
    const hasBudget = budgetNum > 0;
    if (!hasDestination && !hasBudget) {
      setDestBudgetError(true);
      alert("Indique al menos destino o presupuesto para buscar.");
      return;
    }
    setDestBudgetError(false);

    onSearch({
      destination: destination?.trim() || '',
      checkIn,
      checkOut,
      guests: { adults, children, rooms },
      budgetMin: 0,
      budgetMax: budgetNum || 0,
      petFriendly,
      travelStyles: selectedStyle ? [selectedStyle] : undefined
    });
  };

  return (
    <div className="flex-1 w-full">
      <section className="relative flex flex-col items-center justify-center pt-16 pb-40 px-4 md:px-10 lg:px-40">
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-black/20 to-background-light dark:to-background-dark"></div>
          <img 
            alt="Luxury spa hotel pool overlooking the ocean at sunset" 
            className="h-full w-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1ZNXVStktOZCO_PP_dagtfcrFa68yllscTGsfwRIzdrs2nif74E3NrR2D9Ku-rbPCCSCJJxxQkT2KPSrIKnfGQ69Y_SdVL9tZ_RfN8oDQAhM-aNomuw0UcjWEdv3tRQIqGkv8v8NTSZjnKAvvADiPhUOm_XjHzLf8zV7GO9OsBzaIdez-qXUZO7wSHJzBozNYH0fkZqIuoAih4YZWXescIyEVUJpUwKUAe0aXrfGSns6mG4yot10pKoCPs_bFL9VG9W1LtUHEA"
          />
        </div>

        <div className="relative z-20 flex flex-col gap-6 text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-6xl drop-shadow-lg">
            Encuentra tu estancia perfecta
          </h1>
          <h2 className="text-white/90 text-lg font-medium leading-normal md:text-xl drop-shadow-md max-w-2xl mx-auto">
            Descubre los mejores hoteles spa para tu próxima escapada de relajación y bienestar.
          </h2>
        </div>

        <div className="relative z-30 w-full max-w-5xl bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl p-4 md:p-6">
          <div className="flex flex-col gap-5">
            {/* Fila 1: Destino y Presupuesto */}
            <p className="text-sm font-bold text-primary px-1">Ingresa</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className={`px-4 py-2 rounded-xl border relative border-b-2 ${destBudgetError ? 'border-red-500' : 'border-gray-100 dark:border-gray-700 border-b-primary'}`} ref={destInputRef}>
                <label className="flex flex-col cursor-pointer group w-full">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Destino</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary">location_on</span>
                    <input 
                      className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-900 dark:text-white focus:ring-0 placeholder:text-gray-400" 
                      placeholder="¿A dónde vas?" 
                      type="text"
                      autoComplete="off"
                      value={destination}
                      onChange={handleDestinationChange}
                      onFocus={handleDestinationFocus}
                    />
                  </div>
                </label>
                {showDestDropdown && filteredDestinations.length > 0 && (
                  <ul className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg mt-2 z-50 max-h-60 overflow-y-auto">
                    {filteredDestinations.map((d) => (
                      <li 
                        key={d} 
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm"
                        onClick={() => handleDestinationSelect(d)}
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <span className="text-sm font-bold text-primary justify-self-center">y/o</span>

              <div className={`px-4 py-2 rounded-xl border border-b-2 ${destBudgetError ? 'border-red-500' : 'border-gray-100 dark:border-gray-700 border-b-primary'}`}>
                <label className="flex flex-col cursor-pointer group w-full">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Presupuesto total</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary">payments</span>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">$</span>
                    <input 
                      className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-900 dark:text-white focus:ring-0 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      type="text"
                      inputMode="numeric"
                      value={budget ? Number(budget.replace(/\D/g, '') || 0).toLocaleString('es-MX') : ''}
                      onChange={(e) => {
                        setBudget(e.target.value.replace(/\D/g, ''));
                        setDestBudgetError(false);
                      }}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Fila 2: Entrada-Salida, Huéspedes, Botón Buscar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 relative" ref={datePickerRef}>
                <label 
                  className="flex flex-col cursor-pointer group w-full"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Entrada - Salida</span>
                  <div className="flex items-center gap-2 relative">
                    <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary">calendar_month</span>
                    <div className="flex-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {checkIn ? `${formatDateDisplay(checkIn)} - ${formatDateDisplay(checkOut)}` : 'Agregar fechas'}
                    </div>
                  </div>
                </label>
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-4 z-50 w-[300px] md:w-[650px]">
                    <DateRangePicker 
                      checkIn={parseDate(checkIn)}
                      checkOut={parseDate(checkOut)}
                      onChange={handleDateChange}
                      onClose={() => setShowDatePicker(false)}
                    />
                  </div>
                )}
              </div>

              <div className="px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 relative" ref={guestSelectorRef}>
                <label 
                  className="flex flex-col cursor-pointer group w-full"
                  onClick={() => setShowGuestSelector(!showGuestSelector)}
                >
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Huéspedes</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary">group</span>
                    <div className="flex-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {adults} adultos, {rooms} hab.
                    </div>
                  </div>
                </label>
                {showGuestSelector && (
                  <div className="absolute top-full left-0 mt-4 z-50">
                    <GuestSelector
                      initialAdults={adults}
                      initialChildren={children}
                      initialRooms={rooms}
                      onApply={handleGuestApply}
                      onCancel={() => setShowGuestSelector(false)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center md:justify-end">
                <button 
                  onClick={handleSearchClick}
                  className="h-12 px-8 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 w-full md:w-auto"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                  <span>Buscar</span>
                </button>
              </div>
            </div>

            {/* Fila 3: Estilo de viaje */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white px-1">Busca por tu estilo de viaje</h3>
              <div className="flex flex-wrap items-center gap-3">
                {TRAVEL_STYLE_OPTIONS.map((style, idx) => {
                  const isSelected = selectedStyle === style;
                  return (
                    <button 
                      key={style} 
                      type="button"
                      onClick={() => setSelectedStyle(isSelected ? null : style)}
                      className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border pl-3 pr-5 transition-all shadow-sm ${
                        isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary text-gray-700 dark:text-white'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-white' : 'text-gray-500 group-hover:text-primary'}`}>
                        {idx === 0 ? 'favorite' : idx === 1 ? 'favorite' : idx === 2 ? 'group' : 'family_restroom'}
                      </span>
                      <span className="text-xs font-semibold">{style}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fila 4: Hotel pet friendly */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={petFriendly}
                  onChange={(e) => setPetFriendly(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className={`material-symbols-outlined text-[20px] transition-colors ${petFriendly ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>pets</span>
                <span className={`text-xs font-medium transition-colors ${petFriendly ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>Hotel pet friendly</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <div className="layout-container flex flex-col max-w-[1200px] mx-auto px-4 md:px-10 pb-20 relative z-40 mt-10">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] dark:text-white">Hoteles Destacados</h2>
          <a className="text-primary text-sm font-bold hover:underline" href="#">Ver todos</a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {/* Manually rendering 3 featured cards for the home page as per design */}
           {[1, 4, 2].map((id) => {
               // We need to fetch real data here synchronously for the render, in a real app this is async
               // For this demo we use the imported list directly for initial render
               const hotel = {
                   1: { name: "Grand Velas Riviera Maya", price: 520, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_TngrjqdbIZwcV5fo-_OSPUz_5eKC4IGECyrr8Dccp7pucUhxYV9BWsMV99xM4mNoyR1AuisjAFjjAd2apKiUSPlZ_uBbn67DtQD-kyKrj6bZtiuEB5DonBYgUnMB9lAw1ZC2gSiD9NLt4IZuvYBHCwo3d3u0jjJn37EClAPDS571Wdfg_d8t4ypmIDQ3oSfS8RA3R_sBjIG9rO0v4EFbfkkm7Cx-QJXmbm7yWeqRhGW9twljJIojTYFfg_xQCxJy4qnwg3z-Wg", loc: "Playa del Carmen", rating: 4.9 },
                   4: { name: "Le Blanc Spa Resort", price: 620, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP3pLgh2y6TTH9MWzXMUWpr3UsqYEa5HnrYpKUF4HoNHzCaq1N-mtHns-GaRnq5zh0_UgKocBzYaXzlhuBF0Vi6jD-gwqlGyqZa70fwyGeU6rBVSfz-EY_yJBZx-yAbI15V8nhp_8ksTQaXq9pSuK5IH9McYauZMvLBnsG-IdH4dr8kKdBJWBiazXque5PAKY-_fYwVBe3pyX3XtZ_ka1dI0_cDMKVYRGCyYMyBEABqDM9wBM805itA_UYUhzJIk-jmBwEdal38Q", loc: "Cancún", rating: 4.9 },
                   2: { name: "Banyan Tree Mayakoba", price: 890, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCux6AX2LOwRPThlnnzxt4dZQ8-03244X7FYOtT1KjTAq-mvy4mZn9SE6edFKdCdmRHUF634BNntSHj5T7OeUPn5ABjICKJMY0YzgwdP7td_Sjjx-WnBPUTXzf2r3C6wSvgCuTte-d05R4b-lUh6mK5dNHPCcGY7v_7YH-Ii4cpzH47MY4J3qftkKaNVvq39uWiKKeZyQcwWJjqgbOgRZLonkk589Kl8xj8yd90q3PVZNlLJHUCTJ-PSqokleRTJSZ-rWGfo3etAQ", loc: "Riviera Maya", rating: 4.8 }
               }[id] as any;

               return (
                <div key={id} className="flex flex-col gap-3 group/card cursor-pointer" onClick={() => onSelectFeatured(id)}>
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover/card:shadow-md transition-shadow">
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1 z-10 shadow-sm">
                        <span className="material-symbols-outlined text-yellow-500 text-[16px] filled">star</span>
                        <span className="text-xs font-bold dark:text-white">{hotel.rating}</span>
                    </div>
                    <img alt={hotel.name} className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-500" src={hotel.img}/>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-[#111418] dark:text-white line-clamp-1 group-hover/card:text-primary transition-colors">{hotel.name}</h3>
                        <div className="text-right">
                        <p className="text-lg font-bold text-[#111418] dark:text-white">${hotel.price}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-[#617289] dark:text-gray-400">
                        <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        <span className="truncate max-w-[150px]">{hotel.loc}</span>
                        </div>
                        <span>/noche</span>
                    </div>
                    </div>
                </div>
               );
           })}
        </div>
      </div>
    </div>
  );
};

export default Home;