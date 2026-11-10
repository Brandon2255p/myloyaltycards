import type { ReadResult, ReaderOptions } from 'zxing-wasm/reader';
import { BarcodeType } from '@/types/loyalty-card';

export interface ScanResult {
  cardNumber: string;
  barcodeType: BarcodeType;
  /** Format name as reported by ZXing, e.g. "EAN13", "Code128", "QRCode". */
  format: string;
}

const READER_OPTIONS: ReaderOptions = {
  tryHarder: true,
  maxNumberOfSymbols: 1,
};

type Reader = typeof import('zxing-wasm/reader');
let readerPromise: Promise<Reader> | null = null;

/**
 * Lazily loads the ZXing reader (kept out of the main bundle) and points it at
 * the self-hosted wasm binary in /public rather than the default jsDelivr CDN.
 */
function getReader(): Promise<Reader> {
  if (!readerPromise) {
    readerPromise = import('zxing-wasm/reader')
      .then((reader) => {
        reader.prepareZXingModule({
          overrides: {
            locateFile: (path: string, prefix: string) =>
              path.endsWith('.wasm') ? `/${path}` : prefix + path,
          },
        });
        return reader;
      })
      .catch((err) => {
        readerPromise = null;
        throw err;
      });
  }
  return readerPromise;
}

/** Starts downloading/compiling the wasm so the first frame decodes quickly. */
export function preloadScanner(): void {
  getReader()
    .then((reader) => reader.prepareZXingModule({ fireImmediately: true }))
    .catch(() => {});
}

function toScanResult(results: ReadResult[]): ScanResult | null {
  const hit = results.find((r) => r.isValid && r.text.trim());
  if (!hit) return null;
  return {
    cardNumber: hit.text.trim(),
    // The app renders cards as either a QR code or a Code 128 barcode.
    barcodeType: hit.symbology === 'QRCode' ? 'qr' : 'bar',
    format: hit.format,
  };
}

/** Decodes a single frame or a photo. Resolves to null when nothing is found. */
export async function scanImage(image: ImageData | Blob): Promise<ScanResult | null> {
  const reader = await getReader();
  return toScanResult(await reader.readBarcodes(image, READER_OPTIONS));
}
