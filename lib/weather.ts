import { WeatherData, WeatherDay } from './types';

export async function getWeatherForDestination(destination: string): Promise<WeatherData> {
  const response = await fetch(`/api/weather?destination=${encodeURIComponent(destination)}`);
  if (!response.ok) {
    throw new Error('Kon weerdata niet ophalen');
  }
  return response.json();
}

export function parseOpenWeatherResponse(data: {
  city: { name: string; country: string };
  list: Array<{
    dt: number;
    main: { temp: number; temp_min: number; temp_max: number; humidity: number };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number };
    rain?: { '3h': number };
  }>;
}): WeatherData {
  const current = data.list[0];

  const dailyMap = new Map<string, { temps: number[]; descs: string[]; icons: string[]; rain: number }>();

  for (const entry of data.list) {
    const date = new Date(entry.dt * 1000).toISOString().split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { temps: [], descs: [], icons: [], rain: 0 });
    }
    const day = dailyMap.get(date)!;
    day.temps.push(entry.main.temp);
    day.descs.push(entry.weather[0].description);
    day.icons.push(entry.weather[0].icon);
    day.rain += entry.rain?.['3h'] || 0;
  }

  const forecast: WeatherDay[] = Array.from(dailyMap.entries()).map(([date, day]) => ({
    date,
    tempMin: Math.round(Math.min(...day.temps)),
    tempMax: Math.round(Math.max(...day.temps)),
    description: getMostCommon(day.descs),
    icon: getMostCommon(day.icons),
    rain: Math.round(day.rain * 10) / 10,
  }));

  return {
    current: {
      temp: Math.round(current.main.temp),
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed * 3.6),
    },
    forecast,
    location: `${data.city.name}, ${data.city.country}`,
  };
}

function getMostCommon(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  let maxCount = 0;
  let maxItem = arr[0];
  for (const [item, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxItem = item;
    }
  }
  return maxItem;
}
