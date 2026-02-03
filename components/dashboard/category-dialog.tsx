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

const categorySchema = z.object({
    name_pt: z.string().min(1, "Nome (PT) é obrigatório"),
    name_en: z.string().min(1, "Name (EN) is required"),
    description_pt: z.string().optional(),
    description_en: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

export function CategoryDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
    })

    const onSubmit = async (data: CategoryFormValues) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(typeof err?.error === "string" ? err.error : "Falha ao criar categoria.")
            }

            setOpen(false)
            reset()
            router.refresh()
        } catch (e) {
            console.error(e)
            setError(e instanceof Error ? e.message : "Falha ao criar categoria.")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) setError(null)
        setOpen(next)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                    <DialogDescription>
                        Crie uma nova categoria para agrupar serviços.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name_pt">Nome (PT)</Label>
                            <Input id="name_pt" {...register("name_pt")} />
                            {errors.name_pt && <span className="text-red-500 text-xs">{errors.name_pt.message}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name_en">Nome (EN)</Label>
                            <Input id="name_en" {...register("name_en")} />
                            {errors.name_en && <span className="text-red-500 text-xs">{errors.name_en.message}</span>}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description_pt">Descrição (PT)</Label>
                        <Input id="description_pt" {...register("description_pt")} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description_en">Descrição (EN)</Label>
                        <Input id="description_en" {...register("description_en")} />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "A criar..." : "Criar Categoria"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
