'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CompanyCode, BarcodeType, COMPANY_NAMES, COMPANY_SEARCH_TERMS } from '@/types/loyalty-card';
import Barcode from './Barcode';
import BarcodeTypeToggle from './BarcodeTypeToggle';
import CardScanner from './CardScanner';
import type { ScanResult } from '@/lib/scanner';

const QUICK_PICKS: { code: CompanyCode; label: string }[] = [
  { code: 'xts', label: 'Checkers' },
  { code: 'pnp', label: 'Pick n Pay' },
  { code: 'cls', label: 'Clicks' },
  { code: 'wlw', label: 'Woolworths' },
  { code: 'dch', label: 'Dis-Chem' },
];

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (company: CompanyCode, cardNumber: string, barcodeType: BarcodeType) => void;
}

export default function AddCardModal({ isOpen, onClose, onAdd }: AddCardModalProps) {
  const [company, setCompany] = useState<CompanyCode>('pnp');
  const [cardNumber, setCardNumber] = useState('');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('bar');
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSearch('');
      setShowDropdown(false);
      setCompany('pnp');
      setCardNumber('');
      setBarcodeType('bar');
      setIsScanning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCompanies = useMemo(() => {
    const allCompanies = Object.keys(COMPANY_NAMES) as CompanyCode[];
    if (!search.trim()) return allCompanies;
    const q = search.toLowerCase();
    return allCompanies.filter((code) => {
      const name = COMPANY_NAMES[code].toLowerCase();
      const terms = COMPANY_SEARCH_TERMS[code].toLowerCase();
      return name.includes(q) || terms.includes(q);
    });
  }, [search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.trim()) {
      onAdd(company, cardNumber.trim(), barcodeType);
      onClose();
    }
  };

  const handleScanResult = useCallback((result: ScanResult) => {
    setCardNumber(result.cardNumber);
    setBarcodeType(result.barcodeType);
    setIsScanning(false);
  }, []);

  const handleClose = () => {
    onClose();
  };

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={handleClose}>
      <div className="modal-box max-h-[92dvh] rounded-t-[28px] px-5 pt-3 sm:max-w-lg sm:rounded-[28px] pb-safe">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-base-300 sm:hidden" aria-hidden="true" />
        {isScanning && (
          <CardScanner onResult={handleScanResult} onCancel={() => setIsScanning(false)} />
        )}
        <div className={`mb-5 flex items-center justify-between ${isScanning ? 'hidden' : ''}`}>
          <h3 className="text-[22px] font-bold">Add a card</h3>
          <button type="button" className="h-11 px-2 text-[15px] font-semibold text-sky-700" onClick={handleClose}>
            Cancel
          </button>
        </div>
        <form onSubmit={handleSubmit} className={isScanning ? 'hidden' : ''}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Retailer or programme</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                ref={searchInputRef}
                type="text"
                className="input input-bordered h-13 w-full rounded-2xl pr-10 text-base placeholder:text-base-content"
                placeholder={COMPANY_NAMES[company]}
                aria-label={`Retailer, currently ${COMPANY_NAMES[company]}. Type to search`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm btn btn-ghost btn-xs"
                onClick={() => {
                  setShowDropdown((v) => !v);
                  if (!showDropdown) searchInputRef.current?.focus();
                }}
              >
                {showDropdown ? '▲' : '▼'}
              </button>
              {showDropdown && (
                <ul className="menu bg-base-100 rounded-box w-full mt-1 shadow-lg border border-base-300 max-h-60 overflow-y-auto absolute z-50">
                  {filteredCompanies.length === 0 ? (
                    <li className="py-2 px-4 text-base-content/50 text-sm">No retailers found</li>
                  ) : (
                    filteredCompanies.map((code) => (
                      <li key={code}>
                        <button
                          type="button"
                          className={`${company === code ? 'active' : ''}`}
                          onClick={() => {
                            setCompany(code);
                            setSearch('');
                            setShowDropdown(false);
                          }}
                        >
                          {COMPANY_NAMES[code]}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {QUICK_PICKS.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={company === code}
                  onClick={() => {
                    setCompany(code);
                    setSearch('');
                    setShowDropdown(false);
                  }}
                  className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold ${
                    company === code ? 'bg-sky-700 text-white' : 'bg-base-200 text-base-content/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Card number</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered h-13 min-w-0 flex-1 rounded-2xl text-[17px] font-semibold tracking-wide"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Card number"
                aria-label="Card number"
              />
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="flex h-13 shrink-0 items-center gap-2 rounded-2xl bg-neutral px-4 text-[15px] font-semibold text-neutral-content active:opacity-90"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M11 8v8M14 8v8M17 8v8" />
                </svg>
                Scan
              </button>
            </div>
          </div>

          <div className="mb-4">
            <span className="label label-text mb-1">Show as</span>
            <BarcodeTypeToggle value={barcodeType} onChange={setBarcodeType} />
          </div>

          {cardNumber.trim() && (
            <div data-theme="light" className="mb-5 rounded-2xl border border-base-300 bg-white p-4">
              <Barcode value={cardNumber.trim()} type={barcodeType} disableFullscreen />
            </div>
          )}

          <button type="submit" className="btn-brand h-14 w-full text-[17px]" disabled={!cardNumber.trim()}>
            Save card
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
