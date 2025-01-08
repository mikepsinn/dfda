/**
 * Utility functions for formatting numbers in model reports
 */

export type ScaleType = 'none' | 'thousands' | 'millions' | 'billions';

export function formatCurrency(value: number, scale: ScaleType = 'millions'): string {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  
  let scaledValue = value;
  switch (scale) {
    case 'thousands':
      scaledValue = value / 1_000;
      break;
    case 'millions':
      scaledValue = value / 1_000_000;
      break;
    case 'billions':
      scaledValue = value / 1_000_000_000;
      break;
  }
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(scaledValue);
  
  return scale === 'none' ? formatted : `${formatted} ${scale.slice(0, -1)}`;
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  } else {
    return `${years} year${years === 1 ? '' : 's'}, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  }
} 