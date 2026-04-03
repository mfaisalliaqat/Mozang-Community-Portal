import { Priority, Status } from './types';

export const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-orange-100 text-orange-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  'closed-not-actionable': 'bg-gray-100 text-gray-700',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
};
