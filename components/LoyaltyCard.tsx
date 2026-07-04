'use client';

import { useRef, useCallback } from 'react';
import { LoyaltyCard, COMPANY_NAMES, BarcodeType } from '@/types/loyalty-card';
import Barcode from './Barcode';

const BARCODE_TYPES: BarcodeType[] = ['bar', 'qr'];
const BARCODE_LABELS: Record<BarcodeType, string> = {
  bar: 'Barcode',
  qr: 'QR Code',
};

interface LoyaltyCardProps {
  card: LoyaltyCard;
  onDelete: (id: string) => void;
  onBarcodeTypeChange: (id: string, barcodeType: BarcodeType) => void;
}

function getNextBarcodeType(current: BarcodeType): BarcodeType {
  const idx = BARCODE_TYPES.indexOf(current);
  return BARCODE_TYPES[(idx + 1) % BARCODE_TYPES.length];
}

export default function LoyaltyCardComponent({ card, onDelete, onBarcodeTypeChange }: LoyaltyCardProps) {
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      onBarcodeTypeChange(card.id, getNextBarcodeType(card.barcodeType));
    }
    touchStartX.current = null;
  }, [card.id, card.barcodeType, onBarcodeTypeChange]);

  return (
    <div
      className="card bg-base-100 shadow-xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="card-body">
        <div className="flex justify-between items-center">
          <span className="card-title">{COMPANY_NAMES[card.company]}</span>
          <button
            onClick={() => onDelete(card.id)}
            className="btn btn-ghost btn-sm"
            aria-label="Delete card"
          >
            ✕
          </button>
        </div>
        <p className="font-mono text-2xl font-bold tracking-wider py-4">{card.cardNumber}</p>
        <div className="flex justify-center items-center gap-2 py-2 text-sm text-base-content/60">
          <span>← swipe →</span>
          <span className="font-medium text-base-content">{BARCODE_LABELS[card.barcodeType]}</span>
        </div>
        <div className="mt-2 p-4 bg-white rounded-lg">
          <Barcode value={card.cardNumber} type={card.barcodeType} />
        </div>
      </div>
    </div>
  );
}
