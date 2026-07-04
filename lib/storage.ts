import { LoyaltyCard } from '@/types/loyalty-card';

const STORAGE_KEY = 'loyalty-cards-cache';

export function getCachedCards(): LoyaltyCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];
    return JSON.parse(cached) as LoyaltyCard[];
  } catch {
    return [];
  }
}

export function setCachedCards(cards: LoyaltyCard[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Storage full or unavailable
  }
}

export function clearCachedCards(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function generateShareUrl(cards: LoyaltyCard[]): string {
  if (typeof window === 'undefined') return '';
  const baseUrl = window.location.origin;
  const cardsParam = cards.map((c) => `${c.company}:${c.cardNumber}:${c.barcodeType}`).join(',');
  return `${baseUrl}/import?cards=${encodeURIComponent(cardsParam)}`;
}

export function formatBackupMessage(cards: LoyaltyCard[]): string {
  const date = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const url = generateShareUrl(cards);
  return `My Loyalty Cards backup (${date}): ${url}`;
}

export function getWhatsAppLink(cards: LoyaltyCard[]): string {
  const message = formatBackupMessage(cards);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function getTelegramLink(cards: LoyaltyCard[]): string {
  const url = generateShareUrl(cards);
  return `https://t.me/share/url?url=${encodeURIComponent(url)}`;
}

export function getEmailLink(cards: LoyaltyCard[]): string {
  const subject = 'My Loyalty Cards Backup';
  const date = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const body = `My Loyalty Cards backup (${date}): ${generateShareUrl(cards)}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
