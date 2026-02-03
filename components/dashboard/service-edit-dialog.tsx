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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Service } from "@/types"

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

type CategoryRow = {
  id: string
  name_pt: string
}

const normalizeTags = (value?: string) => {
  if (!value) return null
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tags.length ? tags : null
}

export function ServiceEditDialog({ service, categories }: { service: Service; categories?: CategoryRow[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const defaultCategory = useMemo(() => {
    if (service.categoryId) return service.categoryId
    return categories?.[0]?.id ?? ""
  }, [categories, service.categoryId])

  const includedItems = (service.includedItems ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const defaultValues: ServiceFormValues = {
    category_id: defaultCategory,
    name_pt: service.name.pt,
    name_en: service.name.en,
    description_pt: service.description?.pt ?? "",
    description_en: service.description?.en ?? "",
    included_items_pt: includedItems.map((i) => i.text.pt).join("\n"),
    included_items_en: includedItems.map((i) => i.text.en).join("\n"),
    pricing_type: service.pricingType,
    base_price: service.basePrice ?? 0,
    unit_pt: service.unit?.pt ?? "",
    unit_en: service.unit?.en ?? "",
    min_quantity: service.minQuantity ?? 1,
    sort_order: service.sortOrder,
    tags: service.tags?.join(", ") ?? "",
    is_active: service.isActive,
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues,
  })

  const pricingType = watch("pricing_type")

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

      const payload = {
        ...data,
        base_price: basePrice,
        tags: normalizeTags(data.tags),
        included_items_pt: parseIncludedLines(data.included_items_pt),
        included_items_en: parseIncludedLines(data.included_items_en),
      }

      const response = await fetch(`/api/services/${service.id}` , {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to update service")

      setOpen(false)
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
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Editar Servico</DialogTitle>
          <DialogDescription>
            Atualize informacoes do servico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <input type="hidden" {...register("is_active")} />

          <div className="grid gap-2">
            <Label htmlFor={`category_id_${service.id}`}>Categoria</Label>
            <select
              id={`category_id_${service.id}`}
              {...register("category_id")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categories?.length ? (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_pt}
                  </option>
                ))
              ) : (
                <option value={defaultCategory}>Categoria atual</option>
              )}
            </select>
            {errors.category_id && <span className="text-xs text-red-500">{errors.category_id.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`name_pt_${service.id}`}>Nome (PT)</Label>
              <Input id={`name_pt_${service.id}`} {...register("name_pt")} />
              {errors.name_pt && <span className="text-xs text-red-500">{errors.name_pt.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`name_en_${service.id}`}>Nome (EN)</Label>
              <Input id={`name_en_${service.id}`} {...register("name_en")} />
              {errors.name_en && <span className="text-xs text-red-500">{errors.name_en.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`description_pt_${service.id}`}>Descricao (PT)</Label>
              <Textarea id={`description_pt_${service.id}`} {...register("description_pt")} placeholder="Texto livre (contexto, notas)." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`description_en_${service.id}`}>Description (EN)</Label>
              <Textarea id={`description_en_${service.id}`} {...register("description_en")} placeholder="Free text (context, notes)." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`included_items_pt_${service.id}`}>Itens incluidos (PT)</Label>
              <Textarea
                id={`included_items_pt_${service.id}`}
                {...register("included_items_pt")}
                placeholder="Um item por linha"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Lista na proposta em &quot;Inclui&quot;. Um item por linha.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`included_items_en_${service.id}`}>Itens incluidos (EN)</Label>
              <Textarea
                id={`included_items_en_${service.id}`}
                {...register("included_items_en")}
                placeholder="One item per line"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Mesma lista em ingles.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`pricing_type_${service.id}`}>Tipo de Preco</Label>
              <select
                id={`pricing_type_${service.id}`}
                {...register("pricing_type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="per_person">Por Pessoa</option>
                <option value="fixed">Fixo</option>
                <option value="on_request">Sob consulta</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`base_price_${service.id}`}>Preco Base (EUR)</Label>
              <Input
                id={`base_price_${service.id}`}
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
                <Label htmlFor={`unit_pt_${service.id}`}>Unidade (PT)</Label>
                <Input id={`unit_pt_${service.id}`} {...register("unit_pt")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`unit_en_${service.id}`}>Unidade (EN)</Label>
                <Input id={`unit_en_${service.id}`} {...register("unit_en")} />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`min_quantity_${service.id}`}>Quantidade minima</Label>
              <Input id={`min_quantity_${service.id}`} type="number" min={1} {...register("min_quantity", { valueAsNumber: true })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`sort_order_${service.id}`}>Ordem</Label>
              <Input id={`sort_order_${service.id}`} type="number" min={1} {...register("sort_order", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`tags_${service.id}`}>Tags</Label>
              <Input id={`tags_${service.id}`} {...register("tags")} placeholder="buffet, bebidas, staff..." />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Checkbox
                id={`is_active_${service.id}`}
                checked={watch("is_active")}
                onCheckedChange={(value) => setValue("is_active", value === true)}
              />
              <Label htmlFor={`is_active_${service.id}`}>Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
