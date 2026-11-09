import { LoyaltyCard, BarcodeType, CompanyCode, COMPANY_NAMES } from '@/types/loyalty-card';

const FILE_FORMAT = 'myloyaltycards-backup';
const FILE_VERSION = 1;

interface BackupFileCard {
  company: CompanyCode;
  cardNumber: string;
  barcodeType: BarcodeType;
}

interface BackupFile {
  format: typeof FILE_FORMAT;
  version: number;
  exportedAt: string;
  cards: BackupFileCard[];
}

export interface ParsedBackup {
  cards: BackupFileCard[];
  invalid: number;
}

export function downloadCardsFile(cards: LoyaltyCard[]): void {
  const data: BackupFile = {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    cards: cards.map(({ company, cardNumber, barcodeType }) => ({ company, cardNumber, barcodeType })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loyalty-cards-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isCompanyCode(value: unknown): value is CompanyCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(COMPANY_NAMES, value);
}

/** Parses a backup file's text. Throws if the file isn't a recognisable backup. */
export function parseCardsFile(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid backup (could not read JSON).');
  }

  const rawCards = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { cards?: unknown }).cards)
      ? (data as { cards: unknown[] }).cards
      : null;

  if (!rawCards) {
    throw new Error('This file does not contain any loyalty cards.');
  }

  const cards: BackupFileCard[] = [];
  let invalid = 0;
  for (const raw of rawCards) {
    if (!raw || typeof raw !== 'object') {
      invalid++;
      continue;
    }
    const { company, cardNumber, barcodeType } = raw as Record<string, unknown>;
    const number = typeof cardNumber === 'string' ? cardNumber.trim() : typeof cardNumber === 'number' ? String(cardNumber) : '';
    if (!isCompanyCode(company) || !number) {
      invalid++;
      continue;
    }
    cards.push({
      company,
      cardNumber: number,
      barcodeType: barcodeType === 'qr' ? 'qr' : 'bar',
    });
  }

  return { cards, invalid };
}

/** Merges imported cards into existing ones, skipping duplicates (same company + number). */
export function mergeImportedCards(
  existing: LoyaltyCard[],
  imported: BackupFileCard[],
): { cards: LoyaltyCard[]; added: number; duplicates: number } {
  const seen = new Set(existing.map((c) => `${c.company}:${c.cardNumber}`));
  const now = Date.now();
  const added: LoyaltyCard[] = [];
  let duplicates = 0;
  imported.forEach((card, i) => {
    const key = `${card.company}:${card.cardNumber}`;
    if (seen.has(key)) {
      duplicates++;
      return;
    }
    seen.add(key);
    added.push({ ...card, id: `${card.company}-${card.cardNumber}-${now}-${i}` });
  });
  return { cards: [...existing, ...added], added: added.length, duplicates };
}
