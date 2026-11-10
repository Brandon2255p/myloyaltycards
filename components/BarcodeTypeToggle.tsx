'use client';

import { BarcodeType } from '@/types/loyalty-card';

const OPTIONS: { value: BarcodeType; label: string }[] = [
  { value: 'bar', label: 'Barcode' },
  { value: 'qr', label: 'QR code' },
];

interface BarcodeTypeToggleProps {
  value: BarcodeType;
  onChange: (value: BarcodeType) => void;
}

export default function BarcodeTypeToggle({ value, onChange }: BarcodeTypeToggleProps) {
  return (
    <div role="group" aria-label="Show as" className="grid grid-cols-2 gap-1 rounded-xl bg-base-200 p-1">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
              active ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/60'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
