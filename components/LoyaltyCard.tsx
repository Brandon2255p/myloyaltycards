'use client';

import { LoyaltyCard, COMPANY_NAMES } from '@/types/loyalty-card';
import { getCardColor } from '@/lib/card-colors';

interface LoyaltyCardProps {
  card: LoyaltyCard;
  onOpen: (id: string) => void;
}

export default function LoyaltyCardComponent({ card, onOpen }: LoyaltyCardProps) {
  const name = COMPANY_NAMES[card.company] ?? card.company;

  return (
    <button
      type="button"
      onClick={() => onOpen(card.id)}
      className="relative flex h-28 w-full flex-col items-start overflow-hidden rounded-2xl p-3.5 text-left text-white shadow-md transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      style={{ backgroundColor: getCardColor(card.company) }}
      aria-label={`Show ${name} card ending ${card.cardNumber.slice(-4)}`}
    >
      <span aria-hidden="true" className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10" />
      <span className="relative block text-[15px] font-bold leading-tight line-clamp-2">{name}</span>
      <span className="absolute bottom-3.5 left-3.5 text-[13px] font-semibold tracking-wide text-white/90">
        •••• {card.cardNumber.slice(-4)}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 34 22"
        className="absolute bottom-3.5 right-3.5 h-[22px] w-[34px] fill-white"
      >
        {card.barcodeType === 'qr' ? (
          <path d="M6 0h9v9H6zM8.5 2.5v4h4v-4zM19 0h9v9h-9zM21.500 2.500v4h4v-4zM6 13h9v9H6zM8.500 15.500v4h4v-4zM19 13h4v4h-4zM24 18h4v4h-4z" fillRule="evenodd" />
        ) : (
          <path d="M0 0h2v22h-2zM5 0h3v22h-3zM13 0h6v22h-6zM21 0h6v22h-6zM29 0h4v22h-4z" />
        )}
      </svg>
    </button>
  );
}
