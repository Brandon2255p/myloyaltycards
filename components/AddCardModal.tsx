'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CompanyCode, BarcodeType, COMPANY_NAMES, COMPANY_SEARCH_TERMS } from '@/types/loyalty-card';
import Barcode from './Barcode';

const BARCODE_TYPES: BarcodeType[] = ['code128', 'qr', 'ean13'];
const BARCODE_LABELS: Record<BarcodeType, string> = {
  code128: 'Code 128',
  qr: 'QR Code',
  ean13: 'EAN-13',
};

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (company: CompanyCode, cardNumber: string, barcodeType: BarcodeType) => void;
}

function getNextBarcodeType(current: BarcodeType): BarcodeType {
  const idx = BARCODE_TYPES.indexOf(current);
  return BARCODE_TYPES[(idx + 1) % BARCODE_TYPES.length];
}

export default function AddCardModal({ isOpen, onClose, onAdd }: AddCardModalProps) {
  const [company, setCompany] = useState<CompanyCode>('pnp');
  const [cardNumber, setCardNumber] = useState('');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('code128');
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

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
      setBarcodeType('code128');
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

  const handleClose = () => {
    onClose();
  };

  const cycleBarcodeType = useCallback(() => {
    setBarcodeType((prev) => getNextBarcodeType(prev));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      cycleBarcodeType();
    }
    touchStartX.current = null;
  };

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Add Loyalty Card</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Retailer / Programme</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                ref={searchInputRef}
                type="text"
                className="input input-bordered w-full pr-10"
                placeholder="Search retailers..."
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
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Card Number</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Enter card number"
              autoFocus
            />
          </div>

          {cardNumber.trim() && (
            <div
              className="mb-6 cursor-pointer"
              onClick={cycleBarcodeType}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex justify-center items-center gap-2 py-2 text-sm text-base-content/60">
                <span>← swipe or tap →</span>
                <span className="font-medium text-base-content">{BARCODE_LABELS[barcodeType]}</span>
              </div>
              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <span className="card-title text-sm">{COMPANY_NAMES[company]}</span>
                  </div>
                  <p className="font-mono text-lg font-bold tracking-wider py-2">{cardNumber}</p>
                  <div className="p-3 bg-white rounded-lg">
                    <Barcode value={cardNumber} type={barcodeType} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!cardNumber.trim()}>
              Add Card
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
