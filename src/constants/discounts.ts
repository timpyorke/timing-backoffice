export const DISCOUNT_CODES: Record<string, number> = {
  DC10: 10,
  DC20: 20,
  DC30: 30,
  DC50: 50,
};

export function getDiscountPercent(code: string | undefined | null): number {
  if (!code) return 0;
  const key = code.trim().toUpperCase();
  return DISCOUNT_CODES[key] || 0;
}
