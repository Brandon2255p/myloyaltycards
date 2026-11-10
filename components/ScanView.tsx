'use client';

import { useCallback, useEffect, useRef } from 'react';
import { LoyaltyCard, COMPANY_NAMES, BarcodeType } from '@/types/loyalty-card';
import { getCardColor } from '@/lib/card-colors';
import Barcode from './Barcode';
import BarcodeTypeToggle from './BarcodeTypeToggle';

interface ScanViewProps {
  cards: LoyaltyCard[];
  cardId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onBarcodeTypeChange: (id: string, barcodeType: BarcodeType) => void;
}

const SWIPE_THRESHOLD = 50;

export default function ScanView({ cards, cardId, onSelect, onClose, onDelete, onBarcodeTypeChange }: ScanViewProps) {
  const touchStartX = useRef<number | null>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const index = cards.findIndex((c) => c.id === cardId);
  const card = cards[index];

  const go = useCallback(
    (step: number) => {
      if (cards.length < 2 || index < 0) return;
      onSelect(cards[(index + step + cards.length) % cards.length].id);
    },
    [cards, index, onSelect]
  );

  useEffect(() => {
    doneRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A native <dialog> (e.g. the delete confirmation) handles its own keys.
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go]);

  if (!card) return null;

  const name = COMPANY_NAMES[card.company] ?? card.company;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} card`}
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto text-white"
      style={{
        backgroundColor: getCardColor(card.company),
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) > SWIPE_THRESHOLD) go(delta < 0 ? 1 : -1);
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to all cards"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/20 active:bg-white/30"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            aria-label="Remove this card"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/20 active:bg-white/30"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <h2 className="mt-6 text-3xl font-bold leading-tight">{name}</h2>

        <div data-theme="light" className="mt-6 rounded-[28px] bg-white p-5 text-slate-900 shadow-2xl">
          <BarcodeTypeToggle value={card.barcodeType} onChange={(type) => onBarcodeTypeChange(card.id, type)} />
          <div className="mt-5">
            <Barcode value={card.cardNumber} type={card.barcodeType} disableFullscreen />
          </div>
          {card.barcodeType === 'qr' && (
            <p className="mt-4 break-all text-center text-xl font-semibold tracking-wider">{card.cardNumber}</p>
          )}
        </div>

        {cards.length > 1 && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2" aria-hidden="true">
              {cards.map((c, i) => (
                <span
                  key={c.id}
                  className={`h-1.5 rounded-full ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
            <p className="text-[13px] text-white/80">
              Swipe for your next card · {index + 1} of {cards.length}
            </p>
          </div>
        )}

        <button
          ref={doneRef}
          type="button"
          onClick={onClose}
          className="mt-auto h-14 w-full shrink-0 rounded-2xl bg-white text-[17px] font-bold text-slate-900 active:bg-white/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
