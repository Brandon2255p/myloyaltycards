'use client';

import { useEffect, useRef, useState } from 'react';
import { BarcodeType } from '@/types/loyalty-card';
import bwipjs from 'bwip-js';

interface BarcodeProps {
  value: string;
  type: BarcodeType;
  disableFullscreen?: boolean;
}

export default function Barcode({ value, type, disableFullscreen }: BarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (type === 'qr') {
        bwipjs.toCanvas(canvas, {
          bcid: 'qrcode',
          text: value,
          scale: 4,
          height: 10,
          width: 10,
        });
      } else {
        bwipjs.toCanvas(canvas, {
          bcid: 'code128',
          text: value,
          scale: 3,
          height: 10,
          includetext: true,
          textcolor: '#000000',
        });
      }
    } catch {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(value, 5, 20);
      }
    }
  }, [value, type]);

  useEffect(() => {
    const canvas = fullScreenCanvasRef.current;
    if (!canvas || !isFullScreen) return;

    const maxW = window.innerWidth - 48;

    try {
      if (type === 'qr') {
        bwipjs.toCanvas(canvas, {
          bcid: 'qrcode',
          text: value,
          scale: 10,
          height: 10,
          width: 10,
          textcolor: '#000000',
        });
      } else {
        bwipjs.toCanvas(canvas, {
          bcid: 'code128',
          text: value,
          scale: 2,
          height: 10,
          includetext: true,
          textcolor: '#000000',
        });
      }
      if (canvas.width > maxW) {
        const ratio = maxW / canvas.width;
        const scaledW = Math.floor(canvas.width * ratio);
        const scaledH = Math.floor(canvas.height * ratio);
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        offscreen.getContext('2d')?.drawImage(canvas, 0, 0);
        canvas.width = scaledW;
        canvas.height = scaledH;
        canvas.getContext('2d')?.drawImage(offscreen, 0, 0, scaledW, scaledH);
      }
    } catch {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(value, 10, 30);
      }
    }
  }, [value, type, isFullScreen]);

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  return (
    <>
      <div
        className={`flex justify-center overflow-hidden ${disableFullscreen ? '' : 'cursor-pointer'}`}
        onClick={disableFullscreen ? undefined : () => setIsFullScreen(true)}
        title={disableFullscreen ? undefined : 'Tap to view full screen'}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ imageRendering: 'pixelated', maxWidth: '100%' }}
        />
      </div>

      {isFullScreen && (
        <dialog
          className="modal modal-open"
          onClick={() => setIsFullScreen(false)}
        >
          <div
            className="modal-box bg-white max-w-[calc(100vw-48px)] max-h-[calc(100vh-120px)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center p-4">
              <canvas
                ref={fullScreenCanvasRef}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <p className="text-center font-mono text-lg font-bold py-2">{value}</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setIsFullScreen(false)}>
                Close
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
