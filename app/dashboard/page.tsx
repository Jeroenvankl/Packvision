'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePackVision } from '@/context/PackVisionContext';
import { TimelineStep, SavedTrip, TRIP_TYPE_LABELS } from '@/lib/types';
import {
  getTimelineSteps,
  saveTimelineSteps,
  getSavedTrips,
  addSavedTrip,
  removeSavedTrip,
} from '@/lib/storage';

const DEFAULT_STEPS: Omit<TimelineStep, 'id' | 'completed'>[] = [
  { title: 'Reisverzekering afsluiten', description: 'Vergelijk en sluit een reisverzekering af', icon: '🛡️', daysBeforeDeparture: 42 },
  { title: 'Vaccinaties regelen', description: 'Check welke vaccinaties nodig zijn en maak een afspraak', icon: '💉', daysBeforeDeparture: 42 },
  { title: 'Visum aanvragen', description: 'Controleer of je een visum nodig hebt en vraag deze aan', icon: '📄', daysBeforeDeparture: 35 },
  { title: 'Accommodatie bevestigen', description: 'Controleer je boekingen en bewaar bevestigingen', icon: '🏨', daysBeforeDeparture: 21 },
  { title: 'Vervoer regelen', description: 'Boek vluchten, treinen of huurauto', icon: '🚗', daysBeforeDeparture: 21 },
  { title: 'Paklijst genereren', description: 'Genereer je AI paklijst op basis van weer en bestemming', icon: '📋', daysBeforeDeparture: 14 },
  { title: 'Persoonlijke items checken', description: 'Controleer of al je must-haves zijn toegevoegd', icon: '🎒', daysBeforeDeparture: 14 },
  { title: 'Kleding wassen', description: 'Was de kleding die je mee wilt nemen', icon: '🧺', daysBeforeDeparture: 7 },
  { title: 'Elektronica opladen', description: 'Laad powerbank, laptop, camera en telefoon op', icon: '🔋', daysBeforeDeparture: 3 },
  { title: 'Kopieën documenten maken', description: 'Maak foto\'s of kopieën van paspoort, ID en verzekeringspas', icon: '📑', daysBeforeDeparture: 3 },
  { title: 'Paklijst afvinken', description: 'Loop je volledige paklijst door en vink alles af', icon: '✅', daysBeforeDeparture: 1 },
  { title: 'Koffer scannen', description: 'Maak een foto van je spullen en laat AI checken', icon: '📸', daysBeforeDeparture: 1 },
  { title: 'Handbagage checken', description: 'Zorg dat paspoort, telefoon, oplader en snacks bij de hand zijn', icon: '👜', daysBeforeDeparture: 1 },
  { title: 'Huis klaarmaken', description: 'Planten water geven, post stoppen, sleutels regelen', icon: '🏠', daysBeforeDeparture: 1 },
];

function getTimelineGroups(steps: TimelineStep[]) {
  const groups = [
    { label: '6+ weken van tevoren', min: 30, steps: [] as TimelineStep[] },
    { label: '2-4 weken van tevoren', min: 10, steps: [] as TimelineStep[] },
    { label: '1 week van tevoren', min: 2, steps: [] as TimelineStep[] },
    { label: 'Laatste dag', min: 0, steps: [] as TimelineStep[] },
  ];
  for (const step of steps) {
    if (step.daysBeforeDeparture >= 30) groups[0].steps.push(step);
    else if (step.daysBeforeDeparture >= 10) groups[1].steps.push(step);
    else if (step.daysBeforeDeparture >= 2) groups[2].steps.push(step);
    else groups[3].steps.push(step);
  }
  return groups;
}

