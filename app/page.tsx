'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { LoyaltyCard, BarcodeType, CompanyCode } from '@/types/loyalty-card';
import { loadCards, updateUrl, copyShareUrl } from '@/lib/url-utils';
import LoyaltyCardComponent from '@/components/LoyaltyCard';
import AddCardModal from '@/components/AddCardModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import AddToHomeScreenBanner from '@/components/AddToHomeScreenBanner';
import ShareDialog from '@/components/ShareDialog';
import BackupDialog from '@/components/BackupDialog';

export default function Home() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; company: CompanyCode; cardNumber: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  useEffect(() => {
    const loadedCards = loadCards();
    setCards(loadedCards);
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
    <div className="h-dvh flex flex-col overflow-hidden">
      <header className="navbar bg-base-200 shadow-sm px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="My Loyalty Cards logo" width={72} height={72} className="text-base-content" />
            <h1 className="text-2xl font-bold">My Loyalty Cards</h1>
          </div>
          <div className="flex-none gap-2 flex items-center sm:ml-auto">
            {cards.length > 0 && (
              <>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowShareDialog(true)}
                  title="Share cards"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowBackupDialog(true)}
                  title="Backup cards"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Backup
                </button>
              </>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              + Add Card
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-safe">
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

      <AddToHomeScreenBanner />

      {deleteTarget && (
        <DeleteConfirmDialog
          isOpen={!!deleteTarget}
          company={deleteTarget.company}
          cardNumber={deleteTarget.cardNumber}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      <ShareDialog
        cards={cards}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />

      <BackupDialog
        cards={cards}
        isOpen={showBackupDialog}
        onClose={() => setShowBackupDialog(false)}
      />
    </div>
  );
}
