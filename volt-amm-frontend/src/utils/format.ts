export const formatNumber = (
  value: string | number | null | undefined,
  options?: Intl.NumberFormatOptions,
) => {
  if (value === null || value === undefined) {
    return '—';
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(parsed)) {
    return String(value);
  }

  return parsed.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  });
};

export const formatPercent = (value: string | number) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsed)) {
    return '—';
  }
  return `${(parsed * 100).toFixed(2)}%`;
};
