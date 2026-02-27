import { TripDetails, WeatherData, PersonalItem, PackListCategory, TRIP_TYPE_LABELS } from './types';

export function buildPackListPrompt(
  trip: TripDetails,
  weather: WeatherData,
  personalItems: PersonalItem[]
): string {
  const days = Math.ceil(
    (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const weatherSummary = weather.forecast
    .map((d) => `${d.date}: ${d.tempMin}-${d.tempMax}°C, ${d.description}${d.rain > 0 ? `, ${d.rain}mm regen` : ''}`)
    .join('\n');

  const personalItemsList = personalItems
    .filter((item) => item.alwaysBring)
    .map((item) => `- ${item.name} (${item.category})`)
    .join('\n');

  const laundryInfo = trip.laundry?.available
    ? `\nWASMOGELIJKHEID:\nDe reiziger kan op de bestemming kleding wassen, ${trip.laundry.frequency}x tijdens de hele reis van ${days} dagen.\nHoud hier rekening mee bij de hoeveelheden kleding - de reiziger hoeft MINDER kleding mee te nemen!\nBereken hoeveel kleding de reiziger nodig heeft op basis van ${days} dagen en ${trip.laundry.frequency} wasbeurten.\nVoeg eventueel wasmiddel/waszakje toe aan de paklijst.`
    : '';

  return `Je bent een slimme inpak-assistent. Genereer een complete paklijst voor de volgende reis.

REISDETAILS:
- Bestemming: ${trip.destination}, ${trip.country}
- Type reis: ${TRIP_TYPE_LABELS[trip.tripType]}
- Duur: ${days} dagen (${trip.departureDate} tot ${trip.returnDate})
- Aantal reizigers: ${trip.travelers}

WEERSVOORSPELLING voor ${weather.location}:
Huidig: ${weather.current.temp}°C, ${weather.current.description}
Luchtvochtigheid: ${weather.current.humidity}%, Wind: ${weather.current.windSpeed} km/h

Komende dagen:
${weatherSummary}
${laundryInfo}
${personalItemsList ? `\nPERSOONLIJKE ITEMS (altijd meenemen):\n${personalItemsList}` : ''}

INSTRUCTIES:
- Genereer een paklijst gebaseerd op het weer, het type reis en de duur
- Geef per item een hoeveelheid aan
- Markeer essentiële items
- Houd rekening met het klimaat en mogelijke weersomstandigheden
${trip.laundry?.available ? `- BELANGRIJK: Pas de hoeveelheden kleding aan omdat de reiziger ${trip.laundry.frequency}x kan wassen tijdens de reis. Minder kleding = lichter inpakken!` : ''}
- Voeg de persoonlijke items van de gebruiker toe als ze relevant zijn
- Geef praktische tips per categorie

Geef je antwoord UITSLUITEND als valid JSON in dit exact format (geen markdown, geen code blocks):
[
  {
    "name": "Categorienaam",
    "icon": "emoji",
    "items": [
      {
        "id": "uniek-id",
        "name": "Item naam",
        "quantity": 1,
        "checked": false,
        "essential": true,
        "note": "Optionele tip"
      }
    ]
  }
]

Categorieën moeten zijn: Kleding, Toiletartikelen, Tech & Elektronica, Documenten & Geld, Medicijnen & Gezondheid, Accessoires, en eventueel extra categorieën afhankelijk van het type reis.`;
}

export function buildScanPrompt(
  packList: PackListCategory[],
  trip: TripDetails
): string {
  const days = Math.ceil(
    (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const packListSummary = packList
    .map((cat) => {
      const items = cat.items.map((i) => `  - ${i.name} (${i.quantity}x)`).join('\n');
      return `${cat.name}:\n${items}`;
    })
    .join('\n\n');

  return `Je bent een slimme koffer-scanner. Analyseer de foto van de spullen die deze reiziger heeft klaargelegd.

REISDETAILS:
- Bestemming: ${trip.destination}, ${trip.country}
- Type reis: ${TRIP_TYPE_LABELS[trip.tripType]}
- Duur: ${days} dagen

VERWACHTE PAKLIJST:
${packListSummary}

INSTRUCTIES:
Bekijk de foto zorgvuldig en:
1. Herken alle zichtbare items op de foto
2. Vergelijk wat je ziet met de verwachte paklijst
3. Identificeer wat er MIST (items op de paklijst die niet op de foto staan)
4. Geef WAARSCHUWINGEN (bijv. te weinig shirts voor het aantal dagen, producten die er oud/verlopen uitzien, etc.)
5. Geef slimme TIPS (bijv. "je hebt een adapter nodig voor dit land", "neem een extra paar sokken mee")

Geef je antwoord UITSLUITEND als valid JSON in dit exact format (geen markdown, geen code blocks):
{
  "recognizedItems": ["item1", "item2"],
  "missingItems": ["item1", "item2"],
  "warnings": ["waarschuwing1", "waarschuwing2"],
  "tips": ["tip1", "tip2"],
  "summary": "Korte samenvatting in 1-2 zinnen"
}`;
}
