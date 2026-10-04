// 12345 -> "12,345". Done by hand so it doesn't depend on Intl support in the JS engine.
export function formatNumber(n) {
  const v = Math.round(Number(n) || 0);
  const sign = v < 0 ? '-' : '';
  return sign + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
