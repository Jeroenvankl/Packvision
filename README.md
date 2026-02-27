# PackVision - Slimme Paklijst met AI

AI-gestuurde paklijst generator die rekening houdt met weer, bestemming en jouw persoonlijke items. Scan je koffer met Vision AI en ontdek wat je vergeet.

## Features

- **Slimme Paklijst** - AI genereert je paklijst op basis van weer, bestemming, reistype en persoonlijke voorkeuren
- **Koffer Scanner** - Maak een foto van je spullen en AI vertelt wat je mist
- **Reis Dashboard** - Voorbereidingstijdlijn met stappen en voortgang
- **Persoonlijke Items** - Voeg je must-haves toe zodat je ze nooit vergeet
- **Vaccinatie-advies** - Bekijk welke vaccinaties nodig zijn per land
- **Wasmogelijkheid** - Geef aan of je kunt wassen op locatie voor minder kleding
- **Reis Templates** - Sla reizen op en hergebruik paklijsten
- **Per-reiziger** - Voeg namen toe voor meerdere reizigers
- **Export** - Deel via WhatsApp, kopieer naar klembord of download als bestand

## Tech Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **Google Gemini 2.5** (tekst + vision AI)
- **Open-Meteo / OpenWeatherMap** (weer)
- **localStorage** (alle data blijft lokaal)

## Snel starten

### 1. Clone de repository

```bash
git clone https://github.com/JOUW_USERNAME/packvision.git
cd packvision
```

### 2. Installeer dependencies

```bash
npm install
```

### 3. Maak een `.env.local` bestand

```bash
cp .env.example .env.local
```

### 4. Voeg je API keys toe

Open `.env.local` en vul in:

```env
GEMINI_API_KEY=jouw_gemini_key_hier
OPENWEATHER_API_KEY=jouw_openweather_key_hier
```

**Gemini API Key** (gratis):
1. Ga naar [Google AI Studio](https://aistudio.google.com/apikey)
2. Klik op "Create API Key"
3. Kopieer de key

**OpenWeatherMap** (optioneel - app werkt ook zonder):
1. Ga naar [OpenWeatherMap](https://openweathermap.org/api)
2. Maak een gratis account
3. Kopieer je API key (kan tot 2 uur duren om te activeren)

### 5. Start de development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Deployen naar Vercel

De snelste manier om PackVision live te zetten:

1. Push je code naar GitHub
2. Ga naar [vercel.com](https://vercel.com) en log in met GitHub
3. Klik "New Project" en selecteer je repository
4. Voeg je environment variables toe:
   - `GEMINI_API_KEY`
   - `OPENWEATHER_API_KEY`
5. Klik "Deploy"

Je app is dan live op `jouw-project.vercel.app`.

## Project structuur

```
packvision/
  app/
    page.tsx            # Landing page
    dashboard/page.tsx  # Reis dashboard + tijdlijn
    trip/page.tsx       # Reis configuratie
    packlist/page.tsx   # Paklijst met afvinken
    scan/page.tsx       # Koffer scanner (Vision AI)
    items/page.tsx      # Persoonlijke items
    api/
      weather/          # Weer API (OpenWeatherMap + Open-Meteo fallback)
      generate-packlist/# Paklijst generatie (Gemini)
      scan-luggage/     # Foto analyse (Gemini Vision)
      vaccinations/     # Vaccinatie-advies (Gemini)
  components/
    Navbar.tsx          # Navigatie (desktop + mobiel)
    WeatherIcon.tsx     # SVG weer iconen
  context/
    PackVisionContext.tsx # Globale state
  lib/
    types.ts            # TypeScript types
    gemini.ts           # Gemini API client
    prompts.ts          # AI prompts
    storage.ts          # localStorage helpers
    weather.ts          # Weer parsing
```
