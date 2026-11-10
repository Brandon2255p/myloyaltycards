'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LoyaltyCard, COMPANY_NAMES } from '@/types/loyalty-card';
import { parseCardsFromImportUrl } from '@/lib/url-utils';
import { getCachedCards, setCachedCards } from '@/lib/storage';
import { mergeImportedCards } from '@/lib/backup-file';
import { getCardColor } from '@/lib/card-colors';

const cardKey = (card: Pick<LoyaltyCard, 'company' | 'cardNumber'>) => `${card.company}:${card.cardNumber}`;

const plural = (n: number) => `${n} card${n === 1 ? '' : 's'}`;

/** Groups all-digit numbers in fours so they are easier to check against the physical card. */
function formatNumber(cardNumber: string): string {
  return /^\d+$/.test(cardNumber) ? cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') : cardNumber;
}

function Header({ subtitle }: { subtitle?: string }) {
  return (
    <header className="shrink-0 px-5 pb-3" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <Image src="/logo.svg" alt="" width={44} height={44} priority className="rounded-xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">Import cards</h1>
          {subtitle && <p className="text-[13px] text-base-content/60">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

function StatusScreen({
  tone,
  title,
  body,
  children,
}: {
  tone: 'success' | 'empty';
  title: string;
  body: string;
  children: ReactNode;
}) {
  const success = tone === 'success';
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-base-200">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-10 text-center">
        <div
          className={`relative mb-8 flex h-[220px] w-[220px] items-center justify-center rounded-full ${
            success ? 'bg-emerald-500/10' : 'bg-base-content/10'
          }`}
        >
          <Image
            src="/logo.svg"
            alt=""
            width={128}
            height={128}
            className={`rounded-[30px] shadow-xl ${success ? '' : 'opacity-60 grayscale'}`}
          />
          <span
            className={`absolute bottom-7 right-7 flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg ring-4 ring-base-100 ${
              success ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
            aria-hidden="true"
          >
            {success ? (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            ) : (
              <span className="text-[32px] font-bold leading-none">?</span>
            )}
          </span>
        </div>
        <h2 className="mb-2 text-2xl font-bold">{title}</h2>
        <p className="max-w-xs text-[15px] leading-relaxed text-base-content/60">{body}</p>
      </main>
      <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">{children}</div>
      </div>
    </div>
  );
}

export default function ImportPage() {
  const [importCards, setImportCards] = useState<LoyaltyCard[]>([]);
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ added: number; alreadySaved: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Drop malformed entries, retailers this app doesn't know, and repeats within the link itself.
    const seen = new Set<string>();
    const urlCards = parseCardsFromImportUrl().filter((card) => {
      if (!(card.company in COMPANY_NAMES) || !card.cardNumber || seen.has(cardKey(card))) return false;
      seen.add(cardKey(card));
      return true;
    });
    const existing = new Set(getCachedCards().map(cardKey));
    setImportCards(urlCards);
    setExistingKeys(existing);
    setSelected(new Set(urlCards.map(cardKey).filter((key) => !existing.has(key))));
    setMounted(true);
  }, []);

  const newCards = importCards.filter((card) => !existingKeys.has(cardKey(card)));
  const alreadySaved = importCards.length - newCards.length;
  const allSelected = newCards.length > 0 && selected.size === newCards.length;

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(newCards.map(cardKey)));
  };

  const openApp = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleImport = () => {
    // Re-read storage so cards added in another tab since this page loaded are kept.
    const chosen = newCards.filter((card) => selected.has(cardKey(card)));
    const { cards, added } = mergeImportedCards(getCachedCards(), chosen);
    setCachedCards(cards);
    setResult({ added, alreadySaved });
  };

  if (!mounted) {
    return (
      <div className="h-dvh flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (result) {
    const savedNote = result.alreadySaved
      ? ` ${plural(result.alreadySaved)} ${result.alreadySaved === 1 ? 'was' : 'were'} already in your wallet.`
      : '';
    return (
      <StatusScreen
        tone="success"
        title={`${plural(result.added)} added`}
        body={`${result.added === 1 ? 'It’s' : 'They’re'} saved on this phone and ready to scan at the till.${savedNote}`}
      >
        <button type="button" className="btn-brand h-14 w-full text-[17px]" onClick={openApp}>
          Open my cards
        </button>
      </StatusScreen>
    );
  }

  if (importCards.length === 0) {
    return (
      <StatusScreen
        tone="empty"
        title="Nothing to import"
        body="This link doesn’t contain any cards. Ask the sender to share their cards again."
      >
        <button type="button" className="btn-brand h-14 w-full text-[17px]" onClick={openApp}>
          Open my cards
        </button>
      </StatusScreen>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-base-200">
      <Header subtitle={`${plural(importCards.length)} shared with you`} />

      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-2">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex min-h-8 items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              {newCards.length === 0
                ? 'All already in your wallet'
                : `${selected.size} of ${plural(newCards.length).replace(/^\d+ /, `${newCards.length} new `)} selected`}
            </p>
            {newCards.length > 0 && (
              <button type="button" className="h-8 text-sm font-semibold text-sky-700" onClick={toggleAll}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>

          <ul className="space-y-2.5">
            {importCards.map((card) => {
              const key = cardKey(card);
              const saved = existingKeys.has(key);
              const checked = selected.has(key);
              const name = COMPANY_NAMES[card.company] ?? card.company;
              return (
                <li key={key}>
                  <label
                    className={`flex min-h-[72px] items-center gap-3 rounded-2xl border border-base-300 px-3.5 py-3 ${
                      saved ? 'bg-base-100/60' : 'cursor-pointer bg-base-100 active:bg-base-200'
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${saved ? 'opacity-45' : ''}`}
                      style={{ backgroundColor: getCardColor(card.company) }}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 20 16" className="h-4 w-5" fill="currentColor">
                        <path d="M0 0h2v16H0zM4 0h1v16H4zM7 0h3v16H7zM12 0h1v16h-1zM15 0h2v16h-2zM19 0h1v16h-1z" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[15px] font-semibold ${saved ? 'text-base-content/50' : ''}`}>
                        {name}
                      </span>
                      <span className={`block truncate text-[13px] ${saved ? 'text-base-content/50' : 'text-base-content/60'}`}>
                        {saved
                          ? 'Already in your wallet'
                          : `${formatNumber(card.cardNumber)} · ${card.barcodeType === 'qr' ? 'QR code' : 'Barcode'}`}
                      </span>
                    </span>
                    {saved ? (
                      <span className="shrink-0 rounded-full bg-base-200 px-3 py-1 text-xs font-semibold text-base-content/60">
                        Saved
                      </span>
                    ) : (
                      <>
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={checked}
                          onChange={() => toggle(key)}
                          aria-label={`Import ${name}`}
                        />
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-600 ${
                            checked ? 'bg-gradient-to-b from-[#1a9bf0] to-[#0052a3]' : 'border-2 border-base-300 bg-base-100'
                          }`}
                          aria-hidden="true"
                        >
                          {checked && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12.5l4.5 4.5L19 7" />
                            </svg>
                          )}
                        </span>
                      </>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </main>

      <div
        className="shrink-0 border-t border-base-300 bg-base-100 px-5 pt-4 shadow-[0_-4px_16px_rgba(11,37,69,0.08)]"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-1">
          {newCards.length === 0 ? (
            <button type="button" className="btn-brand mb-2 h-14 w-full text-[17px]" onClick={openApp}>
              Open my cards
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-brand h-14 w-full text-[17px]"
                disabled={selected.size === 0}
                onClick={handleImport}
              >
                {selected.size === 0 ? 'Select cards to import' : `Import ${plural(selected.size)}`}
              </button>
              <button type="button" className="h-11 px-4 text-[15px] font-semibold text-sky-700" onClick={openApp}>
                Not now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
