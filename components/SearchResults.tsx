import React, { useState, useEffect, useMemo } from 'react';
import { SearchParams, Hotel } from '../types';
import { getHotels } from '../services/hotelService';
import { supabase } from '../lib/supabase';

type AmenityItem = { slug: string; label: string; category: string; sort_order: number };

const AMENITY_CATEGORY_LABELS: Record<string, string> = {
  conectividad: 'Conectividad',
  alberca_wellness: 'Alberca y bienestar',
  comida_bebida: 'Comida y bebida',
  habitacion: 'Habitación',
  servicios: 'Servicios',
  familia_mascotas: 'Familia y mascotas',
  deportes: 'Deportes',
  accesibilidad: 'Accesibilidad',
  general: 'General',
};

const TRAVEL_STYLE_OPTIONS = ['Romántico', 'Pareja', 'Amigos', 'Familiar'] as const;

const formatPrice = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 0 });
const parsePriceInput = (s: string) => {
  const digits = s.replace(/\D/g, '');
  return digits === '' ? NaN : Number(digits);
};

interface SearchResultsProps {
  searchParams: SearchParams;
  onSelectHotel: (hotel: Hotel) => void;
  onBack: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchParams, onSelectHotel, onBack }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [selectedPetFriendly, setSelectedPetFriendly] = useState(searchParams.petFriendly ?? false);
  const [amenityCatalog, setAmenityCatalog] = useState<AmenityItem[]>([]);
  const [expandedAmenityCategories, setExpandedAmenityCategories] = useState<Set<string>>(new Set());
  const [headerTravelStyles, setHeaderTravelStyles] = useState<string[]>(searchParams.travelStyles ?? []);
  const [priceSort, setPriceSort] = useState<'mayor_precio' | 'menor_precio' | ''>('');

  const PLAN_OPTIONS = [
    { value: 'desayuno', label: 'Desayuno' },
    { value: 'todo_incluido', label: 'Todo incluido' },
    { value: 'sin_plan', label: 'Sin plan de alimentos' },
  ] as const;

  useEffect(() => {
    getHotels().then(data => {
      setHotels(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    supabase
      .from('amenity_catalog')
      .select('slug, label, category, sort_order')
      .order('category')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setAmenityCatalog(data as AmenityItem[]);
      });
  }, []);

  useEffect(() => {
    setHeaderTravelStyles(searchParams.travelStyles ?? []);
  }, [searchParams.travelStyles]);

  const TAX_RATE = 0.16;
  const nights = useMemo(() => {
    if (!searchParams.checkIn || !searchParams.checkOut) return 1;
    const [y1, m1, d1] = searchParams.checkIn.split('-').map(Number);
    const [y2, m2, d2] = searchParams.checkOut.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);
    const diff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return diff || 1;
  }, [searchParams.checkIn, searchParams.checkOut]);
  const rooms = searchParams.guests?.rooms || 1;

  // Hoteles que coinciden con todo excepto el rango de precio (para calcular min/max encontrado)
  const hotelsWithoutPriceFilter = useMemo(() => {
    return hotels.filter(hotel => {
      const dest = searchParams.destination.toLowerCase().trim();
      const stateCountry = [hotel.state, hotel.country].filter(Boolean).join(', ').toLowerCase();
      const matchesLocation = dest === '' || hotel.location.toLowerCase().includes(dest) || dest.includes(hotel.location.toLowerCase()) || (stateCountry && (stateCountry.includes(dest) || dest.includes(stateCountry)));
      const matchesStars = selectedStars.length === 0 || selectedStars.includes(hotel.stars);
      const matchesAmenities = selectedAmenities.every(a => hotel.amenities.includes(a));
      const subtotal = hotel.price * nights * rooms;
      const totalWithTax = Math.round(subtotal * (1 + TAX_RATE));
      const matchesBudget = searchParams.budgetMax <= 0 ? true : totalWithTax <= searchParams.budgetMax;
      const petOk = !selectedPetFriendly || hotel.pet_friendly === true || (() => {
        const a = (hotel.amenities || []).join(' ').toLowerCase();
        const t = (hotel.tags || []).join(' ').toLowerCase();
        return /pet|mascota|animal/.test(a) || /pet|mascota|animal/.test(t);
      })();
      const travelStyles = headerTravelStyles;
      const hotelStyles = hotel.travel_styles ?? [];
      const matchesTravelStyles = travelStyles.length === 0 || travelStyles.some(s => hotelStyles.includes(s));
      const hotelPlanTypes = (hotel.meal_plans ?? []).map((m) => m.type);
      const hotelSinPlan = (hotel.meal_plans ?? []).length === 0;
      const matchesPlans =
        selectedPlans.length === 0 ||
        selectedPlans.some((p) =>
          p === 'sin_plan' ? hotelSinPlan : hotelPlanTypes.includes(p)
        );
      return matchesLocation && matchesStars && matchesAmenities && matchesBudget && petOk && matchesTravelStyles && matchesPlans;
    });
  }, [hotels, searchParams, selectedStars, selectedAmenities, selectedPlans, selectedPetFriendly, headerTravelStyles, nights, rooms]);

  // Total menor y mayor encontrado en los resultados (precio × noches × habitaciones + impuestos, sin aplicar filtro de precio)
  const priceBounds = useMemo(() => {
    if (hotelsWithoutPriceFilter.length === 0) return { min: 0, max: 2000 };
    const totals = hotelsWithoutPriceFilter.map(h => {
      const subtotal = h.price * nights * rooms;
      return Math.round(subtotal * (1 + TAX_RATE));
    });
    return { min: Math.min(...totals), max: Math.max(...totals) };
  }, [hotelsWithoutPriceFilter, nights, rooms]);

  // Al cargar resultados, colocar el rango de precio en el menor y mayor encontrado
  const hasInitializedPriceRange = React.useRef(false);
  useEffect(() => {
    if (!loading && hotels.length > 0 && !hasInitializedPriceRange.current) {
      setPriceRange([priceBounds.min, priceBounds.max]);
      hasInitializedPriceRange.current = true;
    }
  }, [loading, hotels.length, priceBounds.min, priceBounds.max]);

  // Filter Logic
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const dest = searchParams.destination.toLowerCase().trim();
      const stateCountry = [hotel.state, hotel.country].filter(Boolean).join(', ').toLowerCase();
      const matchesLocation = dest === '' ||
                              hotel.location.toLowerCase().includes(dest) ||
                              dest.includes(hotel.location.toLowerCase()) ||
                              (stateCountry && (stateCountry.includes(dest) || dest.includes(stateCountry)));
      
      const subtotal = hotel.price * nights * rooms;
      const totalWithTaxForFilter = Math.round(subtotal * (1 + TAX_RATE));
      const matchesPrice = totalWithTaxForFilter >= priceRange[0] && totalWithTaxForFilter <= priceRange[1];
      
      const matchesStars = selectedStars.length === 0 || selectedStars.includes(hotel.stars);
      
      const matchesAmenities = selectedAmenities.every(a => hotel.amenities.includes(a));

      // Presupuesto: total del viaje (precio × noches × habitaciones + impuestos) <= budgetMax
      const totalWithTax = totalWithTaxForFilter;
      const matchesBudget = searchParams.budgetMax <= 0 ? true : totalWithTax <= searchParams.budgetMax;

      const petOk = !selectedPetFriendly || hotel.pet_friendly === true || (() => {
        const a = (hotel.amenities || []).join(' ').toLowerCase();
        const t = (hotel.tags || []).join(' ').toLowerCase();
        return /pet|mascota|animal/.test(a) || /pet|mascota|animal/.test(t);
      })();

      const travelStyles = headerTravelStyles;
      const hotelStyles = hotel.travel_styles ?? [];
      const matchesTravelStyles = travelStyles.length === 0 || travelStyles.some(s => hotelStyles.includes(s));

      const hotelPlanTypes = (hotel.meal_plans ?? []).map((m) => m.type);
      const hotelSinPlan = (hotel.meal_plans ?? []).length === 0;
      const matchesPlans =
        selectedPlans.length === 0 ||
        selectedPlans.some((p) =>
          p === 'sin_plan' ? hotelSinPlan : hotelPlanTypes.includes(p)
        );

      return matchesLocation && matchesPrice && matchesStars && matchesAmenities && matchesBudget && petOk && matchesTravelStyles && matchesPlans;
    });
  }, [hotels, searchParams, priceRange, selectedStars, selectedAmenities, selectedPlans, selectedPetFriendly, headerTravelStyles, nights, rooms]);

  const sortedHotels = useMemo(() => {
    if (!priceSort) return filteredHotels;
    const copy = [...filteredHotels];
    copy.sort((a, b) => priceSort === 'mayor_precio' ? b.price - a.price : a.price - b.price);
    return copy;
  }, [filteredHotels, priceSort]);

  const toggleStar = (star: number) => {
    setSelectedStars(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);
  };

  const toggleAmenity = (slug: string) => {
    setSelectedAmenities(prev => prev.includes(slug) ? prev.filter(a => a !== slug) : [...prev, slug]);
  };

  const toggleAmenityCategory = (cat: string) => {
    setExpandedAmenityCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleHeaderTravelStyle = (style: string) => {
    setHeaderTravelStyles(prev =>
      prev.includes(style) ? [] : [style]
    );
  };

  const amenityByCategory = useMemo(() => {
    const map: Record<string, AmenityItem[]> = {};
    amenityCatalog.forEach((a) => {
      (map[a.category] ??= []).push(a);
    });
    Object.keys(map).forEach((cat) => map[cat].sort((a, b) => a.sort_order - b.sort_order));
    return map;
  }, [amenityCatalog]);
  const amenityCategories = useMemo(() => [...new Set(amenityCatalog.map((a) => a.category))].sort(), [amenityCatalog]);
  const amenityLabelBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    amenityCatalog.forEach((a) => { map[a.slug] = a.label; });
    return map;
  }, [amenityCatalog]);

  // Hoteles que coinciden con todos los filtros excepto amenidades (para contar por categoría)
  const hotelsWithoutAmenityFilter = useMemo(() => {
    return hotels.filter(hotel => {
      const dest = searchParams.destination.toLowerCase().trim();
      const stateCountry = [hotel.state, hotel.country].filter(Boolean).join(', ').toLowerCase();
      const matchesLocation = dest === '' || hotel.location.toLowerCase().includes(dest) || dest.includes(hotel.location.toLowerCase()) || (stateCountry && (stateCountry.includes(dest) || dest.includes(stateCountry)));
      const subtotal = hotel.price * nights * rooms;
      const totalWithTaxForFilter = Math.round(subtotal * (1 + TAX_RATE));
      const matchesPrice = totalWithTaxForFilter >= priceRange[0] && totalWithTaxForFilter <= priceRange[1];
      const matchesStars = selectedStars.length === 0 || selectedStars.includes(hotel.stars);
      const matchesBudget = searchParams.budgetMax <= 0 ? true : totalWithTaxForFilter <= searchParams.budgetMax;
      const petOk = !selectedPetFriendly || hotel.pet_friendly === true || (() => {
        const a = (hotel.amenities || []).join(' ').toLowerCase();
        const t = (hotel.tags || []).join(' ').toLowerCase();
        return /pet|mascota|animal/.test(a) || /pet|mascota|animal/.test(t);
      })();
      const travelStyles = headerTravelStyles;
      const hotelStyles = hotel.travel_styles ?? [];
      const matchesTravelStyles = travelStyles.length === 0 || travelStyles.some(s => hotelStyles.includes(s));
      const hotelPlanTypes = (hotel.meal_plans ?? []).map((m) => m.type);
      const hotelSinPlan = (hotel.meal_plans ?? []).length === 0;
      const matchesPlans = selectedPlans.length === 0 || selectedPlans.some((p) => p === 'sin_plan' ? hotelSinPlan : hotelPlanTypes.includes(p));
      return matchesLocation && matchesPrice && matchesStars && matchesBudget && petOk && matchesTravelStyles && matchesPlans;
    });
  }, [hotels, searchParams, priceRange, selectedStars, selectedPlans, selectedPetFriendly, headerTravelStyles, nights, rooms]);

  // Hoteles que cumplen el resto de filtros Y todas las amenidades ya seleccionadas (para que los números se actualicen al elegir)
  const hotelsForAmenityCounts = useMemo(() => {
    if (selectedAmenities.length === 0) return hotelsWithoutAmenityFilter;
    return hotelsWithoutAmenityFilter.filter((h) =>
      selectedAmenities.every((slug) => (h.amenities || []).includes(slug))
    );
  }, [hotelsWithoutAmenityFilter, selectedAmenities]);

  // Por categoría: cuántos hoteles del set actual tienen al menos una amenidad de esa categoría
  const amenityCategoryCount = useMemo(() => {
    const count: Record<string, number> = {};
    amenityCategories.forEach((cat) => {
      const slugsInCat = (amenityByCategory[cat] ?? []).map((a) => a.slug);
      count[cat] = hotelsForAmenityCounts.filter((h) => (h.amenities || []).some((slug) => slugsInCat.includes(slug))).length;
    });
    return count;
  }, [amenityCategories, amenityByCategory, hotelsForAmenityCounts]);

  // Por amenidad (slug): cuántos hoteles del set actual tienen esa amenidad
  const amenitySlugCount = useMemo(() => {
    const count: Record<string, number> = {};
    amenityCatalog.forEach((a) => {
      count[a.slug] = hotelsForAmenityCounts.filter((h) => (h.amenities || []).includes(a.slug)).length;
    });
    return count;
  }, [amenityCatalog, hotelsForAmenityCounts]);

  const togglePlan = (planValue: string) => {
    setSelectedPlans(prev => prev.includes(planValue) ? prev.filter(p => p !== planValue) : [...prev, planValue]);
  };

  const totalGuests = searchParams.guests.adults + searchParams.guests.children;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex-1">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 text-sm text-[#617289] mb-4">
          <button onClick={onBack} className="hover:text-primary transition-colors">Inicio</button>
          <span>/</span>
          <span className="text-[#111418] dark:text-white font-medium">Resultados</span>
        </div>
        
        <div className="relative overflow-hidden rounded-xl h-[200px] md:h-[280px] w-full bg-cover bg-center" style={{backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 60%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCtSo5CfGdhGbw1LvYeuSAyuyyn7zv5qS_IkCRois1g5Zt15kiTNTeuwFlJp3ud66BodD4TUPPjZ89j3bvSiGJkgBbexpwoLw8U01v-s37QcrTtcjFbLip6i7-n2iV8wko3FZccj2WMaeBSNZ5HpvdCO2_CSqsMCvr3YGikdla8D0z90D0P5REGQPRSNWYfaaUEkj7i7yt5o7dPYIk7rZee7rtRwU-4OE-mPaUVVKCberh3_Mkueujj1JX9268KUpu4-ZDJDrLK5g")'}}>
          <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-12">
            <h1 className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {searchParams.destination?.trim() ? `Hoteles en ${searchParams.destination}` : 'Hoteles para tu presupuesto'}
            </h1>
            <p className="text-white/90 text-base md:text-lg font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span> {searchParams.checkIn} - {searchParams.checkOut} • {totalGuests} Huéspedes ({searchParams.guests.rooms} Hab.)
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-[300px] flex-none space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-[#1a2634] p-6 rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg dark:text-white">Filtros</h3>
                <button className="text-xs font-semibold text-primary hover:underline" onClick={() => { setPriceRange([priceBounds.min, priceBounds.max]); setSelectedStars([]); setSelectedAmenities([]); setSelectedPlans([]); setSelectedPetFriendly(searchParams.petFriendly ?? false); }}>Limpiar todo</button>
              </div>

              {/* Price Filter: totales mínimo y máximo del viaje (precio × noches × habitaciones + impuestos) */}
              <div className="mb-8">
                <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold mb-4">Rango de Precio (Total del viaje)</p>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#617289] dark:text-gray-400 uppercase font-bold mb-1 block">Total Mín</label>
                    <input className="w-full px-2 py-2 border border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-800 rounded text-sm" type="text" inputMode="numeric" value={formatPrice(priceRange[0])} onChange={(e) => { const v = parsePriceInput(e.target.value); if (!Number.isNaN(v)) setPriceRange([Math.max(priceBounds.min, Math.min(v, priceRange[1])), priceRange[1]]); }}/>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-[#617289] dark:text-gray-400 uppercase font-bold mb-1 block">Total Máx</label>
                    <input className="w-full px-2 py-2 border border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-800 rounded text-sm" type="text" inputMode="numeric" value={formatPrice(priceRange[1])} onChange={(e) => { const v = parsePriceInput(e.target.value); if (!Number.isNaN(v)) setPriceRange([priceRange[0], Math.min(priceBounds.max, Math.max(v, priceRange[0]))]); }}/>
                  </div>
                </div>
                <input 
                  type="range" 
                  min={priceBounds.min} 
                  max={priceBounds.max} 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <hr className="border-[#f0f2f4] dark:border-gray-700 my-6"/>

              {/* Category Filter */}
              <div className="mb-8">
                <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold mb-4">Categoría</p>
                {[5, 4, 3].map(stars => (
                  <label key={stars} className="flex items-center gap-3 cursor-pointer group mb-2">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#dbe0e6] text-primary focus:ring-primary/20 dark:bg-gray-700 dark:border-gray-600 size-5"
                      checked={selectedStars.includes(stars)}
                      onChange={() => toggleStar(stars)}
                    />
                    <div className="flex text-yellow-400 text-[18px]">
                      {Array.from({length: stars}).map((_, i) => (
                        <span key={i} className="material-symbols-outlined filled" style={{fontSize: '18px'}}>star</span>
                      ))}
                    </div>
                  </label>
                ))}
              </div>

              <hr className="border-[#f0f2f4] dark:border-gray-700 my-6"/>

              {/* Plans Filter */}
              <div className="mb-8">
                <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold mb-4">Planes</p>
                {PLAN_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      className="rounded border-[#dbe0e6] text-primary focus:ring-primary/20 dark:bg-gray-700 dark:border-gray-600 size-5"
                      checked={selectedPlans.includes(value)}
                      onChange={() => togglePlan(value)}
                    />
                    <span className="text-sm text-[#111418] dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>

              <hr className="border-[#f0f2f4] dark:border-gray-700 my-6"/>

              {/* Pet Friendly Filter */}
              <div className="mb-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-[#dbe0e6] text-primary focus:ring-primary/20 dark:bg-gray-700 dark:border-gray-600 size-5"
                    checked={selectedPetFriendly}
                    onChange={(e) => setSelectedPetFriendly(e.target.checked)}
                  />
                  <span className="flex items-center gap-2 text-sm text-[#111418] dark:text-gray-300">
                    <span className="material-symbols-outlined text-[18px]">pets</span>
                    Pet friendly
                  </span>
                </label>
              </div>

              <hr className="border-[#f0f2f4] dark:border-gray-700 my-6"/>

              {/* Amenities Filter - catálogo agrupado por categoría */}
              <div className="mb-8">
                <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold mb-3">Amenidades</p>
                <p className="text-xs text-[#617289] dark:text-gray-400 mb-4">Marca las que quieras en tu hotel.</p>
                {amenityCatalog.length === 0 ? (
                  <p className="text-xs text-[#617289] dark:text-gray-400">Cargando opciones...</p>
                ) : (
                  <div className="space-y-5">
                    {amenityCategories.map((cat) => {
                      const isExpanded = expandedAmenityCategories.has(cat);
                      return (
                      <div key={cat}>
                        <button
                          type="button"
                          onClick={() => toggleAmenityCategory(cat)}
                          className="flex items-center gap-2 w-full text-left text-[10px] font-bold text-black dark:text-gray-200 uppercase tracking-wider mb-2 hover:opacity-80 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[14px] transition-transform" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                            expand_more
                          </span>
                          {AMENITY_CATEGORY_LABELS[cat] ?? cat} <span className="font-extrabold">({amenityCategoryCount[cat] ?? 0})</span>
                        </button>
                        {isExpanded && (
                        <div className="space-y-1.5">
                          {(amenityByCategory[cat] ?? []).map((a) => (
                            <label key={a.slug} className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                className="rounded border-[#dbe0e6] text-primary focus:ring-primary/20 dark:bg-gray-700 dark:border-gray-600 size-4 flex-shrink-0"
                                checked={selectedAmenities.includes(a.slug)}
                                onChange={() => toggleAmenity(a.slug)}
                              />
                              <span className="text-sm text-[#111418] dark:text-gray-300 group-hover:text-primary transition-colors">
                                {a.label} <span className="text-primary font-medium">({amenitySlugCount[a.slug] ?? 0})</span>
                              </span>
                            </label>
                          ))}
                        </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Results List */}
        <div className="flex-1">
          <div className="mb-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h2 className="text-[#111418] dark:text-white text-2xl font-bold leading-tight">{filteredHotels.length} Hoteles encontrados</h2>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#617289] dark:text-gray-400 uppercase tracking-wider">Estilos de viaje:</span>
                {TRAVEL_STYLE_OPTIONS.map((style) => {
                  const isSelected = headerTravelStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleHeaderTravelStyle(style)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-white border border-primary'
                          : 'bg-white dark:bg-[#1a2634] border border-[#e5e7eb] dark:border-gray-700 text-[#111418] dark:text-gray-300 hover:border-primary dark:hover:border-primary'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <label htmlFor="price-sort" className="text-xs font-semibold text-[#617289] dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Ordenar:</label>
                <select
                  id="price-sort"
                  value={priceSort}
                  onChange={(e) => setPriceSort((e.target.value as 'mayor_precio' | 'menor_precio' | '') || '')}
                  className="rounded-lg border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-[#1a2634] text-sm font-medium text-[#111418] dark:text-gray-200 px-3 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Sin orden</option>
                  <option value="mayor_precio">Mayor precio</option>
                  <option value="menor_precio">Menor precio</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
                <div className="text-center py-20">Cargando hoteles...</div>
            ) : sortedHotels.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1a2634] rounded-xl border border-[#f0f2f4] dark:border-gray-800">No se encontraron hoteles con estos filtros.</div>
            ) : (
                sortedHotels.map(hotel => {
                  const subtotal = hotel.price * nights * (searchParams.guests.rooms || 1);
                  const taxes = Math.round(subtotal * TAX_RATE);
                  const total = subtotal + taxes;
                  const cityLabel = hotel.state && hotel.country ? [hotel.state, hotel.country].filter(Boolean).join(', ') : hotel.location;
                  const features: string[] = [];
                  if (hotel.pet_friendly) features.push('El hotel acepta mascotas.');
                  if (hotel.amenities?.length) features.push(amenityLabelBySlug[hotel.amenities[0]] ?? hotel.amenities[0]);
                  if (!features.length) features.push('Alto estándar de limpieza');

                  return (
                    <div
                      key={hotel.id}
                      className={`group bg-white dark:bg-[#1a2634] rounded-xl overflow-hidden border border-[#e5e7eb] dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row ${hotel.isSoldOut ? 'opacity-75' : ''}`}
                    >
                      {/* Imagen: una sola, animación zoom al hover */}
                      <div className="relative w-full sm:w-[42%] min-h-[220px] sm:min-h-[240px] flex-shrink-0 overflow-hidden">
                        {hotel.isSoldOut && (
                          <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center">
                            <span className="bg-black/80 text-white px-4 py-1.5 rounded-lg text-sm font-bold">Agotado</span>
                          </div>
                        )}
                        <div className="h-full w-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110" style={{ backgroundImage: `url("${hotel.image}")` }} />
                      </div>

                      {/* Datos del hotel: ubicación, nombre, estrellas, características */}
                      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="text-sm text-[#617289] dark:text-gray-400 mb-0.5">{cityLabel}</p>
                          <h3 className="text-lg sm:text-xl font-bold text-[#111418] dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">{hotel.name}</h3>
                          <div className="flex text-yellow-400 text-[16px] mb-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`material-symbols-outlined ${i < hotel.stars ? 'filled' : ''}`} style={{ fontSize: '16px' }}>star</span>
                            ))}
                          </div>
                          <ul className="space-y-1">
                            {features.slice(0, 2).map((text, i) => (
                              text ? (
                                <li key={i} className="flex items-center gap-2 text-sm text-[#111418] dark:text-gray-300">
                                  <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-[18px] flex-shrink-0">check_circle</span>
                                  <span className="truncate">{text}</span>
                                </li>
                              ) : null
                            ))}
                          </ul>
                        </div>
                        <button
                          disabled={hotel.isSoldOut}
                          onClick={() => onSelectHotel(hotel)}
                          className={`mt-4 self-start px-4 py-2 text-sm font-bold rounded-lg transition-colors ${hotel.isSoldOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-600'}`}
                        >
                          Ver detalles
                        </button>
                      </div>

                      {/* Precio: habitación por noche, impuestos, total */}
                      <div className="w-full sm:w-[220px] flex-shrink-0 p-4 sm:p-5 border-t sm:border-t-0 sm:border-l border-[#e5e7eb] dark:border-gray-800 flex flex-col justify-center">
                        <p className="text-xs text-[#617289] dark:text-gray-400 mb-2">Habitación por noche</p>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl sm:text-3xl font-bold text-[#111418] dark:text-white">${hotel.price.toLocaleString('es-MX')}</span>
                          <span className="text-sm text-[#617289] dark:text-gray-400">MXN</span>
                        </div>
                        <p className="text-xs text-[#617289] dark:text-gray-400 mb-2">+ ${taxes.toLocaleString('es-MX')} de impuestos</p>
                        <p className="text-sm font-bold text-[#111418] dark:text-white pt-2 border-t border-[#f0f2f4] dark:border-gray-700">
                          Total ${total.toLocaleString('es-MX')} MXN
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;