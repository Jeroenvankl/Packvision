import { NextRequest, NextResponse } from 'next/server';
import { WeatherData, WeatherDay } from '@/lib/types';

export async function GET(request: NextRequest) {
  const destination = request.nextUrl.searchParams.get('destination');

  if (!destination) {
    return NextResponse.json({ error: 'Bestemming is vereist' }, { status: 400 });
  }

  try {
    // Step 1: Geocode the destination using Open-Meteo (no API key needed)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=nl`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return NextResponse.json({ error: `Kon "${destination}" niet vinden. Controleer de spelling.` }, { status: 404 });
    }

    const place = geoData.results[0];
    const { latitude, longitude, name, country } = place;

    // Step 2: Try OpenWeatherMap first, then fall back to Open-Meteo
    const apiKey = process.env.OPENWEATHER_API_KEY;
    let weatherResult: WeatherData;

    if (apiKey && apiKey !== 'your_openweather_api_key_here') {
      try {
        weatherResult = await fetchOpenWeatherMap(latitude, longitude, name, country, apiKey);
        return NextResponse.json(weatherResult);
      } catch (owmError) {
        console.warn('OpenWeatherMap failed, falling back to Open-Meteo:', owmError);
      }
    }

    // Fallback: Open-Meteo (free, no key needed)
    weatherResult = await fetchOpenMeteo(latitude, longitude, name, country);
    return NextResponse.json(weatherResult);

  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Serverfout bij ophalen weerdata. Probeer het later opnieuw.' }, { status: 500 });
  }
}

async function fetchOpenWeatherMap(lat: number, lon: number, name: string, country: string, apiKey: string): Promise<WeatherData> {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=nl&appid=${apiKey}`;
  const weatherRes = await fetch(weatherUrl);
  const weatherData = await weatherRes.json();

  if (weatherData.cod !== '200') {
    throw new Error(`OpenWeatherMap error: ${weatherData.message || weatherData.cod}`);
  }

  const current = weatherData.list[0];
  const dailyMap = new Map<string, { temps: number[]; descs: string[]; icons: string[]; rain: number }>();

  for (const entry of weatherData.list) {
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
    icon: mapOWMIcon(getMostCommon(day.icons)),
    rain: Math.round(day.rain * 10) / 10,
  }));

  return {
    current: {
      temp: Math.round(current.main.temp),
      description: current.weather[0].description,
      icon: mapOWMIcon(current.weather[0].icon),
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed * 3.6),
    },
    forecast,
    location: `${name}, ${country}`,
  };
}

async function fetchOpenMeteo(lat: number, lon: number, name: string, country: string): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    throw new Error(data.reason || 'Open-Meteo error');
  }

  const forecast: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
    date,
    tempMin: Math.round(data.daily.temperature_2m_min[i]),
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    description: weatherCodeToDescription(data.daily.weather_code[i]),
    icon: weatherCodeToIcon(data.daily.weather_code[i]),
    rain: Math.round((data.daily.precipitation_sum[i] || 0) * 10) / 10,
  }));

  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      description: weatherCodeToDescription(data.current.weather_code),
      icon: weatherCodeToIcon(data.current.weather_code),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
    },
    forecast,
    location: `${name}, ${country}`,
  };
}

function weatherCodeToDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'onbewolkt',
    1: 'overwegend helder',
    2: 'gedeeltelijk bewolkt',
    3: 'bewolkt',
    45: 'mist',
    48: 'rijpmist',
    51: 'lichte motregen',
    53: 'motregen',
    55: 'zware motregen',
    56: 'lichte ijzel',
    57: 'ijzel',
    61: 'lichte regen',
    63: 'regen',
    65: 'zware regen',
    66: 'lichte ijsregen',
    67: 'ijsregen',
    71: 'lichte sneeuw',
    73: 'sneeuw',
    75: 'zware sneeuw',
    77: 'sneeuwkorrels',
    80: 'lichte regenbuien',
    81: 'regenbuien',
    82: 'zware regenbuien',
    85: 'lichte sneeuwbuien',
    86: 'zware sneeuwbuien',
    95: 'onweer',
    96: 'onweer met hagel',
    99: 'onweer met zware hagel',
  };
  return descriptions[code] || 'onbekend';
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return 'sun';
  if (code <= 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'snow';
  return 'storm';
}

function mapOWMIcon(icon: string): string {
  if (icon.includes('01')) return 'sun';
  if (icon.includes('02')) return 'partly-cloudy';
  if (icon.includes('03') || icon.includes('04')) return 'cloudy';
  if (icon.includes('09') || icon.includes('10')) return 'rain';
  if (icon.includes('11')) return 'storm';
  if (icon.includes('13')) return 'snow';
  if (icon.includes('50')) return 'fog';
  return 'sun';
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
