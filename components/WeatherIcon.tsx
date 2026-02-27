'use client';

import React from 'react';

const icons: Record<string, React.ReactNode> = {
  sun: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <circle cx="32" cy="32" r="14" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="3" strokeLinecap="round">
        <line x1="32" y1="4" x2="32" y2="12" />
        <line x1="32" y1="52" x2="32" y2="60" />
        <line x1="4" y1="32" x2="12" y2="32" />
        <line x1="52" y1="32" x2="60" y2="32" />
        <line x1="12.2" y1="12.2" x2="17.9" y2="17.9" />
        <line x1="46.1" y1="46.1" x2="51.8" y2="51.8" />
        <line x1="12.2" y1="51.8" x2="17.9" y2="46.1" />
        <line x1="46.1" y1="17.9" x2="51.8" y2="12.2" />
      </g>
    </svg>
  ),
  'partly-cloudy': (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <circle cx="24" cy="24" r="10" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
        <line x1="24" y1="6" x2="24" y2="11" />
        <line x1="24" y1="37" x2="24" y2="42" />
        <line x1="6" y1="24" x2="11" y2="24" />
        <line x1="11.3" y1="11.3" x2="14.8" y2="14.8" />
      </g>
      <path d="M48 44H18a10 10 0 0 1-1.5-19.9A14 14 0 0 1 42 28a10 10 0 0 1 6 16z" fill="#94A3B8" />
      <path d="M48 44H18a10 10 0 0 1-1.5-19.9A14 14 0 0 1 42 28a10 10 0 0 1 6 16z" fill="#CBD5E1" opacity="0.6" />
    </svg>
  ),
  cloudy: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <path d="M52 42H16a12 12 0 0 1-1.8-23.9A16 16 0 0 1 44 24a12 12 0 0 1 8 18z" fill="#94A3B8" />
      <path d="M52 42H16a12 12 0 0 1-1.8-23.9A16 16 0 0 1 44 24a12 12 0 0 1 8 18z" fill="#CBD5E1" opacity="0.5" />
    </svg>
  ),
  rain: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <path d="M50 36H16a10 10 0 0 1-1.5-19.9A14 14 0 0 1 40 20a10 10 0 0 1 10 16z" fill="#94A3B8" />
      <g stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round">
        <line x1="20" y1="42" x2="18" y2="50" />
        <line x1="28" y1="42" x2="26" y2="50" />
        <line x1="36" y1="42" x2="34" y2="50" />
        <line x1="44" y1="42" x2="42" y2="50" />
        <line x1="24" y1="52" x2="22" y2="58" />
        <line x1="32" y1="52" x2="30" y2="58" />
        <line x1="40" y1="52" x2="38" y2="58" />
      </g>
    </svg>
  ),
  drizzle: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <path d="M50 36H16a10 10 0 0 1-1.5-19.9A14 14 0 0 1 40 20a10 10 0 0 1 10 16z" fill="#94A3B8" />
      <g stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4">
        <line x1="22" y1="42" x2="20" y2="54" />
        <line x1="32" y1="42" x2="30" y2="54" />
        <line x1="42" y1="42" x2="40" y2="54" />
      </g>
    </svg>
  ),
  snow: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <path d="M50 36H16a10 10 0 0 1-1.5-19.9A14 14 0 0 1 40 20a10 10 0 0 1 10 16z" fill="#94A3B8" />
      <g fill="#BFDBFE">
        <circle cx="20" cy="44" r="2" />
        <circle cx="32" cy="46" r="2" />
        <circle cx="44" cy="44" r="2" />
        <circle cx="26" cy="54" r="2" />
        <circle cx="38" cy="52" r="2" />
      </g>
    </svg>
  ),
  storm: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <path d="M50 32H16a10 10 0 0 1-1.5-19.9A14 14 0 0 1 40 16a10 10 0 0 1 10 16z" fill="#64748B" />
      <polygon points="30,34 24,48 32,48 28,60 42,42 34,42 38,34" fill="#FBBF24" />
    </svg>
  ),
  fog: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
        <line x1="12" y1="24" x2="52" y2="24" />
        <line x1="16" y1="32" x2="48" y2="32" opacity="0.7" />
        <line x1="12" y1="40" x2="52" y2="40" opacity="0.5" />
        <line x1="16" y1="48" x2="48" y2="48" opacity="0.3" />
      </g>
    </svg>
  ),
};

export default function WeatherIcon({ type, size = 40 }: { type: string; size?: number }) {
  const icon = icons[type] || icons.sun;
  return <div style={{ width: size, height: size }}>{icon}</div>;
}
