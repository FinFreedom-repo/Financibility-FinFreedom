// Format currency values
export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

// Format percentage values
export const formatPercentage = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0.00%';
  }

  return `${numValue.toFixed(2)}%`;
};

// Format large numbers with K, M, B suffixes
export const formatLargeNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0';
  }

  if (numValue >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(1)}B`;
  } else if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(1)}M`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(1)}K`;
  }

  return numValue.toString();
};

// Format currency values with abbreviated format for charts (e.g., 5M, 100K, 1.5B)
export const formatCurrencyAbbreviated = (value: number | string): string => {
  let numValue: number;

  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else if (typeof value === 'number') {
    numValue = value;
  } else {
    return '0';
  }

  if (isNaN(numValue) || !isFinite(numValue)) {
    return '0';
  }

  const absValue = Math.abs(numValue);
  const isNegative = numValue < 0;
  const sign = isNegative ? '-' : '';

  if (absValue >= 1000000000) {
    const billions = absValue / 1000000000;
    const formatted =
      billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
    return `${sign}${formatted}B`;
  } else if (absValue >= 1000000) {
    const millions = absValue / 1000000;
    const formatted =
      millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${sign}${formatted}M`;
  } else if (absValue >= 1000) {
    const thousands = absValue / 1000;
    const formatted =
      thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${sign}${formatted}K`;
  }

  return `${sign}${Math.round(absValue)}`;
};
