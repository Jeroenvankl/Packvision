'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePackVision } from '@/context/PackVisionContext';
import { TripType, TRIP_TYPE_LABELS, WeatherData, VaccinationInfo } from '@/lib/types';
import { getTravelerNames, saveTravelerNames } from '@/lib/storage';
import WeatherIcon from '@/components/WeatherIcon';

const tripTypeOptions: { value: TripType; icon: string; desc: string }[] = [
  { value: 'vacation', icon: '🏖️', desc: 'Zon, zee & strand' },
  { value: 'business', icon: '💼', desc: 'Werk & vergaderingen' },
  { value: 'backpacking', icon: '🎒', desc: 'Avontuur & natuur' },
  { value: 'citytrip', icon: '🏙️', desc: 'Cultuur & sightseeing' },
];

export default function TripPage() {
  const router = useRouter();
  const { trip, setTrip, setWeather, setPackList, packList } = usePackVision();

  const [destination, setDestination] = useState(trip?.destination || '');
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [country, setCountry] = useState(trip?.country || '');
  const [departureDate, setDepartureDate] = useState(trip?.departureDate || '');
  const [returnDate, setReturnDate] = useState(trip?.returnDate || '');
  const [tripType, setTripType] = useState<TripType>(trip?.tripType || 'vacation');
  const [travelers, setTravelers] = useState(trip?.travelers || 1);
  const [travelerNames, setTravelerNamesState] = useState<string[]>([]);

  // Laundry options
  const [laundryAvailable, setLaundryAvailable] = useState(trip?.laundry?.available || false);
  const [laundryFrequency, setLaundryFrequency] = useState(trip?.laundry?.frequency || 2);

  // Vaccination options
  const [showVaccinations, setShowVaccinations] = useState(trip?.showVaccinations || false);
  const [vaccinationData, setVaccinationData] = useState<VaccinationInfo | null>(null);
  const [vaccinationLoading, setVaccinationLoading] = useState(false);
  const [vaccinationError, setVaccinationError] = useState('');

  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState('');
  const [weatherFetched, setWeatherFetched] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const daysDiff = departureDate && returnDate
    ? Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Load traveler names
  useEffect(() => {
    setTravelerNamesState(getTravelerNames());
  }, []);

  // Fetch vaccination data when toggle is enabled and country is filled
  useEffect(() => {
    if (showVaccinations && country) {
      fetchVaccinations(country);
    }
  }, [showVaccinations, country]);

  async function fetchVaccinations(countryName: string) {
    setVaccinationLoading(true);
    setVaccinationError('');
    try {
      const res = await fetch(`/api/vaccinations?country=${encodeURIComponent(countryName)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVaccinationData(data);
    } catch (err) {
      setVaccinationError(err instanceof Error ? err.message : 'Kon vaccinatie-informatie niet ophalen');
    } finally {
      setVaccinationLoading(false);
    }
  }

  async function fetchWeather() {
    if (!destination) return;
    setLoading(true);
    setError('');
    try {
      const query = country ? `${destination},${country}` : destination;
      const res = await fetch(`/api/weather?destination=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWeatherData(data);
      setWeather(data);
      setWeatherFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon weer niet ophalen');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination || !departureDate || !returnDate) {
      setError('Vul alle verplichte velden in');
      return;
    }

    if (daysDiff <= 0) {
      setError('De terugkomstdatum moet na de vertrekdatum liggen');
      return;
    }

    if (daysDiff > 60) {
      setError('Maximaal 60 dagen per reis');
      return;
    }

    // Waarschuwing als er al een paklijst bestaat met afgevinkte items
    if (packList && packList.length > 0 && !showResetWarning) {
      const checkedCount = packList.reduce((sum, cat) => sum + cat.items.filter(i => i.checked).length, 0);
      if (checkedCount > 0) {
        setShowResetWarning(true);
        return;
      }
    }

    await submitTrip();
  }

  async function submitTrip() {
    setShowResetWarning(false);
    const tripData = {
      destination,
      country,
      departureDate,
      returnDate,
      tripType,
      travelers,
      laundry: {
        available: laundryAvailable,
        frequency: laundryAvailable ? laundryFrequency : 0,
      },
      showVaccinations,
    };
    setTrip(tripData);

    if (!weatherFetched) {
      setLoading(true);
      setError('');
      try {
        const query = country ? `${destination},${country}` : destination;
        const res = await fetch(`/api/weather?destination=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setWeather(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kon weer niet ophalen');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setPackList([]);
    router.push('/packlist');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Waar ga je heen? ✈️</h1>
        <p className="text-gray-500 mb-8">Vul je reisdetails in en wij regelen de rest</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up">
          <h2 className="font-semibold text-gray-700 mb-4">📍 Bestemming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Stad *</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => { setDestination(e.target.value); setWeatherFetched(false); }}
                placeholder="bijv. Barcelona"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Land</label>
              <input
                type="text"
                value={country}
                onChange={(e) => { setCountry(e.target.value); setWeatherFetched(false); setVaccinationData(null); }}
                placeholder="bijv. Spanje"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={fetchWeather}
            disabled={!destination || loading}
            className="mt-4 px-5 py-2.5 text-sm bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                Weer ophalen...
              </>
            ) : (
              <>🌤️ Bekijk weer</>
            )}
          </button>
        </div>

        {/* Weather Preview */}
        {weatherData && (
          <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-cyan-50 rounded-2xl p-6 border border-primary-100 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-gray-700">Weer in {weatherData.location}</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <WeatherIcon type={weatherData.current.icon} size={56} />
              <div>
                <div className="text-4xl font-bold text-gray-800">{weatherData.current.temp}°C</div>
                <div className="text-gray-500 capitalize">{weatherData.current.description}</div>
              </div>
              <div className="ml-auto text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400">💧</span> {weatherData.current.humidity}%
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">💨</span> {weatherData.current.windSpeed} km/h
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
              {weatherData.forecast.slice(0, 7).map((day) => (
                <div key={day.date} className="bg-white/60 backdrop-blur-sm rounded-xl p-2.5 text-center hover:bg-white/80 transition-colors">
                  <div className="text-xs text-gray-500 font-medium">
                    {new Date(day.date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short' })}
                  </div>
                  <div className="flex justify-center my-1.5">
                    <WeatherIcon type={day.icon} size={32} />
                  </div>
                  <div className="text-xs font-semibold text-gray-700">
                    {day.tempMax}°
                  </div>
                  <div className="text-xs text-gray-400">
                    {day.tempMin}°
                  </div>
                  {day.rain > 0 && (
                    <div className="text-[10px] text-blue-500 mt-0.5">{day.rain}mm</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-semibold text-gray-700 mb-4">📅 Wanneer</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Vertrek *</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Terugkomst *</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departureDate || today}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                required
              />
            </div>
          </div>
          {daysDiff > 0 && (
            <div className="mt-3 text-sm text-primary-600 font-medium flex items-center gap-1.5">
              <span>📅</span> {daysDiff} {daysDiff === 1 ? 'dag' : 'dagen'}
            </div>
          )}
        </div>

        {/* Trip Type */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-semibold text-gray-700 mb-4">🧭 Type reis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tripTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTripType(opt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  tripType === opt.value
                    ? 'border-primary-400 bg-primary-50 shadow-sm scale-[1.02]'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-sm font-semibold text-gray-700">
                  {TRIP_TYPE_LABELS[opt.value]}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Travelers */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-semibold text-gray-700 mb-4">👥 Reizigers</h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTravelers(Math.max(1, travelers - 1))}
              className="w-11 h-11 rounded-full bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              −
            </button>
            <span className="text-3xl font-bold text-gray-800 w-10 text-center">{travelers}</span>
            <button
              type="button"
              onClick={() => setTravelers(Math.min(20, travelers + 1))}
              className="w-11 h-11 rounded-full bg-primary-100 text-primary-600 font-bold text-lg hover:bg-primary-200 transition-colors flex items-center justify-center"
            >
              +
            </button>
            <span className="text-sm text-gray-400 ml-2">
              {travelers === 1 ? 'persoon' : 'personen'}
            </span>
          </div>

          {travelers > 1 && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <label className="block text-sm text-gray-500 mb-1">Wie reist er mee?</label>
              {Array.from({ length: travelers }, (_, i) => (
                <input
                  key={i}
                  type="text"
                  value={travelerNames[i] || ''}
                  onChange={(e) => {
                    const updated = [...travelerNames];
                    while (updated.length <= i) updated.push('');
                    updated[i] = e.target.value;
                    setTravelerNamesState(updated);
                    saveTravelerNames(updated);
                  }}
                  placeholder={`Reiziger ${i + 1}`}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                />
              ))}
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span>💡</span> De paklijst houdt rekening met het aantal reizigers
              </p>
            </div>
          )}
        </div>

        {/* Laundry Option */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <h2 className="font-semibold text-gray-700 mb-4">🧺 Wasmogelijkheid</h2>
          <p className="text-sm text-gray-400 mb-4">
            Kun je op de bestemming kleding wassen? Dan hoef je minder mee te nemen!
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setLaundryAvailable(!laundryAvailable)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                laundryAvailable ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  laundryAvailable ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {laundryAvailable ? 'Ja, ik kan wassen op locatie' : 'Nee, geen wasmogelijkheid'}
            </span>
          </div>

          {laundryAvailable && (
            <div className="animate-fade-in bg-primary-50/50 rounded-xl p-4 border border-primary-100">
              <label className="block text-sm text-gray-600 mb-2">Hoe vaak kun je wassen tijdens je reis?</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLaundryFrequency(Math.max(1, laundryFrequency - 1))}
                  className="w-9 h-9 rounded-full bg-white text-gray-600 font-bold hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-200"
                >
                  −
                </button>
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary-700">{laundryFrequency}x</span>
                  <span className="text-sm text-gray-500 ml-1">tijdens de reis</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLaundryFrequency(Math.min(20, laundryFrequency + 1))}
                  className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 font-bold hover:bg-primary-200 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-primary-600 mt-3 flex items-center gap-1">
                <span>💡</span>
                {daysDiff > 0
                  ? `Bij ${daysDiff} dagen en ${laundryFrequency}x wassen heb je veel minder kleding nodig!`
                  : 'Vul je reisdata in om te zien hoeveel kleding je bespaart'
                }
              </p>
            </div>
          )}
        </div>

        {/* Vaccination Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="font-semibold text-gray-700 mb-4">💉 Vaccinatie-advies</h2>
          <p className="text-sm text-gray-400 mb-4">
            Bekijk welke vaccinaties aanbevolen of verplicht zijn voor je bestemming
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setShowVaccinations(!showVaccinations)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                showVaccinations ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  showVaccinations ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {showVaccinations ? 'Toon vaccinatie-advies' : 'Vaccinatie-advies verbergen'}
            </span>
          </div>

          {showVaccinations && !country && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <p>Vul eerst een land in bij de bestemming om vaccinatie-advies te krijgen.</p>
            </div>
          )}

          {showVaccinations && country && vaccinationLoading && (
            <div className="flex items-center justify-center py-8">
              <span className="inline-block w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Vaccinatie-advies ophalen voor {country}...</span>
            </div>
          )}

          {showVaccinations && country && vaccinationError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <div>
                <p className="font-medium">Fout bij ophalen</p>
                <p>{vaccinationError}</p>
                <button
                  type="button"
                  onClick={() => fetchVaccinations(country)}
                  className="mt-2 text-red-700 underline hover:no-underline text-xs"
                >
                  Opnieuw proberen
                </button>
              </div>
            </div>
          )}

          {showVaccinations && country && vaccinationData && !vaccinationLoading && (
            <div className="animate-fade-in space-y-4">
              {/* Required vaccinations */}
              {vaccinationData.required.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <h3 className="font-semibold text-red-700 text-sm mb-3 flex items-center gap-1.5">
                    <span>🔴</span> Verplichte vaccinaties
                  </h3>
                  <div className="space-y-2">
                    {vaccinationData.required.map((vac, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 text-xs">●</span>
                        <div>
                          <span className="font-medium text-sm text-gray-800">{vac.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{vac.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended vaccinations */}
              {vaccinationData.recommended.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-700 text-sm mb-3 flex items-center gap-1.5">
                    <span>🟡</span> Aanbevolen vaccinaties
                  </h3>
                  <div className="space-y-2">
                    {vaccinationData.recommended.map((vac, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5 text-xs">●</span>
                        <div>
                          <span className="font-medium text-sm text-gray-800">{vac.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{vac.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No vaccinations needed */}
              {vaccinationData.required.length === 0 && vaccinationData.recommended.length === 0 && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🎉</span>
                    <h3 className="font-semibold text-green-800 text-base">Geen vaccinaties nodig!</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Er zijn geen verplichte of specifiek aanbevolen vaccinaties voor {country}.
                    Zorg er wel voor dat je standaard vaccinaties (zoals DTP) up-to-date zijn.
                  </p>
                </div>
              )}

              {/* Note */}
              {vaccinationData.note && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-blue-700 flex items-start gap-1.5">
                    <span className="mt-0.5">ℹ️</span>
                    <span>{vaccinationData.note}</span>
                  </p>
                </div>
              )}

              {/* Official sources */}
              <div className="text-xs text-gray-400 space-y-1">
                <p className="font-medium text-gray-500">Officiële bronnen:</p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://www.ggdreisvaccinaties.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-700 underline"
                  >
                    GGD Reisvaccinaties
                  </a>
                  <a
                    href="https://www.lcr.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-700 underline"
                  >
                    LCR
                  </a>
                  <a
                    href="https://www.nederlandwereldwijd.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-700 underline"
                  >
                    NederlandWereldwijd
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Waarschuwing bij paklijst reset */}
        {showResetWarning && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">Bestaande paklijst overschrijven?</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Je hebt al items afgevinkt op je huidige paklijst. Als je doorgaat wordt er een nieuwe paklijst gegenereerd en gaat je voortgang verloren.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => submitTrip()}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    Ja, nieuwe lijst genereren
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetWarning(false)}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-3.5 rounded-xl text-sm flex items-start gap-2">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <div>
              <p className="font-medium">Oeps!</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !destination || !departureDate || !returnDate}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl text-lg font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Even geduld...
            </>
          ) : (
            <>Genereer paklijst 📋</>
          )}
        </button>
      </form>
    </div>
  );
}
