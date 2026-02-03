"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CatalogItem } from "@/types"
import { Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export type MomentItemRow = {
  moment_id: number
  item_id: number
  is_default: boolean
  sort_order: number
}

type MomentRow = {
  id: number
  title_pt: string
}

type MomentItemsDialogProps = {
  moment: MomentRow
  catalogItems: CatalogItem[]
  momentItems: MomentItemRow[]
}

type SelectionState = {
  selected: boolean
  isDefault: boolean
}

export function MomentItemsDialog({ moment, catalogItems, momentItems }: MomentItemsDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const initialSelection = useMemo(() => {
    const map = new Map<number, SelectionState>()
    momentItems
      .filter((item) => item.moment_id === moment.id)
      .forEach((item) => {
        map.set(item.item_id, { selected: true, isDefault: item.is_default })
      })
    return map
  }, [moment.id, momentItems])

  const [selection, setSelection] = useState<Map<number, SelectionState>>(initialSelection)

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return catalogItems
    return catalogItems.filter((item) =>
      item.name.pt.toLowerCase().includes(term) ||
      item.name.en.toLowerCase().includes(term)
    )
  }, [catalogItems, search])

  const toggleSelection = (itemId: number, checked: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev)
      if (!checked) {
        next.set(itemId, { selected: false, isDefault: false })
        return next
      }
      const existing = next.get(itemId)
      next.set(itemId, { selected: true, isDefault: existing?.isDefault ?? false })
      return next
    })
  }

  const toggleDefault = (itemId: number, checked: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev)
      const existing = next.get(itemId) ?? { selected: true, isDefault: false }
      next.set(itemId, { selected: true, isDefault: checked })
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const selectedItems = catalogItems
        .filter((item) => selection.get(item.id)?.selected)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item, index) => ({
          item_id: item.id,
          is_default: selection.get(item.id)?.isDefault ?? false,
          sort_order: index + 1,
        }))

      const response = await fetch("/api/moment-items/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moment_id: moment.id, items: selectedItems }),
      })

      if (!response.ok) throw new Error("Failed to update moment items")

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Sugestoes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Sugestoes para {moment.title_pt}</DialogTitle>
          <DialogDescription>
            Selecione os itens sugeridos e quais devem ficar pre-selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`search_${moment.id}`}>Pesquisar item</Label>
            <Input
              id={`search_${moment.id}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex: rissóis, vinho, bartender..."
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-md border p-3">
            <div className="grid gap-3">
              {filteredItems.map((item) => {
                const selected = selection.get(item.id)?.selected ?? false
                const isDefault = selection.get(item.id)?.isDefault ?? false

                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`select_${moment.id}_${item.id}`}
                        checked={selected}
                        onCheckedChange={(value) => toggleSelection(item.id, value === true)}
                      />
                      <div>
                        <Label htmlFor={`select_${moment.id}_${item.id}`} className="font-medium">
                          {item.name.pt}
                        </Label>
                        {item.description?.pt ? (
                          <p className="text-xs text-muted-foreground">{item.description.pt}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`default_${moment.id}_${item.id}`}
                        checked={isDefault}
                        disabled={!selected}
                        onCheckedChange={(value) => toggleDefault(item.id, value === true)}
                      />
                      <Label htmlFor={`default_${moment.id}_${item.id}`}>Pre-selecionar</Label>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "A guardar..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
