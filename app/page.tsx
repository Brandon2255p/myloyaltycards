'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { LoyaltyCard, BarcodeType, CompanyCode, COMPANY_NAMES, COMPANY_SEARCH_TERMS } from '@/types/loyalty-card';
import { loadCards, updateUrl, copyShareUrl } from '@/lib/url-utils';
import LoyaltyCardComponent from '@/components/LoyaltyCard';
import ScanView from '@/components/ScanView';
import AddCardModal from '@/components/AddCardModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import AddToHomeScreenBanner from '@/components/AddToHomeScreenBanner';
import ShareDialog from '@/components/ShareDialog';
import BackupDialog from '@/components/BackupDialog';
import { parseCardsFile, mergeImportedCards } from '@/lib/backup-file';

export default function Home() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; company: CompanyCode; cardNumber: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [scanCardId, setScanCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setScanCardId((current) => (current === deleteTarget.id ? null : current));
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const openImportPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { cards: imported, invalid } = parseCardsFile(await file.text());
      const { cards: merged, added, duplicates } = mergeImportedCards(cards, imported);
      setCards(merged);
      const parts: string[] = [];
      if (duplicates) parts.push(`${duplicates} already saved`);
      if (invalid) parts.push(`${invalid} unreadable`);
      const extra = parts.length ? ` (${parts.join(', ')})` : '';
      setToast({
        type: added ? 'success' : 'info',
        message: added
          ? `Imported ${added} card${added === 1 ? '' : 's'}${extra}.`
          : `No new cards to import${extra}.`,
      });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Could not import that file.' });
    }
  }, [cards]);

  const query = search.trim().toLowerCase();
  const visibleCards = query
    ? cards.filter((card) => {
        const name = (COMPANY_NAMES[card.company] ?? '').toLowerCase();
        const terms = (COMPANY_SEARCH_TERMS[card.company] ?? '').toLowerCase();
        return name.includes(query) || terms.includes(query) || card.cardNumber.toLowerCase().includes(query);
      })
    : cards;
  const hasCards = cards.length > 0;

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-base-200">
      <header
        className="shrink-0 px-5 pb-3"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Image src="/logo.svg" alt="" width={44} height={44} priority className="rounded-xl" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">My cards</h1>
            {hasCards && (
              <p className="text-[13px] text-base-content/60">
                {cards.length} card{cards.length === 1 ? '' : 's'} · tap one to scan
              </p>
            )}
          </div>
        </div>
        {hasCards && (
          <label className="mx-auto mt-4 flex h-12 max-w-3xl items-center gap-2.5 rounded-2xl border border-base-300 bg-base-100 px-4">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-base-content/50" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your cards"
              aria-label="Search your cards"
              className="h-full w-full min-w-0 bg-transparent text-base outline-none placeholder:text-base-content/50"
            />
          </label>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div className="mx-auto h-full max-w-3xl">
          {!hasCards ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Image src="/logo.svg" alt="" width={136} height={136} className="mb-8 rounded-[32px] shadow-xl" />
              <h2 className="mb-2 text-2xl font-bold">No cards yet</h2>
              <p className="max-w-xs text-[15px] leading-relaxed text-base-content/60">
                Add a loyalty card once, then scan it straight from your phone at the till.
              </p>
            </div>
          ) : visibleCards.length === 0 ? (
            <p className="py-16 text-center text-base-content/60">No cards match “{search.trim()}”.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleCards.map((card) => (
                <LoyaltyCardComponent key={card.id} card={card} onOpen={setScanCardId} />
              ))}
            </div>
          )}
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      {hasCards ? (
        <nav
          aria-label="Card actions"
          className="shrink-0 border-t border-base-300 bg-base-100 px-5 pt-2.5 shadow-[0_-4px_16px_rgba(11,37,69,0.08)]"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-1">
            <button type="button" className="bar-action" onClick={() => setShowShareDialog(true)}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button type="button" className="bar-action" onClick={() => setShowBackupDialog(true)}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Backup
            </button>
            <button type="button" className="bar-action" onClick={openImportPicker}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <button type="button" className="btn-brand ml-auto h-13 px-6" onClick={() => setIsAddModalOpen(true)}>
              + Add card
            </button>
          </div>
        </nav>
      ) : (
        <div
          className="shrink-0 px-5 pt-2"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <button type="button" className="btn-brand h-14 w-full text-[17px]" onClick={() => setIsAddModalOpen(true)}>
              + Add your first card
            </button>
            <button type="button" className="h-11 px-4 text-[15px] font-semibold text-sky-700" onClick={openImportPicker}>
              Restore from a backup file
            </button>
          </div>
        </div>
      )}

      {scanCardId && (
        <ScanView
          cards={visibleCards.some((c) => c.id === scanCardId) ? visibleCards : cards}
          cardId={scanCardId}
          onSelect={setScanCardId}
          onClose={() => setScanCardId(null)}
          onDelete={handleDeleteClick}
          onBarcodeTypeChange={handleBarcodeTypeChange}
        />
      )}

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

      {toast && (
        <div className="toast toast-top toast-center z-50" role="status">
          <div
            className={`alert ${
              toast.type === 'success' ? 'alert-success' : toast.type === 'error' ? 'alert-error' : 'alert-info'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
