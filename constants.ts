
import type { Pais, TasasDeCambio } from './types';

export const PAISES: { [key: string]: Pais } = {
  colombia:  { nombre: 'Colombia',  moneda: 'COP', simbolo: '$',  flag: '🇨🇴', iva: 19 },
  mexico:    { nombre: 'México',    moneda: 'MXN', simbolo: '$',  flag: '🇲🇽', iva: 16 },
  espana:    { nombre: 'España',    moneda: 'EUR', simbolo: '€',  flag: '🇪🇸', iva: 21 },
  argentina: { nombre: 'Argentina', moneda: 'ARS', simbolo: '$',  flag: '🇦🇷', iva: 21 },
};

export const DEFAULT_TASAS_DE_CAMBIO: TasasDeCambio = { COP: 4000, MXN: 17.5, EUR: 0.92, ARS: 1020 };
