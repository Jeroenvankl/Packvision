import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { PackVisionProvider } from '@/context/PackVisionContext';

export const metadata: Metadata = {
  title: 'PackVision - Slimme Paklijst met AI',
  description: 'AI-gestuurde paklijst generator die rekening houdt met weer, bestemming en jouw persoonlijke items.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="antialiased">
        <PackVisionProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
            {children}
          </main>
        </PackVisionProvider>
      </body>
    </html>
  );
}
