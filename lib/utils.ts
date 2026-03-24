import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateShort(value: string | Date | null | undefined, fallback = "—") {
  if (!value) return fallback
  if (typeof value === "string") {
    // Evita drift de timezone em strings de data no formato YYYY-MM-DD
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
      const year = Number(m[1])
      const month = Number(m[2])
      const day = Number(m[3])
      const date = new Date(year, month - 1, day)
      if (Number.isNaN(date.getTime())) return fallback
      return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : fallback
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** Converte YYYY-MM-DD para dd/mm/yyyy para exibição. */
export function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string") return ""
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    const year = Number(m[1])
    const month = Number(m[2])
    const day = Number(m[3])
    const date = new Date(year, month - 1, day)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** Parse dd/mm/yyyy ou dd-mm-yyyy, retorna YYYY-MM-DD ou null se inválido. */
export function displayDateToIso(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/[/-]/).map((p) => p.trim())
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) return null
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
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
