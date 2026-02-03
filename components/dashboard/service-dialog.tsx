"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { PlusCircle, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

type CategoryRow = {
  id: string
  name_pt: string
  name_en: string
}

const serviceSchema = z.object({
  category_id: z.string().min(1, "Categoria e obrigatoria"),
  name_pt: z.string().min(1, "Nome (PT) e obrigatorio"),
  name_en: z.string().min(1, "Name (EN) is required"),
  description_pt: z.string().optional(),
  description_en: z.string().optional(),
  included_items_pt: z.string().optional(),
  included_items_en: z.string().optional(),
  pricing_type: z.enum(["per_person", "fixed", "on_request"]),
  base_price: z.number().optional(),
  unit_pt: z.string().optional(),
  unit_en: z.string().optional(),
  min_quantity: z.number().optional(),
  sort_order: z.number().optional(),
  tags: z.string().optional(),
  is_active: z.boolean().optional(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

const normalizeTags = (value?: string) => {
  if (!value) return null
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tags.length ? tags : null
}

export function ServiceDialog({ categories }: { categories: CategoryRow[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategories, setNewCategories] = useState<CategoryRow[]>([])
  const [newCategoryNamePt, setNewCategoryNamePt] = useState("")
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const router = useRouter()

  const displayCategories = useMemo(() => [...categories, ...newCategories], [categories, newCategories])
  const defaultCategory = useMemo(() => displayCategories[0]?.id ?? "", [displayCategories])

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      category_id: defaultCategory,
      pricing_type: "per_person",
      base_price: 0,
      unit_pt: "pessoa",
      unit_en: "person",
      min_quantity: 1,
      sort_order: 1,
      is_active: true,
    }
  })

  const pricingType = watch("pricing_type")

  const handleCreateCategory = async () => {
    const pt = newCategoryNamePt.trim()
    const en = newCategoryNameEn.trim()
    if (!pt || !en) {
      setCategoryError("Preencha o nome em PT e EN.")
      return
    }
    setCreatingCategory(true)
    setCategoryError(null)
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_pt: pt, name_en: en }),
        credentials: "include",
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(typeof err?.error === "string" ? err.error : "Falha ao criar categoria.")
      }
      const data = (await response.json()) as CategoryRow
      setNewCategories((prev) => [...prev, data])
      setValue("category_id", data.id)
      setShowNewCategory(false)
      setNewCategoryNamePt("")
      setNewCategoryNameEn("")
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Falha ao criar categoria.")
    } finally {
      setCreatingCategory(false)
    }
  }

  const parseIncludedLines = (text?: string) => {
    if (!text || !text.trim()) return null
    const lines = text.trim().split(/\n+/).map((l) => l.trim()).filter(Boolean)
    return lines.length ? lines : null
  }

  const onSubmit = async (data: ServiceFormValues) => {
    setLoading(true)
    try {
      const basePrice =
        pricingType === "on_request"
          ? null
          : data.base_price ?? 0

      const payload: Record<string, unknown> = {
        ...data,
        base_price: basePrice,
        tags: normalizeTags(data.tags),
        included_items_pt: parseIncludedLines(data.included_items_pt),
        included_items_en: parseIncludedLines(data.included_items_en),
      }

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to create service")

      setOpen(false)
      reset({
        category_id: displayCategories[0]?.id ?? defaultCategory,
        pricing_type: "per_person",
        base_price: 0,
        unit_pt: "pessoa",
        unit_en: "person",
        min_quantity: 1,
        sort_order: 1,
        is_active: true,
      })
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Servico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Novo Servico</DialogTitle>
          <DialogDescription>
            Adicione um novo servico ao catalogo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <input type="hidden" {...register("is_active")} />

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="category_id">Categoria</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setShowNewCategory((v) => !v)
                  setCategoryError(null)
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                Nova categoria
              </Button>
            </div>
            {showNewCategory ? (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Criar categoria e usá-la neste serviço</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome (PT)"
                    value={newCategoryNamePt}
                    onChange={(e) => setNewCategoryNamePt(e.target.value)}
                    className="h-9"
                  />
                  <Input
                    placeholder="Nome (EN)"
                    value={newCategoryNameEn}
                    onChange={(e) => setNewCategoryNameEn(e.target.value)}
                    className="h-9"
                  />
                </div>
                {categoryError && <p className="text-xs text-destructive">{categoryError}</p>}
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleCreateCategory} disabled={creatingCategory}>
                    {creatingCategory ? "A criar..." : "Criar categoria"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewCategory(false)
                      setCategoryError(null)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
            <select
              id="category_id"
              {...register("category_id")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {displayCategories.length === 0 ? (
                <option value="">Sem categorias — crie uma acima</option>
              ) : (
                displayCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_pt}
                  </option>
                ))
              )}
            </select>
            {errors.category_id && <span className="text-xs text-red-500">{errors.category_id.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name_pt">Nome (PT)</Label>
              <Input id="name_pt" {...register("name_pt")} />
              {errors.name_pt && <span className="text-xs text-red-500">{errors.name_pt.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name_en">Nome (EN)</Label>
              <Input id="name_en" {...register("name_en")} />
              {errors.name_en && <span className="text-xs text-red-500">{errors.name_en.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="description_pt">Descricao (PT)</Label>
              <Textarea id="description_pt" {...register("description_pt")} placeholder="Texto livre sobre o servico (contexto, notas)." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description_en">Description (EN)</Label>
              <Textarea id="description_en" {...register("description_en")} placeholder="Free text about the service (context, notes)." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="included_items_pt">Itens incluidos (PT)</Label>
              <Textarea
                id="included_items_pt"
                {...register("included_items_pt")}
                placeholder="Um item por linha (ex.: Rissóis, Croquetes, Empadas)"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Lista que aparece na proposta em &quot;Inclui&quot;. Um item por linha.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="included_items_en">Itens incluidos (EN)</Label>
              <Textarea
                id="included_items_en"
                {...register("included_items_en")}
                placeholder="Um item por linha (ex.: Rissóis, Croquetes, Empanadas)"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Same list in English (one per line).</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pricing_type">Tipo de Preco</Label>
              <select
                id="pricing_type"
                {...register("pricing_type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="per_person">Por Pessoa</option>
                <option value="fixed">Fixo</option>
                <option value="on_request">Sob consulta</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="base_price">Preco Base (EUR)</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                disabled={pricingType === "on_request"}
                {...register("base_price", { valueAsNumber: true })}
              />
              {errors.base_price && <span className="text-xs text-red-500">{errors.base_price.message}</span>}
            </div>
          </div>

          {pricingType === "per_person" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit_pt">Unidade (PT)</Label>
                <Input id="unit_pt" {...register("unit_pt")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_en">Unidade (EN)</Label>
                <Input id="unit_en" {...register("unit_en")} />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min_quantity">Quantidade minima</Label>
              <Input id="min_quantity" type="number" min={1} {...register("min_quantity", { valueAsNumber: true })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sort_order">Ordem</Label>
              <Input id="sort_order" type="number" min={1} {...register("sort_order", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" {...register("tags")} placeholder="buffet, bebidas, staff..." />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Checkbox
                id="is_active"
                checked={watch("is_active")}
                onCheckedChange={(value) => setValue("is_active", value === true)}
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "A criar..." : "Criar Servico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
