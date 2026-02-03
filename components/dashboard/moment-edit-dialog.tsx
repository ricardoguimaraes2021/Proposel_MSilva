"use client"

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"

const momentSchema = z.object({
  key: z.string().min(1, "Key e obrigatoria"),
  title_pt: z.string().min(1, "Titulo (PT) e obrigatorio"),
  title_en: z.string().min(1, "Title (EN) is required"),
  sort_order: z.number().min(1, "Ordem deve ser >= 1"),
  is_active: z.boolean().optional(),
})

type MomentFormValues = z.infer<typeof momentSchema>

type MomentRow = {
  id: number
  key: string
  title_pt: string
  title_en: string
  sort_order: number
  is_active: boolean
}

export function MomentEditDialog({ moment }: { moment: MomentRow }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MomentFormValues>({
    resolver: zodResolver(momentSchema),
    defaultValues: {
      key: moment.key,
      title_pt: moment.title_pt,
      title_en: moment.title_en,
      sort_order: moment.sort_order,
      is_active: moment.is_active,
    },
  })

  const onSubmit = async (data: MomentFormValues) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/moments/${moment.id}` , {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update moment")

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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar Momento</DialogTitle>
          <DialogDescription>
            Atualize informacoes do momento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor={`key_${moment.id}`}>Key</Label>
            <Input id={`key_${moment.id}`} {...register("key")} />
            {errors.key && <span className="text-red-500 text-xs">{errors.key.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`title_pt_${moment.id}`}>Titulo (PT)</Label>
              <Input id={`title_pt_${moment.id}`} {...register("title_pt")} />
              {errors.title_pt && <span className="text-red-500 text-xs">{errors.title_pt.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`title_en_${moment.id}`}>Title (EN)</Label>
              <Input id={`title_en_${moment.id}`} {...register("title_en")} />
              {errors.title_en && <span className="text-red-500 text-xs">{errors.title_en.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`sort_order_${moment.id}`}>Ordem</Label>
              <Input id={`sort_order_${moment.id}`} type="number" min={1} {...register("sort_order", { valueAsNumber: true })} />
              {errors.sort_order && <span className="text-red-500 text-xs">{errors.sort_order.message}</span>}
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Checkbox
                id={`is_active_${moment.id}`}
                checked={watch("is_active")}
                onCheckedChange={(value) => setValue("is_active", value === true)}
              />
              <Label htmlFor={`is_active_${moment.id}`}>Ativo</Label>
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