export default function DashboardPage() {
  const router = useRouter();
  const { trip, packList, setTrip, setPackList } = usePackVision();
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setSavedTrips(getSavedTrips());
    let stored = getTimelineSteps();
    if (stored.length === 0) {
      stored = DEFAULT_STEPS.map((s, i) => ({ ...s, id: `step-${i}`, completed: false }));
      saveTimelineSteps(stored);
    }
    setSteps(stored);
  }, []);

  function toggleStep(id: string) {
    setSteps(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
      saveTimelineSteps(updated);
      return updated;
    });
  }

  function handleSaveTrip() {
    if (!trip || !packList || packList.length === 0) return;
    addSavedTrip(trip, packList);
    setSavedTrips(getSavedTrips());
    setSaveSuccess('Reis opgeslagen als template!');
    setTimeout(() => setSaveSuccess(''), 3000);
  }

  function handleLoadTrip(saved: SavedTrip) {
    const unchecked = saved.packList.map(cat => ({
      ...cat,
      items: cat.items.map(item => ({ ...item, checked: false })),
    }));
    setTrip({ ...saved.trip, departureDate: '', returnDate: '' });
    setPackList(unchecked);
    router.push('/trip');
  }

  function handleDeleteSaved(id: string) {
    removeSavedTrip(id);
    setSavedTrips(getSavedTrips());
  }

  const daysUntilDeparture = trip
    ? Math.ceil((new Date(trip.departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const tripDays = trip
    ? Math.ceil((new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalItems = packList?.reduce((s, c) => s + c.items.length, 0) || 0;
  const checkedItems = packList?.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0) || 0;
  const packProgress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const timelineProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Reis Dashboard</h1>
        <p className="text-gray-500 mb-8">Stel eerst een reis in om je voorbereidingen bij te houden</p>
        <Link href="/trip" className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
          Stel je reis in ✈️
        </Link>

        {savedTrips.length > 0 && (
          <div className="mt-12 text-left">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">📁 Eerdere reizen</h2>
            <div className="space-y-3">
              {savedTrips.map(saved => (
                <div key={saved.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      {saved.trip.destination}{saved.trip.country ? `, ${saved.trip.country}` : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {TRIP_TYPE_LABELS[saved.trip.tripType]} · {saved.packList.reduce((s, c) => s + c.items.length, 0)} items · Opgeslagen {new Date(saved.savedAt).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                  <button onClick={() => handleLoadTrip(saved)} className="px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors">
                    Gebruik
                  </button>
                  <button onClick={() => handleDeleteSaved(saved.id)} className="px-2 py-2 text-gray-400 hover:text-red-500 transition-colors text-sm">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const groups = getTimelineGroups(steps);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reis Dashboard 📊</h1>
        <p className="text-gray-500 mb-6">Bereid je reis voor en houd je voortgang bij</p>
      </div>

      {/* Trip Summary Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white mb-6 animate-slide-up shadow-lg shadow-primary-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{trip.destination}</h2>
            <p className="text-primary-100 text-sm">{trip.country ? `${trip.country} · ` : ''}{TRIP_TYPE_LABELS[trip.tripType]} · {trip.travelers} {trip.travelers === 1 ? 'reiziger' : 'reizigers'}</p>
          </div>
          {daysUntilDeparture !== null && (
            <div className="text-right">
              {daysUntilDeparture > 0 ? (
                <>
                  <div className="text-3xl font-bold">{daysUntilDeparture}</div>
                  <div className="text-primary-100 text-xs">dagen te gaan</div>
                </>
              ) : daysUntilDeparture === 0 ? (
                <div className="text-lg font-bold">Vandaag! 🎉</div>
              ) : (
                <div className="text-sm text-primary-200">Reis is geweest</div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-primary-100">
          <span>📅 {tripDays} {tripDays === 1 ? 'dag' : 'dagen'}</span>
          <span>
            {new Date(trip.departureDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - {new Date(trip.returnDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* Progress bars */}
        <div className="mt-5 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-primary-100">📋 Paklijst</span>
              <span className="font-medium">{packProgress}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${packProgress}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-primary-100">⏱️ Voorbereidingen</span>
              <span className="font-medium">{timelineProgress}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${timelineProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/packlist" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">Paklijst</div>
            <div className="text-xs text-gray-400">{checkedItems}/{totalItems} ingepakt</div>
          </div>
        </Link>
        <Link href="/scan" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
          <span className="text-2xl">📸</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">Scanner</div>
            <div className="text-xs text-gray-400">Check je koffer</div>
          </div>
        </Link>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">⏱️ Voorbereidingstijdlijn</h2>
        <div className="space-y-6">
          {groups.map((group, gi) => {
            if (group.steps.length === 0) return null;
            const groupDone = group.steps.every(s => s.completed);
            return (
              <div key={gi} className="animate-slide-up" style={{ animationDelay: `${gi * 0.05}s` }}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-600">{group.label}</h3>
                  {groupDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Klaar</span>}
                  {daysUntilDeparture !== null && daysUntilDeparture <= group.min && !groupDone && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏰ Nu doen!</span>
                  )}
                </div>
                <div className="space-y-2">
                  {group.steps.map(step => (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      className={`w-full text-left bg-white rounded-xl p-4 shadow-sm border transition-all flex items-center gap-3 ${
                        step.completed ? 'border-green-100 bg-green-50/30' : 'border-gray-100 hover:border-primary-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        step.completed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                      }`}>
                        {step.completed && <span className="text-xs">✓</span>}
                      </div>
                      <span className="text-lg">{step.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${step.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{step.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Trip + Saved Trips */}
      <div className="space-y-4 pb-4">
        {saveSuccess && (
          <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
            <span>✅</span> {saveSuccess}
          </div>
        )}
        {packList && packList.length > 0 && (
          <button
            onClick={handleSaveTrip}
            className="w-full px-4 py-3.5 bg-white border-2 border-primary-200 text-primary-700 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
          >
            💾 Bewaar reis als template
          </button>
        )}

        {savedTrips.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">📁 Opgeslagen reizen</h2>
            <div className="space-y-2">
              {savedTrips.map(saved => (
                <div key={saved.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {saved.trip.destination}{saved.trip.country ? `, ${saved.trip.country}` : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {TRIP_TYPE_LABELS[saved.trip.tripType]} · {saved.packList.reduce((s, c) => s + c.items.length, 0)} items
                    </div>
                  </div>
                  <button onClick={() => handleLoadTrip(saved)} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors">
                    Gebruik
                  </button>
                  <button onClick={() => handleDeleteSaved(saved.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
