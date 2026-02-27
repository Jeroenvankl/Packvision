'use client';

import { useState } from 'react';
import { usePackVision } from '@/context/PackVisionContext';
import {
  PersonalItem,
  PersonalItemCategory,
  PERSONAL_ITEM_CATEGORIES,
  ITEM_SUGGESTIONS,
} from '@/lib/types';

export default function ItemsPage() {
  const { personalItems, addPersonalItem, removePersonalItem, updatePersonalItem } = usePackVision();
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<PersonalItemCategory>('tech');
  const [showSuggestions, setShowSuggestions] = useState<PersonalItemCategory | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: PersonalItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      alwaysBring: true,
    };
    addPersonalItem(item);
    setNewItemName('');
  }

  function handleAddSuggestion(name: string, category: PersonalItemCategory) {
    if (personalItems.some((i) => i.name.toLowerCase() === name.toLowerCase())) return;
    const item: PersonalItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      category,
      alwaysBring: true,
    };
    addPersonalItem(item);
  }

  const categorized = Object.entries(PERSONAL_ITEM_CATEGORIES).map(([key, meta]) => ({
    key: key as PersonalItemCategory,
    ...meta,
    items: personalItems.filter((i) => i.category === key),
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mijn Items 🎒</h1>
        <p className="text-gray-500 mb-8">
          Voeg je persoonlijke must-haves toe. Deze worden meegenomen in elke paklijst.
        </p>
      </div>

      {/* Add Item Form */}
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 animate-slide-up"
      >
        <h2 className="font-semibold text-gray-700 mb-4">➕ Nieuw item toevoegen</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="bijv. Powerbank, Medicijnen..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as PersonalItemCategory)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white transition-all"
          >
            {Object.entries(PERSONAL_ITEM_CATEGORIES).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.icon} {meta.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newItemName.trim()}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Toevoegen
          </button>
        </div>
      </form>

      {/* Suggestions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-semibold text-gray-700 mb-4">💡 Suggesties</h2>
        <p className="text-sm text-gray-400 mb-4">Klik op een categorie om suggesties te zien</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(PERSONAL_ITEM_CATEGORIES).map(([key, meta]) => (
            <button
              key={key}
              onClick={() =>
                setShowSuggestions(showSuggestions === key ? null : (key as PersonalItemCategory))
              }
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showSuggestions === key
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                  : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {ITEM_SUGGESTIONS[showSuggestions].map((name) => {
              const alreadyAdded = personalItems.some(
                (i) => i.name.toLowerCase() === name.toLowerCase()
              );
              return (
                <button
                  key={name}
                  onClick={() => handleAddSuggestion(name, showSuggestions)}
                  disabled={alreadyAdded}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    alreadyAdded
                      ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200'
                  }`}
                >
                  {alreadyAdded ? '✓' : '+'} {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Items by Category */}
      <div className="space-y-4">
        {categorized
          .filter((cat) => cat.items.length > 0)
          .map((cat, index) => (
            <div
              key={cat.key}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${(index + 2) * 0.05}s` }}
            >
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">
                  {cat.icon} {cat.label}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({cat.items.length})
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.alwaysBring}
                        onChange={() =>
                          updatePersonalItem({ ...item, alwaysBring: !item.alwaysBring })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary-500"
                      />
                      <span className="text-xs text-gray-400">Altijd mee</span>
                    </label>
                    <button
                      onClick={() => removePersonalItem(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      title="Verwijderen"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {personalItems.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <div className="text-4xl mb-3">🎒</div>
          <p className="text-gray-500">
            Nog geen items toegevoegd. Gebruik de suggesties hierboven of voeg je eigen items toe!
          </p>
        </div>
      )}
    </div>
  );
}
