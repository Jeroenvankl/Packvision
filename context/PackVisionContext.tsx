'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TripDetails,
  WeatherData,
  PackListCategory,
  PersonalItem,
} from '@/lib/types';
import {
  getPersonalItems,
  savePersonalItems,
  getTripDetails,
  saveTripDetails,
  getPackList,
  savePackList,
} from '@/lib/storage';

interface PackVisionState {
  trip: TripDetails | null;
  weather: WeatherData | null;
  packList: PackListCategory[] | null;
  personalItems: PersonalItem[];
  setTrip: (trip: TripDetails) => void;
  setWeather: (weather: WeatherData) => void;
  setPackList: (list: PackListCategory[]) => void;
  toggleItem: (categoryIndex: number, itemId: string) => void;
  addPersonalItem: (item: PersonalItem) => void;
  removePersonalItem: (id: string) => void;
  updatePersonalItem: (item: PersonalItem) => void;
  addPackListItem: (categoryIndex: number, name: string, quantity: number) => void;
  removePackListItem: (categoryIndex: number, itemId: string) => void;
}

const PackVisionContext = createContext<PackVisionState | null>(null);

export function PackVisionProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTripState] = useState<TripDetails | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [packList, setPackListState] = useState<PackListCategory[] | null>(null);
  const [personalItems, setPersonalItemsState] = useState<PersonalItem[]>([]);

  useEffect(() => {
    setTripState(getTripDetails());
    setPackListState(getPackList());
    setPersonalItemsState(getPersonalItems());
  }, []);

  const setTrip = useCallback((t: TripDetails) => {
    setTripState(t);
    saveTripDetails(t);
  }, []);

  const setPackList = useCallback((list: PackListCategory[]) => {
    setPackListState(list);
    savePackList(list);
  }, []);

  const toggleItem = useCallback((categoryIndex: number, itemId: string) => {
    setPackListState((prev) => {
      if (!prev) return prev;
      const updated = prev.map((cat, i) => {
        if (i !== categoryIndex) return cat;
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      });
      savePackList(updated);
      return updated;
    });
  }, []);

  const addPersonalItem = useCallback((item: PersonalItem) => {
    setPersonalItemsState((prev) => {
      const updated = [...prev, item];
      savePersonalItems(updated);
      return updated;
    });
  }, []);

  const removePersonalItem = useCallback((id: string) => {
    setPersonalItemsState((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      savePersonalItems(updated);
      return updated;
    });
  }, []);

  const updatePersonalItem = useCallback((item: PersonalItem) => {
    setPersonalItemsState((prev) => {
      const updated = prev.map((i) => (i.id === item.id ? item : i));
      savePersonalItems(updated);
      return updated;
    });
  }, []);

  const addPackListItem = useCallback((categoryIndex: number, name: string, quantity: number) => {
    setPackListState((prev) => {
      if (!prev) return prev;
      const newItem = {
        id: `custom-${Date.now()}`,
        name: name,
        quantity: quantity,
        checked: false,
        essential: false,
        note: 'Handmatig toegevoegd',
      };
      const updated = prev.map((cat, i) => {
        if (i !== categoryIndex) return cat;
        return {
          ...cat,
          items: [...cat.items, newItem],
        };
      });
      savePackList(updated);
      return updated;
    });
  }, []);

  const removePackListItem = useCallback((categoryIndex: number, itemId: string) => {
    setPackListState((prev) => {
      if (!prev) return prev;
      const updated = prev.map((cat, i) => {
        if (i !== categoryIndex) return cat;
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== itemId),
        };
      });
      savePackList(updated);
      return updated;
    });
  }, []);

  return (
    <PackVisionContext.Provider
      value={{
        trip,
        weather,
        packList,
        personalItems,
        setTrip,
        setWeather,
        setPackList,
        toggleItem,
        addPersonalItem,
        removePersonalItem,
        updatePersonalItem,
        addPackListItem,
        removePackListItem,
      }}
    >
      {children}
    </PackVisionContext.Provider>
  );
}

export function usePackVision() {
  const context = useContext(PackVisionContext);
  if (!context) {
    throw new Error('usePackVision must be used within a PackVisionProvider');
  }
  return context;
}
