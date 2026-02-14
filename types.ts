export interface Hotel {
  id: number;
  name: string;
  location: string;
  state?: string | null;
  country?: string | null;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  stars: number;
  description: string;
  tags: string[];
  isSoldOut?: boolean;
  pet_friendly?: boolean;
  travel_styles?: string[];
}

export interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  budgetMin: number;
  budgetMax: number;
  petFriendly?: boolean;
  travelStyles?: string[];
}

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
}

export enum BookingStep {
  SELECTION = 1,
  DETAILS = 2,
  PAYMENT = 3,
  CONFIRMATION = 4
}

export enum ViewState {
  HOME = 'HOME',
  RESULTS = 'RESULTS',
  BOOKING = 'BOOKING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  PARTNER_DASHBOARD = 'PARTNER_DASHBOARD',
  CUSTOMER_DASHBOARD = 'CUSTOMER_DASHBOARD',
  ABOUT_US = 'ABOUT_US',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS'
}