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
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

const momentSchema = z.object({
  key: z.string().min(1, "Key e obrigatoria"),
  title_pt: z.string().min(1, "Titulo (PT) e obrigatorio"),
  title_en: z.string().min(1, "Title (EN) is required"),
  sort_order: z.number().min(1, "Ordem deve ser >= 1"),
  is_active: z.boolean().optional(),
})

type MomentFormValues = z.infer<typeof momentSchema>

export function MomentDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<MomentFormValues>({
    resolver: zodResolver(momentSchema),
    defaultValues: {
      key: "",
      title_pt: "",
      title_en: "",
      sort_order: 1,
      is_active: true,
    },
  })

  const onSubmit = async (data: MomentFormValues) => {
    setLoading(true)
    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create moment")

      setOpen(false)
      reset()
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
          Novo Momento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Novo Momento</DialogTitle>
          <DialogDescription>
            Adicione um novo momento ao fluxo da proposta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="key">Key</Label>
            <Input id="key" {...register("key")} placeholder="casa_noivos" />
            {errors.key && <span className="text-red-500 text-xs">{errors.key.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title_pt">Titulo (PT)</Label>
              <Input id="title_pt" {...register("title_pt")} />
              {errors.title_pt && <span className="text-red-500 text-xs">{errors.title_pt.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title_en">Title (EN)</Label>
              <Input id="title_en" {...register("title_en")} />
              {errors.title_en && <span className="text-red-500 text-xs">{errors.title_en.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sort_order">Ordem</Label>
              <Input id="sort_order" type="number" min={1} {...register("sort_order", { valueAsNumber: true })} />
              {errors.sort_order && <span className="text-red-500 text-xs">{errors.sort_order.message}</span>}
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
              {loading ? "A criar..." : "Criar Momento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
