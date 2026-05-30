import { clsx, type ClassValue } from 'clsx';

/** Tailwind class merger — keeps conditional class lists tidy at call sites. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
