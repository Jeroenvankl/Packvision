import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';
import { buildScanPrompt } from '@/lib/prompts';
import { TripDetails, PackListCategory, ScanResult } from '@/lib/types';

export const maxDuration = 60; // max 60 seconden voor deze route

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Verzoek te groot of ongeldig. Probeer een kleinere foto.' },
        { status: 413 }
      );
    }
    const { image, mimeType, packList, trip } = body as {
      image: string;
      mimeType: string;
      packList: PackListCategory[];
      trip: TripDetails;
    };

    if (!image) {
      return NextResponse.json({ error: 'Geen afbeelding ontvangen.' }, { status: 400 });
    }
    if (!packList || packList.length === 0) {
      return NextResponse.json({ error: 'Geen paklijst beschikbaar. Genereer eerst een paklijst.' }, { status: 400 });
    }
    if (!trip) {
      return NextResponse.json({ error: 'Geen reisgegevens beschikbaar.' }, { status: 400 });
    }

    // Validate image size (max ~15MB base64)
    if (image.length > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'De afbeelding is te groot. Gebruik een foto kleiner dan 10MB.' },
        { status: 400 }
      );
    }

    console.log(`Scan request: image size ${Math.round(image.length / 1024)}KB, mime: ${mimeType || 'image/jpeg'}`);

    const prompt = buildScanPrompt(packList, trip);
    const response = await analyzeImage(prompt, image, mimeType || 'image/jpeg');

    // Robust JSON extraction with multiple strategies
    let jsonStr = response.trim();

    // Strategy 1: Remove markdown code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // Strategy 2: Find JSON object using bracket-depth matching
    if (!jsonStr.startsWith('{')) {
      const startIdx = jsonStr.indexOf('{');
      if (startIdx !== -1) {
        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') depth++;
          else if (jsonStr[i] === '}') {
            depth--;
            if (depth === 0) { endIdx = i; break; }
          }
        }
        if (endIdx !== -1) {
          jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }
      }
    }

    let scanResult: ScanResult;
    try {
      scanResult = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse scan response as JSON.');
      console.error('Raw response (first 800 chars):', response.substring(0, 800));
      console.error('Extracted JSON (first 500 chars):', jsonStr.substring(0, 500));

      // Strategy 3: Try to build a minimal valid result from partial data
      try {
        // Remove trailing incomplete content and try again
        const lastBrace = jsonStr.lastIndexOf('}');
        if (lastBrace > 0) {
          const trimmed = jsonStr.substring(0, lastBrace + 1);
          scanResult = JSON.parse(trimmed);
        } else {
          throw new Error('No valid JSON found');
        }
      } catch {
        return NextResponse.json(
          { error: 'De AI kon het resultaat niet correct formatteren. Probeer het opnieuw.' },
          { status: 500 }
        );
      }
    }

    // Ensure all fields exist
    scanResult = {
      recognizedItems: scanResult.recognizedItems || [],
      missingItems: scanResult.missingItems || [],
      warnings: scanResult.warnings || [],
      tips: scanResult.tips || [],
      summary: scanResult.summary || 'Analyse voltooid.',
    };

    return NextResponse.json(scanResult);
  } catch (error) {
    console.error('Error scanning luggage:', error);
    const errMsg = error instanceof Error ? error.message : String(error);

    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'De AI is tijdelijk overladen (quota bereikt). Wacht een minuut en probeer het opnieuw.' },
        { status: 429 }
      );
    }
    if (errMsg.includes('API_KEY') || errMsg.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { error: 'De Gemini API key is ongeldig of niet geconfigureerd.' },
        { status: 401 }
      );
    }
    if (errMsg.includes('SAFETY')) {
      return NextResponse.json(
        { error: 'De AI kon deze afbeelding niet verwerken. Probeer een andere foto.' },
        { status: 400 }
      );
    }
    if (errMsg.includes('Could not process') || errMsg.includes('INVALID_ARGUMENT')) {
      return NextResponse.json(
        { error: 'De afbeelding kon niet worden verwerkt door de AI. Probeer een andere foto of verklein de afbeelding.' },
        { status: 400 }
      );
    }
    if (errMsg.includes('deadline') || errMsg.includes('timeout') || errMsg.includes('DEADLINE_EXCEEDED')) {
      return NextResponse.json(
        { error: 'De AI deed er te lang over. Probeer het opnieuw of gebruik een kleinere foto.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: `Er ging iets mis bij het scannen: ${errMsg.substring(0, 100)}. Probeer het opnieuw.` },
      { status: 500 }
    );
  }
}
