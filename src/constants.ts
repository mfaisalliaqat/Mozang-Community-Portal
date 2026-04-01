import { Priority, Status } from './types';

export const DEPARTMENTS: Record<string, string> = {
  water: 'Water & Sewerage',
  sanitation: 'Sanitation',
  roads: 'Roads & Infrastructure',
  electricity: 'Electricity',
  parks: 'Parks & Recreation',
  safety: 'Public Safety',
};

export const DEPT_ICONS: Record<string, string> = {
  water: '💧',
  sanitation: '🗑️',
  roads: '🛣️',
  electricity: '⚡',
  parks: '🌳',
  safety: '🛡️',
};

export const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-orange-100 text-orange-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
};
