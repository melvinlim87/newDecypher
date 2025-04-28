export const formatTimeframe = (timeframe: string): string => {
  if (!timeframe) return '';
  
  const clean = timeframe
    .trim()
    .toUpperCase()
    .replace(/\*/g, '')  // Remove asterisks
    .replace(/\s+/g, ''); // Remove spaces

  // Handle D1, H1, M15 formats
  if (clean.match(/^[MHWD]\d+$/i)) {
    const unit = clean[0];
    const number = clean.slice(1);
    return `${number}${unit}`;
  }
  
  // Handle 1D, 15M formats (ensure no duplicate units)
  if (clean.match(/^\d+[MHWD]$/i)) {
    return clean.replace(/(\d+)([MHWD])$/i, '$1$2');
  }

  return clean;
};
