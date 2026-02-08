import React, { useState, useEffect, useMemo } from 'react';
import { SearchParams, Hotel } from '../types';
import { getHotels } from '../services/hotelService';

interface SearchResultsProps {
  searchParams: SearchParams;
  onSelectHotel: (hotelId: number) => void;
  onBack: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchParams, onSelectHotel, onBack }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [priceRange, setPriceRange] = useState<[number, number]>([100, 1500]);
  const [selectedStars, setSelectedStars] = useState<number[]>([4, 5]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    // Simulate fetching "real" data from DB
    getHotels().then(data => {
      setHotels(data);
      setLoading(false);
    });
  }, []);

  // Filter Logic
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const matchesLocation = hotel.location.toLowerCase().includes(searchParams.destination.toLowerCase()) || 
                              searchParams.destination.toLowerCase().includes(hotel.location.toLowerCase()) ||
                              searchParams.destination === ""; // If empty, show all (or could filter nothing)
      
      const matchesPrice = hotel.price >= priceRange[0] && hotel.price <= priceRange[1];
      
      const matchesStars = selectedStars.length === 0 || selectedStars.includes(hotel.stars);
      
      const matchesAmenities = selectedAmenities.every(a => hotel.amenities.includes(a));

      // Budget check from initial search
      const matchesBudget = searchParams.budgetMax > 0 ? hotel.price <= searchParams.budgetMax : true;

      return (matchesLocation || true) && matchesPrice && matchesStars && matchesAmenities && matchesBudget; 
      // Note: "matchesLocation || true" is a hack for this demo because mock data locations might not perfectly match the autocomplete strings exactly. 
      // In a real app, IDs would be used. For now, we trust the filter logic but fallback to show items if location is fuzzy.
    });
  }, [hotels, searchParams, priceRange, selectedStars, selectedAmenities]);

  const toggleStar = (star: number) => {
    setSelectedStars(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
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
            <h1 className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-4">Hoteles en {searchParams.destination || "México"}</h1>
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
                <button className="text-xs font-semibold text-primary hover:underline" onClick={() => { setPriceRange([0, 2000]); setSelectedStars([]); setSelectedAmenities([]); }}>Limpiar todo</button>
              </div>

              {/* Price Filter */}
              <div className="mb-8">
                <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold mb-4">Rango de Precio</p>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#617289] dark:text-gray-400 uppercase font-bold mb-1 block">Min</label>
                    <input className="w-full px-2 py-2 border border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-800 rounded text-sm" type="number" value={priceRange[0]} onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}/>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-[#617289] dark:text-gray-400 uppercase font-bold mb-1 block">Max</label>
                    <input className="w-full px-2 py-2 border border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-800 rounded text-sm" type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}/>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="0" max="2000" 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
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

              {/* Amenities Filter */}
              <div className="mb-8">
                <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold mb-4">Amenidades</p>
                {["Spa", "Pool", "WiFi", "Gym", "All-Inclusive"].map(amenity => (
                  <label key={amenity} className="flex items-center gap-3 cursor-pointer mb-2">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#dbe0e6] text-primary focus:ring-primary/20 dark:bg-gray-700 dark:border-gray-600 size-5"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    <span className="text-sm text-[#111418] dark:text-gray-300">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results List */}
        <div className="flex-1">
          <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h2 className="text-[#111418] dark:text-white text-2xl font-bold leading-tight">{filteredHotels.length} Hoteles encontrados</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
                <div className="col-span-full text-center py-20">Cargando hoteles...</div>
            ) : filteredHotels.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-xl">No se encontraron hoteles con estos filtros.</div>
            ) : (
                filteredHotels.map(hotel => (
                  <div key={hotel.id} className="group bg-white dark:bg-[#1a2634] rounded-2xl overflow-hidden border border-[#f0f2f4] dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                    <div className="relative h-56 overflow-hidden">
                      {hotel.tags.includes('Wellness Choice') && (
                        <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-black/80 backdrop-blur-sm text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider text-[#111418] dark:text-white flex items-center gap-1.5 border border-[#f0f2f4]/20">
                            <span className="material-symbols-outlined text-[14px] text-primary filled">spa</span> Wellness Choice
                        </div>
                      )}
                      {hotel.isSoldOut && (
                         <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center">
                            <span className="bg-black/80 text-white px-5 py-1.5 rounded-lg text-sm font-bold border border-white/20 shadow-lg">Agotado</span>
                         </div>
                      )}
                      <div className="h-full w-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700" style={{backgroundImage: `url("${hotel.image}")`}}></div>
                    </div>
                    
                    <div className={`p-5 flex flex-col flex-1 ${hotel.isSoldOut ? 'opacity-60' : ''}`}>
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-[#111418] dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">{hotel.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-[#617289]">
                            <span className="material-symbols-outlined text-[16px]">location_on</span> {hotel.location}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-5">
                        <div className="flex text-yellow-400 text-[16px]">
                             {Array.from({length: 5}).map((_, i) => (
                                <span key={i} className={`material-symbols-outlined ${i < hotel.stars ? 'filled' : ''}`} style={{fontSize: '16px'}}>star</span>
                             ))}
                        </div>
                        <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded-md border border-green-100">{hotel.rating} Exc</span>
                      </div>

                      <div className="mt-auto pt-5 border-t border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-[#111418] dark:text-white">${hotel.price}</span>
                                <span className="text-xs font-medium text-[#617289]">/noche</span>
                            </div>
                        </div>
                        <button 
                            disabled={hotel.isSoldOut}
                            onClick={() => onSelectHotel(hotel.id)}
                            className={`px-5 py-2.5 border-2 text-sm font-bold rounded-xl transition-all shadow-sm ${hotel.isSoldOut ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-primary text-primary hover:bg-primary hover:text-white'}`}
                        >
                            {hotel.isSoldOut ? 'No disponible' : 'Ver Detalles'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;