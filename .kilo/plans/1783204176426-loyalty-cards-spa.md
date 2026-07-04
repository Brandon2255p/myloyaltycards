# Loyalty Cards SPA Plan

## Context
- Next.js 16 + React 19 + Tailwind CSS v4 project
- No daisyUI installed yet
- Single page application for storing/displaying loyalty cards
- PWA with offline support via service worker

## Brand Colors (assumed)
| Code | Brand | Primary Color |
|------|-------|---------------|
| cks | Checkers | #E31837 (red) |
| pnp | Pick n Pay | #0070BA (blue) |
| bld | Builders Warehouse | #FF6900 (orange) |
| pkr | Parkrun | #FF6900 (orange) |

## URL Format
```
?cards=cks:ABC123,pnp:XYZ789&barcode=code128
```
- Cards encoded as comma-separated `code:cardNumber` pairs
- Barcode type stored as `barcode` query param
- Decoded on page load to populate card list
- User can select barcode type (code128, qr, ean13) which applies to all cards

## Data Model
```typescript
type BarcodeType = 'code128' | 'qr' | 'ean13';

interface LoyaltyCard {
  id: string;          // unique identifier
  company: 'cks' | 'pnp' | 'bld' | 'pkr';
  cardNumber: string;  // the loyalty card code
  barcodeType?: BarcodeType;  // user selectable, stored in URL
}
```

## URL Encoding/Decoding
- Parse `?cards=` param on load
- Update URL when cards added/removed (using `replaceState` to avoid history pollution)
- Share button copies current URL to clipboard

## PWA / Offline Support
1. Add `manifest.json` for mobile shortcut
2. Service worker caches:
   - All app assets (JS, CSS, fonts)
   - Static assets (favicon, etc.)
3. Service worker strategy: Cache-first for assets, network-first for navigation
4. When online, update cached version in background

## UI Components

### Navbar
- App title: "My Loyalty Cards"
- Dark mode toggle (using `theme-controller` with `checkbox`)
- Add card button (+)

### Card Grid
- Responsive grid: `grid-cols-1` mobile, `grid-cols-2` tablet, `grid-cols-3` desktop
- Each card shows:
  - Brand-colored header
  - Company name
  - Card number (large, monospace)
  - Barcode (format selectable by user)
  - Delete button (X) with confirmation dialog

### Add Card Modal
- Company dropdown (`select` component)
- Card number input (`input` component)
- Submit/Cancel buttons
- Uses HTML `<dialog>` element

### Barcode Type Selector
- Dropdown or segmented control to select barcode format
- Options: Code128, QR Code, EAN-13
- Selection stored in URL (`&barcode=code128`)
- Applies to all cards globally

### Dark Mode
- Use daisyUI themes with `data-theme` attribute
- Toggle stores preference in localStorage

## Implementation Steps

1. **Install dependencies**
   - `npm i -D daisyui@latest`
   - `npm i bwip-js` (barcode generation)
   - `npm i @ducanh2912/next-pwa` (PWA support for Next.js)

2. **Configure daisyUI**
   - Update `globals.css` with `@plugin "daisyui"`

3. **Create types**
   - `types/loyalty-card.ts`

4. **Create URL utilities**
   - `lib/url-utils.ts` - encode/decode cards from URL

5. **Create barcode component**
   - `components/Barcode.tsx` - uses bwip-js to render Code128

6. **Create loyalty card component**
   - `components/LoyaltyCard.tsx` - displays single card with brand colors

7. **Create add card modal**
   - `components/AddCardModal.tsx`

8. **Create delete confirmation dialog**
   - `components/DeleteConfirmDialog.tsx` - confirmation before deleting

9. **Update main page**
   - `app/page.tsx` - assembles all components

9. **Add PWA support**
   - `public/manifest.json`
   - Service worker registration via `@ducanh2912/next-pwa`

10. **Configure PWA**
    - Update `next.config.ts`

## Open Questions
1. **Brand colors**: Are these assumed brand colors correct?
   - Checkers: #E31837 (red)
   - Pick n Pay: #0070BA (blue)
   - Builders Warehouse: #FF6900 (orange)
   - Parkrun: #FF6900 (orange)

## Validation
- Add sample cards in URL to verify rendering
- Test dark mode toggle
- Test add card flow
- Test share URL functionality
- Test delete with confirmation dialog
- Test barcode type switching
- Test offline behavior with Lighthouse
