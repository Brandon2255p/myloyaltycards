'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoyaltyCard, COMPANY_NAMES } from '@/types/loyalty-card';
import { generateShareUrl } from '@/lib/storage';

interface ShareDialogProps {
  cards: LoyaltyCard[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareDialog({ cards, isOpen, onClose }: ShareDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(cards.map((c) => c.id)));
      setCopied(false);
    }
  }, [isOpen, cards]);

  useEffect(() => {
    const selectedCards = cards.filter((c) => selected.has(c.id));
    setShareUrl(generateShareUrl(selectedCards));
  }, [selected, cards]);

  const toggleCard = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(cards.map((c) => c.id)));
  }, [cards]);

  const selectNone = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Loyalty Cards',
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Share Cards</h3>
        <p className="text-sm text-base-content/70 mb-4">
          Select cards to share. Recipients will be able to import selected cards.
        </p>

        <div className="flex gap-2 mb-4">
          <button className="btn btn-xs" onClick={selectAll}>Select All</button>
          <button className="btn btn-xs" onClick={selectNone}>Select None</button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {cards.map((card) => (
            <label
              key={card.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 cursor-pointer"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={selected.has(card.id)}
                onChange={() => toggleCard(card.id)}
              />
              <div className="flex-1">
                <p className="font-medium">{COMPANY_NAMES[card.company]}</p>
                <p className="text-sm text-base-content/60 font-mono">{card.cardNumber}</p>
              </div>
            </label>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1 text-sm font-mono"
                value={shareUrl}
                readOnly
              />
              <button
                className="btn btn-primary"
                onClick={handleCopy}
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            {'share' in navigator && (
              <button
                className="btn btn-outline w-full mt-2"
                onClick={handleNativeShare}
              >
                Share...
              </button>
            )}
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
