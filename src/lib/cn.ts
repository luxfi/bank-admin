// Minimal classnames joiner (no clsx/tailwind-merge dependency).
export type ClassValue = string | number | false | null | undefined
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}
