import { clsx, type ClassValue } from "clsx";

/** Single className helper used across the app. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
