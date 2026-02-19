import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateShort(value: string | Date | null | undefined, fallback = "—") {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : fallback
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

export function sanitizePhoneInput(value: string, maxDigits = 15) {
  const trimmed = value.trim()
  const normalized = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed
  const hasPlus = normalized.startsWith("+")
  const digits = normalized.replace(/\D/g, "").slice(0, maxDigits)
  return hasPlus ? `+${digits}` : digits
}

export function validatePortugueseNif(value: string) {
  const nif = value.replace(/\D/g, "")
  if (nif.length !== 9) return false
  const digits = nif.split("").map((d) => Number(d))
  if (digits.some((d) => Number.isNaN(d))) return false
  const total = digits
    .slice(0, 8)
    .reduce((sum, digit, index) => sum + digit * (9 - index), 0)
  const mod = total % 11
  const check = mod < 2 ? 0 : 11 - mod
  return check === digits[8]
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
