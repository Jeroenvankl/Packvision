export type TripType = 'vacation' | 'business' | 'backpacking' | 'citytrip';

export interface LaundryOption {
  available: boolean;
  frequency: number; // keer tijdens de reis (0 = niet beschikbaar)
}

export interface TripDetails {
  destination: string;
  country: string;
  departureDate: string;
  returnDate: string;
  tripType: TripType;
  travelers: number;
  laundry: LaundryOption;
  showVaccinations: boolean;
}

export interface VaccinationInfo {
  required: VaccinationItem[];
  recommended: VaccinationItem[];
  note: string;
}

export interface VaccinationItem {
  name: string;
  description: string;
  required: boolean;
}

export interface WeatherData {
  current: {
    temp: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: WeatherDay[];
  location: string;
}

export interface WeatherDay {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  rain: number;
}

export interface PackListCategory {
  name: string;
  icon: string;
  items: PackListItem[];
}

export interface PackListItem {
  id: string;
  name: string;
  quantity: number;
  checked: boolean;
  essential: boolean;
  note?: string;
}

export interface PersonalItem {
  id: string;
  name: string;
  category: PersonalItemCategory;
  alwaysBring: boolean;
}

export type PersonalItemCategory = 'tech' | 'medicine' | 'sport' | 'work' | 'other';

export interface ScanResult {
  recognizedItems: string[];
  missingItems: string[];
  warnings: string[];
  tips: string[];
  summary: string;
}

export interface SavedTrip {
  id: string;
  savedAt: string;
  trip: TripDetails;
  packList: PackListCategory[];
}

export interface TravelerProfile {
  id: string;
  name: string;
}

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  daysBeforeDeparture: number;
  completed: boolean;
}

export const PERSONAL_ITEM_CATEGORIES: Record<PersonalItemCategory, { label: string; icon: string }> = {
  tech: { label: 'Tech & Elektronica', icon: '💻' },
  medicine: { label: 'Medicijnen', icon: '💊' },
  sport: { label: 'Sport & Outdoor', icon: '⚽' },
  work: { label: 'Werk', icon: '💼' },
  other: { label: 'Overig', icon: '📦' },
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  vacation: 'Vakantie',
  business: 'Zakelijk',
  backpacking: 'Backpacken',
  citytrip: 'Stedentrip',
};

export const ITEM_SUGGESTIONS: Record<PersonalItemCategory, string[]> = {
  tech: [
    'Wereldstekker/reisadapter',
    'Powerbank',
    'Koptelefoon',
    'Laptop',
    'Laptop oplader',
    'Telefoon oplader',
    'USB-C kabel',
    'Lightning kabel',
    'E-reader',
    'Camera',
    'SD-kaart',
    'Draadloze oordopjes',
  ],
  medicine: [
    'Paracetamol',
    'Ibuprofen',
    'Anti-diarree tabletten',
    'Pleisters',
    'Zonnebrandcrème',
    'DEET muggenspray',
    'Reisziekte tabletten',
    'Persoonlijke medicatie',
    'Vitamines',
  ],
  sport: [
    'Sportschoenen',
    'Zwembroek/badpak',
    'Handdoek (microvezel)',
    'Yoga mat',
    'Weerstand banden',
    'Duikbril & snorkel',
    'Wandelschoenen',
  ],
  work: [
    'Laptop',
    'Notitieboek',
    'Pennen',
    'Visitekaartjes',
    'Presentatie clicker',
    'HDMI-adapter',
  ],
  other: [
    'Nekkussen',
    'Slaapmasker',
    'Oordopjes (slapen)',
    'Waslijntje',
    'Ritssluiting zakjes',
    'Dagboek',
  ],
};
