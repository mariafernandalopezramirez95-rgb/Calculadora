
import type { Pais, Agencia } from './types';

export const PAISES: { [key: string]: Pais } = {
  colombia: { nombre: 'Colombia', moneda: 'COP', simbolo: '$', flag: '🇨🇴', iva: 19 },
  mexico: { nombre: 'México', moneda: 'MXN', simbolo: '$', flag: '🇲🇽', iva: 16 },
  espana: { nombre: 'España', moneda: 'EUR', simbolo: '€', flag: '🇪🇸', iva: 21 },
};

export const AGENCIAS: { [key: string]: Agencia } = {
  colombia: { nombre: 'Agencia Colombia', comision: 10, moneda: 'USD' },
  espana: { nombre: 'Agencia España', comision: 5, moneda: 'EUR' },
  ninguna: { nombre: 'Sin Agencia', comision: 0, moneda: 'USD' }
};

export const TASAS_USD: { [key: string]: number } = { COP: 4000, MXN: 17.5, EUR: 0.92 };
