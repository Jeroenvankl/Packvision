'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePackVision } from '@/context/PackVisionContext';
import Link from 'next/link';

export default function PackListPage() {
  const router = useRouter();
  const { trip, weather, packList, setPackList, toggleItem, personalItems, addPackListItem, removePackListItem } = usePackVision();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [showAddItem, setShowAddItem] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const generated = useRef(false);

  useEffect(() => {
    if (!trip) {
      router.push('/trip');
      return;
    }
    if (trip && weather && (!packList || packList.length === 0) && !generated.current) {
      generated.current = true;
      generateList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, weather]);

  // Expand all categories when pack list is loaded
  useEffect(() => {
    if (packList && packList.length > 0) {
      setExpandedCategories(new Set(packList.map((_, i) => i)));
    }
  }, [packList]);

  async function generateList() {
    if (!trip || !weather) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-packlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, weather, personalItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPackList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij genereren');
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(index: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function buildPackListText(): string {
    if (!packList || !trip) return '';

    const days = Math.ceil(
      (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    let text = `📋 Paklijst - ${trip.destination}${trip.country ? `, ${trip.country}` : ''}\n`;
    text += `📅 ${days} dagen (${new Date(trip.departureDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} - ${new Date(trip.returnDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })})\n`;
    text += `━━━━━━━━━━━━━━━━\n\n`;

    for (const category of packList) {
      text += `${category.icon} ${category.name}\n`;
      for (const item of category.items) {
        const check = item.checked ? '✅' : '⬜';
        const qty = item.quantity > 1 ? ` (${item.quantity}x)` : '';
        const essential = item.essential ? ' ⭐' : '';
        text += `${check} ${item.name}${qty}${essential}\n`;
      }
      text += `\n`;
    }

    const checked = packList.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0);
    const total = packList.reduce((s, c) => s + c.items.length, 0);
    text += `━━━━━━━━━━━━━━━━\n`;
    text += `📊 ${checked}/${total} ingepakt (${total > 0 ? Math.round((checked / total) * 100) : 0}%)\n`;
    text += `\n✨ Gemaakt met PackVision`;

    return text;
  }

  async function handleShare() {
    const text = buildPackListText();
    if (!text) return;

    // Gebruik de Web Share API als beschikbaar (mobiel/modern browser)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Paklijst - ${trip?.destination}`,
          text: text,
        });
        setExportSuccess('Gedeeld!');
      } catch (err) {
        // Gebruiker heeft geannuleerd, geen error tonen
        if (err instanceof Error && err.name !== 'AbortError') {
          handleCopyToClipboard(text);
        }
      }
    } else {
      // Fallback: kopieer naar klembord
      handleCopyToClipboard(text);
    }
    setShowExportMenu(false);
  }

  async function handleWhatsApp() {
    const text = buildPackListText();
    if (!text) return;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setShowExportMenu(false);
  }

  async function handleCopyToClipboard(textOverride?: string) {
    const text = textOverride || buildPackListText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setExportSuccess('Gekopieerd naar klembord!');
    } catch {
      // Fallback voor oudere browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setExportSuccess('Gekopieerd naar klembord!');
    }
    setShowExportMenu(false);
    setTimeout(() => setExportSuccess(''), 3000);
  }

  function handleDownloadTxt() {
    const text = buildPackListText();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paklijst-${trip?.destination?.toLowerCase().replace(/\s+/g, '-') || 'reis'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    setExportSuccess('Bestand gedownload!');
    setTimeout(() => setExportSuccess(''), 3000);
  }

  if (!trip) return null;

  const totalItems = packList?.reduce((sum, cat) => sum + cat.items.length, 0) || 0;
  const checkedItems = packList?.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.checked).length,
    0
  ) || 0;
  const essentialMissing = packList?.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.essential && !i.checked).length,
    0
  ) || 0;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const days = Math.ceil(
    (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Je Paklijst 📋</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-6">
          <span className="bg-gray-100 px-3 py-1 rounded-full">📍 {trip.destination}{trip.country ? `, ${trip.country}` : ''}</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full">📅 {days} {days === 1 ? 'dag' : 'dagen'}</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full">
            {new Date(trip.departureDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - {new Date(trip.returnDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {packList && packList.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {checkedItems} van {totalItems} ingepakt
            </span>
            <span className={`text-sm font-bold ${progress === 100 ? 'text-green-600' : 'text-primary-600'}`}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : 'bg-gradient-to-r from-primary-400 to-primary-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 ? (
            <p className="mt-3 text-sm text-green-600 font-medium text-center">
              🎉 Alles ingepakt! Goede reis!
            </p>
          ) : essentialMissing > 0 ? (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Nog {essentialMissing} essenti&euml;le {essentialMissing === 1 ? 'item' : 'items'} niet ingepakt
            </p>
          ) : null}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="relative mb-6">
            <div className="text-6xl animate-pulse-gentle">🧳</div>
            <div className="absolute -bottom-1 -right-1 text-2xl animate-bounce">✨</div>
          </div>
          <p className="text-lg text-gray-700 font-semibold mb-1">AI genereert je paklijst...</p>
          <p className="text-sm text-gray-400">We analyseren het weer, je reistype en persoonlijke items</p>
          <div className="mt-6 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-xl">😕</span>
            <div className="flex-1">
              <p className="font-medium text-red-700 mb-1">Er ging iets mis</p>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => { generated.current = false; generateList(); }}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                🔄 Probeer opnieuw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pack List */}
      {packList && packList.length > 0 && (
        <div className="space-y-3">
          {packList.map((category, catIndex) => {
            const catChecked = category.items.filter((i) => i.checked).length;
            const catTotal = category.items.length;
            const isExpanded = expandedCategories.has(catIndex);
            const allChecked = catChecked === catTotal;

            return (
              <div
                key={catIndex}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden animate-slide-up transition-colors ${
                  allChecked ? 'border-green-100' : 'border-gray-100'
                }`}
                style={{ animationDelay: `${catIndex * 0.04}s` }}
              >
                <button
                  onClick={() => toggleCategory(catIndex)}
                  className="w-full px-5 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-semibold text-gray-700 flex-1 text-left">{category.name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    allChecked
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {catChecked}/{catTotal}
                  </span>
                  <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-50">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                          item.checked ? 'bg-gray-50/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleItem(catIndex, item.id)}
                              className="w-5 h-5 rounded-lg border-2 border-gray-300 text-primary-500 focus:ring-primary-400 transition-colors"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm transition-all ${
                                  item.checked ? 'line-through text-gray-400' : 'text-gray-700'
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                                  {item.quantity}x
                                </span>
                              )}
                              {item.essential && !item.checked && (
                                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                                  essentieel
                                </span>
                              )}
                              {item.note === 'Handmatig toegevoegd' && (
                                <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-medium">
                                  eigen
                                </span>
                              )}
                            </div>
                            {item.note && item.note !== 'Handmatig toegevoegd' && !item.checked && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                💡 {item.note}
                              </p>
                            )}
                          </div>
                        </label>
                        {item.note === 'Handmatig toegevoegd' && (
                          <button
                            onClick={() => removePackListItem(catIndex, item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors text-sm flex-shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Handmatig item toevoegen */}
                    {showAddItem === catIndex ? (
                      <div className="px-5 py-3 bg-primary-50/30 flex items-center gap-2">
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="Item naam..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-1 focus:ring-primary-100 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newItemName.trim()) {
                              addPackListItem(catIndex, newItemName.trim(), newItemQty);
                              setNewItemName('');
                              setNewItemQty(1);
                            }
                            if (e.key === 'Escape') {
                              setShowAddItem(null);
                              setNewItemName('');
                              setNewItemQty(1);
                            }
                          }}
                        />
                        <select
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Number(e.target.value))}
                          className="px-2 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={n} value={n}>{n}x</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            if (newItemName.trim()) {
                              addPackListItem(catIndex, newItemName.trim(), newItemQty);
                              setNewItemName('');
                              setNewItemQty(1);
                            }
                          }}
                          disabled={!newItemName.trim()}
                          className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => { setShowAddItem(null); setNewItemName(''); setNewItemQty(1); }}
                          className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddItem(catIndex)}
                        className="w-full px-5 py-2.5 text-left text-xs text-gray-400 hover:text-primary-600 hover:bg-primary-50/30 transition-colors"
                      >
                        + Item toevoegen aan {category.name.toLowerCase()}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Export success message */}
          {exportSuccess && (
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
              <span>✅</span> {exportSuccess}
            </div>
          )}

          {/* Export / Share */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full px-4 py-3.5 bg-white border-2 border-primary-200 text-primary-700 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
            >
              📤 Paklijst delen of opslaan
            </button>

            {showExportMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                {/* Menu */}
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-fade-in">
                  <button
                    onClick={handleWhatsApp}
                    className="w-full px-5 py-3.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">💬</span>
                    <div>
                      <div className="font-medium text-gray-800">Delen via WhatsApp</div>
                      <div className="text-xs text-gray-400">Stuur de paklijst naar iemand</div>
                    </div>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full px-5 py-3.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-50"
                  >
                    <span className="text-xl">📱</span>
                    <div>
                      <div className="font-medium text-gray-800">Delen via...</div>
                      <div className="text-xs text-gray-400">Kies een app om mee te delen</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard()}
                    className="w-full px-5 py-3.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-50"
                  >
                    <span className="text-xl">📋</span>
                    <div>
                      <div className="font-medium text-gray-800">Kopieer naar klembord</div>
                      <div className="text-xs text-gray-400">Plak het waar je wilt</div>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="w-full px-5 py-3.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-50"
                  >
                    <span className="text-xl">💾</span>
                    <div>
                      <div className="font-medium text-gray-800">Opslaan als bestand</div>
                      <div className="text-xs text-gray-400">Download als .txt bestand</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4">
            <button
              onClick={() => { generated.current = false; generateList(); }}
              disabled={loading}
              className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Genereren...
                </>
              ) : (
                <>🔄 Opnieuw genereren</>
              )}
            </button>
            <Link
              href="/scan"
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium text-center shadow-lg shadow-primary-500/20 hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-2"
            >
              📸 Scan je koffer
            </Link>
          </div>
        </div>
      )}

      {/* No weather yet */}
      {!loading && !error && !weather && (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-5xl mb-4">🌤️</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Weerdata nodig</h2>
          <p className="text-gray-500 mb-6">We moeten eerst het weer ophalen voor je bestemming</p>
          <Link
            href="/trip"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            ← Terug naar reisdetails
          </Link>
        </div>
      )}
    </div>
  );
}
