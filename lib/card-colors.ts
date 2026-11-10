import { CompanyCode } from '@/types/loyalty-card';

// Tile colours are picked for contrast with white text; they are approximations,
// not official brand values.
const CARD_COLORS: Partial<Record<CompanyCode, string>> = {
  pnp: '#0B4EA2',
  xts: '#00998F',
  wlw: '#1D1D1F',
  cls: '#1A73C8',
  dch: '#0A8A4A',
  vra: '#C8102E',
  spr: '#C8102E',
  tsp: '#B3261E',
  mak: '#12408F',
  gme: '#D81B60',
  mrp: '#B71C1C',
  dis: '#7B1FA2',
  dsm: '#5E35B1',
  fnb: '#00838F',
  cap: '#1565C0',
  mtn: '#8A6D00',
  eng: '#1B5E20',
  bld: '#C25E00',
  spu: '#A63A00',
  skr: '#37474F',
  mop: '#00796B',
};

const FALLBACK_COLORS = ['#0052A3', '#00796B', '#6A1B9A', '#AD1457', '#37474F', '#A84300'];

export function getCardColor(company: CompanyCode): string {
  const known = CARD_COLORS[company];
  if (known) return known;
  let hash = 0;
  for (const ch of company) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}
