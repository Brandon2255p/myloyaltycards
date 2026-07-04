'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { LoyaltyCard, BarcodeType, CompanyCode } from '@/types/loyalty-card';
import { parseCardsFromUrl, updateUrl, copyShareUrl } from '@/lib/url-utils';
import LoyaltyCardComponent from '@/components/LoyaltyCard';
import AddCardModal from '@/components/AddCardModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

export default function Home() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; company: CompanyCode; cardNumber: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const parsedCards = parseCardsFromUrl();
    /* eslint-disable react-hooks/set-state-in-effect */
    setCards(parsedCards);
    /* eslint-enable react-hooks/set-state-in-effect */
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      updateUrl(cards);
    }
  }, [cards, mounted]);

  const handleAddCard = useCallback((company: CompanyCode, cardNumber: string, barcodeType: BarcodeType) => {
    const newCard: LoyaltyCard = {
      id: `${company}-${cardNumber}-${Date.now()}`,
      company,
      cardNumber,
      barcodeType,
    };
    setCards((prev) => [...prev, newCard]);
  }, []);

  const handleBarcodeTypeChange = useCallback((id: string, barcodeType: BarcodeType) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, barcodeType } : card
      )
    );
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      setDeleteTarget({ id, company: card.company, cardNumber: card.cardNumber });
    }
  }, [cards]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      setCards((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleShare = useCallback(async () => {
    await copyShareUrl();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="navbar bg-base-200 shadow-sm px-6 py-4 shrink-0">
        <div className="flex-1 flex items-center gap-3">
          <Image src="/logo.svg" alt="My Loyalty Cards logo" width={72} height={72} className="text-base-content" />
          <div>
            <h1 className="text-2xl font-bold">My Loyalty Cards</h1>
          </div>
        </div>
        <div className="flex-none gap-2">
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleShare}
            title="Share"
          >
            {copied ? '✓' : '📋'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            + Add Card
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <p className="text-4xl mb-4">🎴</p>
            <h2 className="text-xl font-semibold mb-2">No loyalty cards yet</h2>
            <p className="text-base-content/60 mb-4">Add your first card to get started</p>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              + Add Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {cards.map((card) => (
              <LoyaltyCardComponent
                key={card.id}
                card={card}
                onDelete={handleDeleteClick}
                onBarcodeTypeChange={handleBarcodeTypeChange}
              />
            ))}
          </div>
        )}
      </main>

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCard}
      />

      {deleteTarget && (
        <DeleteConfirmDialog
          isOpen={!!deleteTarget}
          company={deleteTarget.company}
          cardNumber={deleteTarget.cardNumber}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
