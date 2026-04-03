import { Priority, Status } from './types';

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

export const AREAS = [
  'Shadab Colony',
  'Chiragh Din Road',
  'Park Lane',
  'Punj Mehal Road',
  'Temple Road',
  'Mozang Road',
  'Regal Road',
  'Main Bazar',
  'Mubarak Pura',
  'Qila Mehra',
  'Muhalla Madahar',
  'Badar Din Road',
  'Nazooli Muhalla',
  'Qureshi Muhalla',
  'Chah Pichwara',
  'Janazgah Road Bazar',
  'Lytton Road',
  'Saadi Park',
  'Hari Shah Road',
  'Noor Shah Road',
  'Kanak Mandi',
  'Kot Abdullah Shah',
] as const;
