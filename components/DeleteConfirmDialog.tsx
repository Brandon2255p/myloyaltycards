'use client';

import { useEffect, useRef } from 'react';
import { COMPANY_NAMES, CompanyCode } from '@/types/loyalty-card';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  company: CompanyCode;
  cardNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  isOpen,
  company,
  cardNumber,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    onCancel();
  };

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Delete Card?</h3>
        <p className="py-4">
          Are you sure you want to delete the <strong>{COMPANY_NAMES[company]}</strong> card ending in{' '}
          <strong>{cardNumber.slice(-4)}</strong>?
        </p>
        <div className="modal-action">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={handleConfirm}>
            Delete
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
}
