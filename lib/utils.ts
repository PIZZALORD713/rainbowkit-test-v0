import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Tiny helper to join Tailwind class lists.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
