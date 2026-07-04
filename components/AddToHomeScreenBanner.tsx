'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function AddToHomeScreenBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (!isMobile || isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isDismissed]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;

    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    deferredPrompt.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="toast toast-top toast-center z-50">
      <div className="alert alert-shadow flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1">
          <span className="font-semibold">Add to Home Screen</span>
          <p className="text-sm opacity-70">Quick access from your home screen</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-ghost" onClick={handleDismiss}>
            Not now
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleInstall}>
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
