'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { LoyaltyCard, CompanyCode, BarcodeType } from '@/types/loyalty-card';
import { parseCardsFromImportUrl } from '@/lib/url-utils';
import { getCachedCards, setCachedCards } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
  const [importCards, setImportCards] = useState<LoyaltyCard[]>([]);
  const [existingCards, setExistingCards] = useState<LoyaltyCard[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const urlCards = parseCardsFromImportUrl();
    const cached = getCachedCards();
    setImportCards(urlCards);
    setExistingCards(cached);
    setMounted(true);

    if (urlCards.length === 0) {
      setShowSkipWarning(true);
    }
  }, []);

  const handleImportCard = useCallback((card: LoyaltyCard) => {
    const newCard: LoyaltyCard = {
      ...card,
      id: `${card.company}-${card.cardNumber}-${Date.now()}`,
    };
    const updated = [...existingCards, newCard];
    setExistingCards(updated);
    setCachedCards(updated);
    setImportCards((prev) => prev.filter((c) => c.id !== card.id));
  }, [existingCards]);

  const handleImportAll = useCallback(() => {
    const newCards = importCards.map((card) => ({
      ...card,
      id: `${card.company}-${card.cardNumber}-${Date.now()}`,
    }));
    const updated = [...existingCards, ...newCards];
    setCachedCards(updated);
    router.push('/');
  }, [importCards, existingCards, router]);

  const handleSkip = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleOpenApp = useCallback(() => {
    window.location.href = '/';
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (showSkipWarning || importCards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-base-200">
        <Image src="/logo.svg" alt="My Loyalty Cards logo" width={72} height={72} className="mb-4" />
        <div className="card bg-base-100 shadow-xl max-w-sm w-full">
          <div className="card-body items-center text-center">
            <h1 className="text-xl font-bold">No Cards to Import</h1>
            <p className="text-base-content/60 mt-2">
              This link doesn&apos;t contain any cards to import.
            </p>
            <div className="card-actions mt-4">
              <button className="btn btn-primary" onClick={handleOpenApp}>
                Open App
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-base-200">
      <header className="navbar bg-base-100 shadow-sm px-6 py-4 shrink-0">
        <div className="flex-1 flex items-center gap-3">
          <Image src="/logo.svg" alt="My Loyalty Cards logo" width={48} height={48} />
          <div>
            <h1 className="text-xl font-bold">Import Cards</h1>
            <p className="text-xs text-base-content/60">{importCards.length} card(s) to import</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <div className="bg-info/10 border border-info/30 rounded-lg p-3 mb-4 text-sm">
            <p className="text-info">
              You can import each card individually, or import all at once.
              Your existing cards will not be affected.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {importCards.map((card) => (
              <div key={card.id} className="card bg-base-100 shadow">
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{card.company}</p>
                      <p className="text-sm text-base-content/60 font-mono">{card.cardNumber}</p>
                      <p className="text-xs text-base-content/50 capitalize">{card.barcodeType}</p>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleImportCard(card)}
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button className="btn btn-primary w-full" onClick={handleImportAll}>
              Import All ({importCards.length})
            </button>
            <button className="btn w-full" onClick={handleSkip}>
              Skip & Open App
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
