'use client';

import { useEffect, useRef, useState } from 'react';
import { scanImage, preloadScanner, ScanResult } from '@/lib/scanner';

interface CardScannerProps {
  onResult: (result: ScanResult) => void;
  onCancel: () => void;
}

/** Longest edge of the frame handed to the decoder; larger frames only slow it down. */
const MAX_FRAME_SIZE = 1280;
const SCAN_INTERVAL_MS = 150;

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access was blocked. Allow camera access for this site, or scan from a photo instead.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera was found on this device. You can scan from a photo instead.';
  }
  if (name === 'NotReadableError') {
    return 'The camera is in use by another app. Close it and try again, or scan from a photo instead.';
  }
  return 'The camera could not be started. You can scan from a photo instead.';
}

export default function CardScanner({ onResult, onCancel }: CardScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onResultRef = useRef(onResult);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = async () => {
      const video = videoRef.current;
      if (stopped || !video || !ctx) return;

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        const scale = Math.min(1, MAX_FRAME_SIZE / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const result = await scanImage(ctx.getImageData(0, 0, canvas.width, canvas.height));
          if (stopped) return;
          if (result) {
            navigator.vibrate?.(50);
            onResultRef.current(result);
            return;
          }
        } catch {
          if (stopped) return;
          setError('The barcode scanner failed to load. Check your connection and try again.');
          return;
        }
      }
      timer = setTimeout(scanFrame, SCAN_INTERVAL_MS);
    };

    const start = async () => {
      preloadScanner();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException('Camera API unavailable', 'NotFoundError');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        if (stopped) return;
        setIsStarting(false);
        scanFrame();
      } catch (err) {
        if (stopped) return;
        setIsStarting(false);
        setError(cameraErrorMessage(err));
      }
    };

    start();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoMessage('Reading photo…');
    try {
      const result = await scanImage(file);
      if (result) {
        onResult(result);
      } else {
        setPhotoMessage('No barcode found in that photo. Try a sharper, closer shot.');
      }
    } catch {
      setPhotoMessage('That photo could not be read. Try a different one.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[22px] font-bold">Scan your card</h3>
        <button type="button" className="h-11 px-2 text-[15px] font-semibold text-sky-700" onClick={onCancel}>
          Back
        </button>
      </div>

      {error ? (
        <div role="alert" className="alert alert-warning mb-4 text-sm">
          <span>{error}</span>
        </div>
      ) : (
        <div className="relative mb-2 overflow-hidden rounded-2xl bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {isStarting ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-white" />
            </div>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-x-8 inset-y-[22%] rounded-2xl border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
              <div className="pointer-events-none absolute inset-x-12 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-red-500/90" />
            </>
          )}
        </div>
      )}

      {!error && (
        <p className="mb-4 text-center text-sm text-base-content/60">
          Point the camera at the barcode or QR code on your card
        </p>
      )}

      {photoMessage && (
        <p className="mb-4 text-center text-sm" aria-live="polite">
          {photoMessage}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhoto}
      />

      <button
        type="button"
        className="mt-2 h-14 w-full rounded-2xl bg-base-200 text-[17px] font-bold text-base-content active:bg-base-300"
        onClick={() => fileInputRef.current?.click()}
      >
        Scan from a photo instead
      </button>
    </div>
  );
}
