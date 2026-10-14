/**
 * Utility formatters for numbers, currency, and dates
 */

export const formatCurrency = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(amount);
};

export const formatCompactNumber = (number) => {
  if (typeof number !== 'number') return number;
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(number);
};

export const formatNumberWithCommas = (number) => {
  if (number === undefined || number === null) return '';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
