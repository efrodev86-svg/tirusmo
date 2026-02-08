import { Hotel } from '../types';

// En un entorno real, esto vendría de una variable de entorno, ej: process.env.REACT_APP_API_URL
// Para pruebas locales con json-server, suele ser http://localhost:3000
const API_URL = 'http://localhost:3000'; 

export const DESTINATIONS = [
  "Cancún, México",
  "Riviera Maya, México",
  "Playa del Carmen, México",
  "Tulum, México",
  "Puerto Vallarta, México",
  "Los Cabos, México",
  "Ciudad de México, México",
  "San Miguel de Allende, México",
  "Valle de Bravo, México",
  "Tepoztlán, México"
];

// Datos Mock (Respaldo si falla la API)
const HOTELS_DB: Hotel[] = [
  {
    id: 1,
    name: "Grand Velas Riviera Maya",
    location: "Playa del Carmen, México",
    price: 520,
    rating: 4.9,
    reviews: 128,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBc4K7ALyX5G1tojuk5dEQjbSS9MSTiovIzYT1vafFavzhwGgpgreU89k647UHlo_TjMaQgz3br_EzdibMovRNhHPz6XJPJsPbeJMJ3FzYQQwv5aD3OTlIa_Uetcm_fvoZxlF7hYwX1zwghivRptQ6XdX18F0Tky1oThbnfMnvm6mDrNtOKAiSRcHnD40wjeOBuztPBq6MpaggQT22PwZglSUb1Gh9HF-fR2C7lRTqj0at22OH2TnaHFnkP4f2aQ38Ta_UNlebLcg",
    amenities: ["Spa", "Pool", "Gym", "WiFi", "All-Inclusive"],
    stars: 5,
    description: "Un resort de lujo todo incluido en la selva maya con playa privada y spa de clase mundial.",
    tags: ["Wellness Choice", "Luxury"]
  },
  {
    id: 2,
    name: "Banyan Tree Mayakoba",
    location: "Riviera Maya, México",
    price: 890,
    rating: 4.8,
    reviews: 96,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBsCwkcVjRauIgEpZHFubB3cJaHLFqj0UtWF-OVJrSg5tUuo8BzEclBMQVbtfEfjzdQ4J3Tr9hYVUBbNE9KM1L9PUphHrAeUPGuLwRbIZ5G2I5KWeLeWYUPZ2G5UDdN15sR75NJIaT4yNEhSzdNXgRAyaygD6PP2CGmkaezwm0LCk5RYJRwtvQ6mZQpPkNn4wKAcV2TIRcfZOw2arv3Vgvfl-jk0UIGCOd48vV9ntCAqm8n8TIGLiD1Z0bIyQZsEPD5YsNgpuOBOQ",
    amenities: ["Private Pool", "Asian Spa", "Golf", "Villas"],
    stars: 5,
    description: "Santuario para los sentidos, villas privadas con piscina inmersas en la naturaleza.",
    tags: ["Villas", "Asian Spa"]
  },
  {
    id: 3,
    name: "Serenity Ocean Spa & Resort",
    location: "Cancún, México",
    price: 300,
    rating: 4.5,
    reviews: 210,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaTZMxchstx0L1v_aEkeUwnVSMwNgF8A77ZR1MFi2nxsphQ2h_kFyvA2K6vJ5hZq0XbHLibO1JTVpksYsugl7pMDaM5qC5oEni3O3PEoPbAyax72dF9QFjJtmrS7wUTmh9Wzhpav0ZjNf7Wgq0w9xXc5QhG3fEsUIEqppH11_kKg5DMciq8brh3luA8ggLBZ2q9DjwFzDYTTC_lCL4OMjppHCBg672e76gi129PNH27RNNrBxvhert9uC_RigV8ZL5dZtbnQoraA",
    amenities: ["Ocean View", "Hydrotherapy", "Gym", "WiFi"],
    stars: 4,
    description: "Relájate con vistas al mar Caribe y disfruta de tratamientos de hidroterapia exclusivos.",
    tags: ["Popular"]
  },
  {
    id: 4,
    name: "Le Blanc Spa Resort",
    location: "Cancún, Zona Hotelera",
    price: 620,
    rating: 4.9,
    reviews: 350,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP3pLgh2y6TTH9MWzXMUWpr3UsqYEa5HnrYpKUF4HoNHzCaq1N-mtHns-GaRnq5zh0_UgKocBzYaXzlhuBF0Vi6jD-gwqlGyqZa70fwyGeU6rBVSfz-EY_yJBZx-yAbI15V8nhp_8ksTQaXq9pSuK5IH9McYauZMvLBnsG-IdH4dr8kKdBJWBiazXque5PAKY-_fYwVBe3pyX3XtZ_ka1dI0_cDMKVYRGCyYMyBEABqDM9wBM805itA_UYUhzJIk-jmBwEdal38Q",
    amenities: ["Adults Only", "Butler Service", "Fine Dining", "Spa"],
    stars: 5,
    description: "La joya de la corona de los resorts todo incluido solo para adultos.",
    tags: ["Adults Only", "Wellness"]
  },
  {
    id: 5,
    name: "Secrets Moxché",
    location: "Playa del Carmen, México",
    price: 750,
    rating: 4.7,
    reviews: 80,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB12ApDCDssF31xrAOmTfbYtwIYGhdgr-LEaYNfU9NE41mw8GNICk2OxnCsa7fH4aexTef9FGD7gOJ6WDzm0-hdJlvHLesqv5-ewjyKYh4U24yFLb_TrYSu_xzgJerWET7WLDYtmffChnJXUDlRNd0uLtN3pCGpk6N6unhxWoO45AOCwsBSkoVZxIucK_5h9Qq5A2IvFlMyOuqpJaVSlqwFj5vfJB6mriZrTlg7EKusBkhAaJsiMGnBCkkP6hurJchfYOoFUPMiJA",
    amenities: ["Seven Pools", "Cenote-style", "Luxury", "WiFi"],
    stars: 5,
    description: "Una experiencia sublime con diseño inspirado en la naturaleza y piscinas tipo cenote.",
    tags: ["Sold Out"],
    isSoldOut: true
  },
  {
    id: 6,
    name: "Rosewood San Miguel",
    location: "San Miguel de Allende, México",
    price: 550,
    rating: 4.8,
    reviews: 150,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgK0-WHR7mnZqm7w-IrQIWw7FqkQ2wQZ1yfJdqJoiazuikCRpoy13AXxYI1aZQSwWhG4AiXNz2BffqeOHrmKcbnw05gkY101Xv6scX6ftMWkzX4ZdbNEEjWx4T-wXtCvWLZsNz_qBKVQZ6gaQaBi98xXXlcUctxFMkRymcoZJdGyW_KCkF118PmneRr9nmxlk3XCSvAZ_w_kHdBgA-q7alfd3eXepGSa17bD4GTPrxuwD7nv0FuMoFWeFXmAyq6EESmREIQSPrlg",
    amenities: ["Colonial Style", "Rooftop Bar", "Spa", "Pool"],
    stars: 5,
    description: "Elegancia colonial en el corazón de San Miguel de Allende.",
    tags: ["Heritage"]
  }
];

// Obtener todos los hoteles (Soporta API real)
export const getHotels = async (): Promise<Hotel[]> => {
  try {
    // Intentamos conectar a la API real
    const response = await fetch(`${API_URL}/hotels`);
    
    if (!response.ok) {
      throw new Error('Error en la respuesta de la API');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("API no disponible o error de conexión. Usando datos Mock.", error);
    // Fallback a datos simulados para que la demo no se rompa
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HOTELS_DB);
      }, 500);
    });
  }
};

// Obtener hotel por ID
export const getHotelById = (id: number): Hotel | undefined => {
  // Nota: En una app de producción real, esto debería ser asíncrono (async/await)
  // y consultar a la API: await fetch(`${API_URL}/hotels/${id}`)
  // Por ahora, buscamos en el array local para mantener compatibilidad con el resto de la app síncrona.
  return HOTELS_DB.find(h => h.id === id);
};

// Función para simular envío de reserva a una API
export const submitReservation = async (reservationData: any): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData),
        });
        return response.ok;
    } catch (error) {
        console.warn("No se pudo enviar a la API real. Simulando éxito.");
        return new Promise(resolve => setTimeout(() => resolve(true), 1000));
    }
}
