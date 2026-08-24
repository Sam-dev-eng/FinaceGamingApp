export const formatNaira = (amount) => {
  if (amount == null || Number.isNaN(amount)) return "₦0";
  return `₦${Number(amount).toLocaleString()}`;
};

export const formatNairaCompact = (amount) => {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (amount >= 1_000) return `₦${Math.round(amount / 1000)}k`;
  return formatNaira(amount);
};
