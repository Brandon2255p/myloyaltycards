export type BarcodeType = 'code128' | 'qr' | 'ean13';

export type CompanyCode =
  | 'xts' | 'pnp' | 'wlw' | 'cls' | 'dch' | 'spr'
  | 'okf' | 'mak' | 'gme' | 'mrp' | 'smw' | 'tsp'
  | 'med' | 'cna' | 'flm' | 'spu' | 'dis' | 'fnb'
  | 'cap' | 'tfg' | 'mtn' | 'eng' | 'lka' | 'bld'
  | 'pkr' | 'clc' | 'tru' | 'skr';

export interface LoyaltyCard {
  id: string;
  company: CompanyCode;
  cardNumber: string;
  barcodeType: BarcodeType;
}

export const COMPANY_NAMES: Record<CompanyCode, string> = {
  xts: 'Checkers Xtra Savings',
  pnp: 'Pick n Pay Smart Shopper',
  wlw: 'Woolworths MyDifference',
  cls: 'Clicks ClubCard',
  dch: 'Dis-Chem Better Rewards',
  spr: 'SPAR Rewards',
  okf: 'OK Count On',
  mak: 'Makro mCard',
  gme: 'Game more rewards',
  mrp: 'Mr Price Reward',
  smw: "Sportsman's Warehouse",
  tsp: 'TOPS at SPAR',
  med: 'MediRite',
  cna: 'CNA',
  flm: "Food Lover's Market",
  spu: 'Spur Family Card',
  dis: 'Discovery Vitality',
  fnb: 'FNB eBucks',
  cap: 'Capitec Live Better',
  tfg: 'TFG Rewards',
  mtn: 'MTN mpulse',
  eng: 'Engen',
  lka: 'Lekka',
  bld: 'Builders Warehouse',
  pkr: 'Parkrun',
  clc: 'Cell C',
  tru: 'Toys R Us',
  skr: 'Ster Kinekor',
};

export const COMPANY_SEARCH_TERMS: Record<CompanyCode, string> = {
  xts: 'checkers shoprite xtra savings',
  pnp: 'pick n pay smart shopper',
  wlw: 'woolworths woolies mydifference wrewards',
  cls: 'clicks clubcard',
  dch: 'dis-chem better rewards pharmacy',
  spr: 'spar spar rewards',
  okf: 'ok foods okcount on ok',
  mak: 'makro mcard',
  gme: 'game more rewards electronics',
  mrp: 'mr price mrp reward clothing',
  smw: 'sportsmans warehouse sports',
  tsp: 'tops at spar bottle store',
  med: 'medirite pharmacy',
  cna: 'cna books entertainment',
  flm: 'food lovers market grocery',
  spu: 'spur family card restaurant',
  dis: 'discovery vitality health gym',
  fnb: 'fnb ebucks bank',
  cap: 'capitec live better bank',
  tfg: 'tfg rewards clothing account',
  mtn: 'mtn mpulse telecom',
  eng: 'engen petrol fuel',
  lka: 'lekka independent retail',
  bld: 'builders warehouse hardware',
  pkr: 'parkrun running',
  clc: 'cell c mobile telecom',
  tru: 'toys r us toys',
  skr: 'ster kinekor cinema movies',
};
