
export const fmt = (n: number | string): string => {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(num) ? '0' : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(num);
};

export const fmtDec = (n: number | string): string => {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(num) ? '0.00' : new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export const convertir = (cant: number, monedaOrigen: string, monedaDestino: string, tasas: { [key: string]: number }): number => {
  if (monedaOrigen === monedaDestino) return cant;
  if (monedaDestino === 'USD') return cant / (tasas[monedaOrigen] || 1);
  if (monedaOrigen === 'USD') return cant * (tasas[monedaDestino] || 1);
  const enUSD = cant / (tasas[monedaOrigen] || 1);
  return enUSD * (tasas[monedaDestino] || 1);
};
