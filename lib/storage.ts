import { PersonalItem, TripDetails, PackListCategory, SavedTrip, TimelineStep } from './types';

const KEYS = {
  personalItems: 'packvision_personal_items',
  tripDetails: 'packvision_trip_details',
  packList: 'packvision_pack_list',
  savedTrips: 'packvision_saved_trips',
  timelineSteps: 'packvision_timeline_steps',
  travelerNames: 'packvision_traveler_names',
} as const;

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

export function getPersonalItems(): PersonalItem[] {
  return getItem<PersonalItem[]>(KEYS.personalItems) || [];
}

export function savePersonalItems(items: PersonalItem[]): void {
  setItem(KEYS.personalItems, items);
}

export function getTripDetails(): TripDetails | null {
  const trip = getItem<TripDetails>(KEYS.tripDetails);
  if (trip) {
    if (!trip.laundry) {
      trip.laundry = { available: false, frequency: 0 };
    }
    if (trip.showVaccinations === undefined) {
      trip.showVaccinations = false;
    }
  }
  return trip;
}

export function saveTripDetails(trip: TripDetails): void {
  setItem(KEYS.tripDetails, trip);
}

export function getPackList(): PackListCategory[] | null {
  return getItem<PackListCategory[]>(KEYS.packList);
}

export function savePackList(list: PackListCategory[]): void {
  setItem(KEYS.packList, list);
}

// Saved trips (templates)
export function getSavedTrips(): SavedTrip[] {
  return getItem<SavedTrip[]>(KEYS.savedTrips) || [];
}

export function saveSavedTrips(trips: SavedTrip[]): void {
  setItem(KEYS.savedTrips, trips);
}

export function addSavedTrip(trip: TripDetails, packList: PackListCategory[]): SavedTrip {
  const saved: SavedTrip = {
    id: `trip-${Date.now()}`,
    savedAt: new Date().toISOString(),
    trip,
    packList,
  };
  const existing = getSavedTrips();
  // Max 10 opgeslagen reizen
  const updated = [saved, ...existing].slice(0, 10);
  saveSavedTrips(updated);
  return saved;
}

export function removeSavedTrip(id: string): void {
  const existing = getSavedTrips();
  saveSavedTrips(existing.filter(t => t.id !== id));
}

// Timeline steps
export function getTimelineSteps(): TimelineStep[] {
  return getItem<TimelineStep[]>(KEYS.timelineSteps) || [];
}

export function saveTimelineSteps(steps: TimelineStep[]): void {
  setItem(KEYS.timelineSteps, steps);
}

// Traveler names
export function getTravelerNames(): string[] {
  return getItem<string[]>(KEYS.travelerNames) || [];
}

export function saveTravelerNames(names: string[]): void {
  setItem(KEYS.travelerNames, names);
}
