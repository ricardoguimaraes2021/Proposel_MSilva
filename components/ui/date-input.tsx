"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { isoToDisplayDate, displayDateToIso } from "@/lib/utils"
import { cn } from "@/lib/utils"

type DateInputProps = {
  value: string
  onChange: (iso: string | null) => void
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, placeholder = "dd/mm/aaaa", id, className, disabled }, ref) => {
    const [localDisplay, setLocalDisplay] = React.useState(() => isoToDisplayDate(value))
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasError, setHasError] = React.useState(false)
    const lastValidValueRef = React.useRef(value)

    React.useEffect(() => {
      if (!isFocused) {
        setLocalDisplay(isoToDisplayDate(value))
      }
    }, [value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalDisplay(e.target.value)
      setHasError(false)
    }

    const handleBlur = () => {
      setIsFocused(false)
      const iso = displayDateToIso(localDisplay)
      if (iso) {
        onChange(iso)
        lastValidValueRef.current = iso
        setHasError(false)
      } else {
        if (localDisplay.trim()) {
          setHasError(true)
          setLocalDisplay(isoToDisplayDate(lastValidValueRef.current))
          onChange(null)
        } else {
          onChange(null)
          lastValidValueRef.current = ""
        }
      }
    }

    const handleFocus = () => {
      setIsFocused(true)
      setHasError(false)
    }

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        value={localDisplay}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(hasError && "border-destructive focus-visible:ring-destructive", className)}
        inputMode="numeric"
        autoComplete="off"
      />
    )
  }
)
DateInput.displayName = "DateInput"
