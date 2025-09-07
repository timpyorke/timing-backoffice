export const formatPrice = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  if (!isFinite(num)) return '0.00';
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return num < 0 ? `-${formatted}` : formatted;
};

