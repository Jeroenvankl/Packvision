import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
      <div className="animate-fade-in">
        <div className="text-7xl mb-6 drop-shadow-sm">🧳</div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
            PackVision
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-2 max-w-2xl font-medium">
          Je slimme inpak-assistent met AI
        </p>
        <p className="text-gray-500 mb-12 max-w-xl leading-relaxed">
          Genereer de perfecte paklijst op basis van je bestemming, het weer en je persoonlijke voorkeuren.
          Scan je koffer en ontdek wat je vergeet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl mb-12">
        <div className="animate-slide-up bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group" style={{ animationDelay: '0.1s' }}>
          <div className="w-14 h-14 bg-cyan-50 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
            🌤️
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Slimme Paklijst</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            AI genereert je paklijst op basis van weer, bestemming en reistype
          </p>
        </div>
        <div className="animate-slide-up bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group" style={{ animationDelay: '0.2s' }}>
          <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
            📸
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Koffer Scanner</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Maak een foto van je spullen en AI vertelt wat je mist of vergeet
          </p>
        </div>
        <div className="animate-slide-up bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group" style={{ animationDelay: '0.3s' }}>
          <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
            🎒
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Persoonlijke Items</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Voeg je eigen must-haves toe zodat je ze nooit meer vergeet
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <Link
          href="/trip"
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 transition-all transform hover:-translate-y-0.5"
        >
          Start met inpakken ✈️
        </Link>
        <Link
          href="/items"
          className="text-gray-500 hover:text-primary-600 font-medium transition-colors text-sm"
        >
          Of stel eerst je items in →
        </Link>
      </div>

      {/* Subtle features list */}
      <div className="mt-16 flex flex-wrap justify-center gap-6 text-xs text-gray-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          Live weerdata
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
          Google Gemini AI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
          Vision foto-analyse
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          100% privacy - lokale opslag
        </span>
      </div>
    </div>
  );
}
