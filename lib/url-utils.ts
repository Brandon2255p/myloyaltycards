import { LoyaltyCard, BarcodeType, CompanyCode } from '@/types/loyalty-card';

export function parseCardsFromUrl(): LoyaltyCard[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const params = new URLSearchParams(window.location.search);
  const cardsParam = params.get('cards');

  if (!cardsParam) {
    return [];
  }

  const cards: LoyaltyCard[] = cardsParam.split(',').map((cardStr) => {
    const parts = cardStr.split(':');
    const company = parts[0] as CompanyCode;
    const cardNumber = parts[1];
    const barcodeType = (parts[2] as BarcodeType) || 'bar';
    return {
      id: `${company}-${cardNumber}`,
      company,
      cardNumber,
      barcodeType,
    };
  });

  return cards;
}

export function cardsToUrlString(cards: LoyaltyCard[]): string {
  const cardsParam = cards.map((c) => `${c.company}:${c.cardNumber}:${c.barcodeType}`).join(',');
  const params = new URLSearchParams();
  if (cardsParam) {
    params.set('cards', cardsParam);
  }
  return `?${params.toString()}`;
}

export function updateUrl(cards: LoyaltyCard[]): void {
  if (typeof window === 'undefined') return;
  const newUrl = cardsToUrlString(cards);
  window.history.replaceState({}, '', newUrl);
}

export async function copyShareUrl(): Promise<void> {
  if (typeof window === 'undefined') return;
  await navigator.clipboard.writeText(window.location.href);
}
