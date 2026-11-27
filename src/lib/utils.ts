export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (iso: string): string => {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const maskAccount = (num: string): string => {
  if (num.length <= 4) return num;
  return `•••• ${num.slice(-4)}`;
};

export const generateAccountNumber = (): string => {
  let num = '';
  for (let i = 0; i < 12; i++) num += Math.floor(Math.random() * 10);
  return num;
};

export const generateCardLast4 = (): string => {
  let num = '';
  for (let i = 0; i < 4; i++) num += Math.floor(Math.random() * 10);
  return num;
};

// Simple hash for demo purposes (NOT secure - for demo app only)
export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
};
