'use client';

import { useState, useRef } from 'react';
import { usePackVision } from '@/context/PackVisionContext';
import { ScanResult } from '@/lib/types';
import Link from 'next/link';

// Comprimeer en verklein de afbeelding in de browser voordat we het naar de API sturen
function compressImage(file: File, maxDim = 1280, quality = 0.7): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Verklein als de afbeelding te groot is
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context niet beschikbaar'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Converteer naar JPEG voor kleinere bestanden
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Afbeelding kon niet worden geladen'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen'));
    reader.readAsDataURL(file);
  });
}

export default function ScanPage() {
  const { trip, packList } = usePackVision();
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [imageSize, setImageSize] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setError('');

    try {
      // Toon preview direct
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Comprimeer de afbeelding voor de AI
      const originalKB = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      setImage(compressed.base64);
      setMimeType(compressed.mimeType);

      // Toon grootte info
      const compressedKB = Math.round((compressed.base64.length * 3) / 4 / 1024);
      const saved = originalKB > 0 ? Math.round((1 - compressedKB / originalKB) * 100) : 0;
      setImageSize(
        compressedKB > 1024
          ? `${(compressedKB / 1024).toFixed(1)} MB`
          : `${compressedKB} KB`
        + (saved > 10 ? ` (${saved}% kleiner)` : '')
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij verwerken afbeelding');
    }
  }

  async function handleScan() {
    if (!image || !packList || !trip) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/scan-luggage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mimeType, packList, trip }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Server fout (${res.status}). Probeer het opnieuw.`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Verbinding mislukt. Controleer of de server draait en probeer opnieuw.');
      } else {
        setError(err instanceof Error ? err.message : 'Fout bij scannen');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!trip || !packList || packList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">📸</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Koffer Scanner</h1>
        <p className="text-gray-500 mb-6">
          Je moet eerst een reis instellen en een paklijst genereren voordat je de scanner kunt gebruiken.
        </p>
        <Link
          href="/trip"
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          Stel je reis in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Koffer Scanner 📸</h1>
        <p className="text-gray-500 mb-8">
          Leg al je spullen op bed, maak een foto, en AI vertelt je wat je mist
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 animate-slide-up">
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
          >
            <div className="text-5xl mb-3">📷</div>
            <p className="text-gray-600 font-medium mb-1">Klik om een foto te maken of uploaden</p>
            <p className="text-sm text-gray-400">Leg al je spullen op het bed voor het beste resultaat</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Koffer foto"
              className="w-full rounded-xl object-cover max-h-[400px]"
            />
            <button
              onClick={() => {
                setPreview(null);
                setImage(null);
                setResult(null);
                setImageSize('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              ✕
            </button>
            {imageSize && (
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg">
                📐 {imageSize}
              </div>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview && !result && (
          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full mt-4 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI analyseert je spullen...
              </span>
            ) : (
              '🔍 Analyseer mijn spullen'
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <div>
            <p>{error}</p>
            {!loading && image && (
              <button
                onClick={handleScan}
                className="mt-2 text-red-700 underline hover:no-underline text-xs font-medium"
              >
                Opnieuw proberen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scan Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-5 border border-primary-100">
            <h3 className="font-semibold text-gray-800 mb-2">📊 Samenvatting</h3>
            <p className="text-gray-600">{result.summary}</p>
          </div>

          {/* Recognized Items */}
          {result.recognizedItems.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">
                ✅ Herkende items ({result.recognizedItems.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.recognizedItems.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Items */}
          {result.missingItems.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
              <h3 className="font-semibold text-red-700 mb-3">
                ❌ Ontbrekende items ({result.missingItems.length})
              </h3>
              <div className="space-y-2">
                {result.missingItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg"
                  >
                    <span>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
              <h3 className="font-semibold text-amber-700 mb-3">
                ⚠️ Waarschuwingen
              </h3>
              <div className="space-y-2">
                {result.warnings.map((warning, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 bg-amber-50 text-amber-700 text-sm rounded-lg"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
              <h3 className="font-semibold text-blue-700 mb-3">💡 Tips</h3>
              <div className="space-y-2">
                {result.tips.map((tip, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scan Again */}
          <button
            onClick={() => {
              setPreview(null);
              setImage(null);
              setResult(null);
              setImageSize('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            📸 Nieuwe foto scannen
          </button>
        </div>
      )}
    </div>
  );
}
