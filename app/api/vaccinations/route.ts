import { NextRequest, NextResponse } from 'next/server';
import { generatePackList } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country');

  if (!country) {
    return NextResponse.json({ error: 'Land is vereist' }, { status: 400 });
  }

  try {
    const prompt = `Je bent een reizigersgezondheidexpert. Geef vaccinatie-advies voor een reis naar ${country}.

Geef je antwoord als JSON met dit formaat:
{
  "required": [
    { "name": "Vaccinatie naam", "description": "Korte uitleg waarom", "required": true }
  ],
  "recommended": [
    { "name": "Vaccinatie naam", "description": "Korte uitleg waarom", "required": false }
  ],
  "note": "Korte algemene opmerking over gezondheidsadvies voor dit land"
}

Regels:
- "required" = verplichte vaccinaties (door het land vereist, bijv. gele koorts)
- "recommended" = aanbevolen vaccinaties door GGD/RIVM voor reizigers
- Wees accuraat en gebaseerd op officiële adviezen van RIVM/LCR/WHO
- Als er geen verplichte vaccinaties zijn, geef een lege array
- Vermeld altijd DTP (Difterie, Tetanus, Polio) als aanbevolen als de reiziger dit niet recent heeft gehad
- Antwoord in het Nederlands
- Vermeld in de "note" dat de reiziger altijd de GGD of huisarts moet raadplegen voor persoonlijk advies`;

    const response = await generatePackList(prompt);

    let jsonStr = response.trim();
    const startIdx = jsonStr.indexOf('{');
    if (startIdx > 0) {
      let depth = 0;
      let endIdx = -1;
      for (let i = startIdx; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') depth++;
        else if (jsonStr[i] === '}') {
          depth--;
          if (depth === 0) { endIdx = i; break; }
        }
      }
      if (endIdx !== -1) jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }

    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching vaccination info:', error);

    if (error instanceof Error && (error.message.includes('429') || error.message.includes('quota'))) {
      return NextResponse.json(
        { error: 'AI is tijdelijk overladen. Probeer het later opnieuw.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Kon vaccinatie-informatie niet ophalen.' },
      { status: 500 }
    );
  }
}
