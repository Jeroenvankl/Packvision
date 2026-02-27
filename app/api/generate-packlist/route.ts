import { NextRequest, NextResponse } from 'next/server';
import { generatePackList } from '@/lib/gemini';
import { buildPackListPrompt } from '@/lib/prompts';
import { TripDetails, WeatherData, PersonalItem, PackListCategory } from '@/lib/types';

function extractJSON(text: string): string {
  let str = text.trim();

  // Remove markdown code blocks
  const codeBlockMatch = str.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
  if (codeBlockMatch) {
    str = codeBlockMatch[1].trim();
  }

  // If it already starts with [, try it
  if (str.startsWith('[')) return str;

  // Find the outermost JSON array using bracket matching
  const startIdx = str.indexOf('[');
  if (startIdx === -1) return str;

  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '[') depth++;
    else if (str[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx !== -1) {
    return str.substring(startIdx, endIdx + 1);
  }

  return str;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trip, weather, personalItems } = body as {
      trip: TripDetails;
      weather: WeatherData;
      personalItems: PersonalItem[];
    };

    if (!trip) {
      return NextResponse.json({ error: 'Reisgegevens zijn vereist' }, { status: 400 });
    }

    if (!weather) {
      return NextResponse.json({ error: 'Weerdata is vereist. Haal eerst het weer op.' }, { status: 400 });
    }

    const prompt = buildPackListPrompt(trip, weather, personalItems || []);
    const response = await generatePackList(prompt);

    const jsonStr = extractJSON(response);

    let packList: PackListCategory[];
    try {
      packList = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON.');
      console.error('Raw response (first 1000 chars):', response.substring(0, 1000));
      console.error('Extracted JSON (first 500 chars):', jsonStr.substring(0, 500));
      console.error('Parse error:', parseError);
      return NextResponse.json(
        { error: 'De AI gaf een ongeldig antwoord. Probeer het opnieuw.' },
        { status: 500 }
      );
    }

    // Validate structure
    if (!Array.isArray(packList) || packList.length === 0) {
      return NextResponse.json(
        { error: 'De AI genereerde een lege paklijst. Probeer het opnieuw.' },
        { status: 500 }
      );
    }

    // Ensure each item has proper fields
    packList = packList.map((cat) => ({
      name: cat.name || 'Overig',
      icon: cat.icon || '📦',
      items: (cat.items || []).map((item, index) => ({
        ...item,
        id: item.id || `${cat.name}-${index}-${Date.now()}`,
        name: item.name || 'Item',
        checked: false,
        quantity: item.quantity || 1,
        essential: item.essential ?? false,
      })),
    }));

    return NextResponse.json(packList);
  } catch (error) {
    console.error('Error generating pack list:', error);

    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'De AI is tijdelijk overladen (quota bereikt). Wacht een minuut en probeer het opnieuw.' },
          { status: 429 }
        );
      }
      if (error.message.includes('API_KEY') || error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          { error: 'De Gemini API key is ongeldig of niet geconfigureerd. Controleer .env.local.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Er ging iets mis bij het genereren van de paklijst. Probeer het opnieuw.' },
      { status: 500 }
    );
  }
}
