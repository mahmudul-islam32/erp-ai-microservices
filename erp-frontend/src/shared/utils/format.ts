import { format, formatDistance, formatRelative } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatDate = (date: string | Date, formatStr: string = 'PPP'): string => {
  return format(new Date(date), formatStr);
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'PPP p');
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export const formatRelativeDate = (date: string | Date): string => {
  return formatRelative(new Date(date), new Date());
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

