"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PricingType, Service } from "@/types"
import { ServiceEditDialog } from "@/components/dashboard/service-edit-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ServicesTableProps {
    services: (Service & { includedCount: number; optionsCount: number })[]
    categories?: { id: string; name_pt: string }[]
}

const pricingTypeLabels: Record<PricingType, string> = {
    per_person: "Por pessoa",
    fixed: "Fixo",
    on_request: "Sob consulta",
}

export function ServicesTable({ services, categories }: ServicesTableProps) {
    const router = useRouter()

    const handleDelete = async (serviceId: string) => {
        const confirmed = window.confirm("Tem a certeza que pretende eliminar este servico?")
        if (!confirmed) return

        try {
            const response = await fetch(`/api/services/${serviceId}`, { method: "DELETE" })
            if (!response.ok) throw new Error("Failed to delete service")
            router.refresh()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço Base</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Incluidos</TableHead>
                        <TableHead>Opcoes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                Nenhum servico encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">
                                    <div>{service.name.pt}</div>
                                    <div className="text-xs text-muted-foreground">{service.name.en}</div>
                                </TableCell>
                                <TableCell>
                                    {service.category?.name.pt || "-"}
                                </TableCell>
                                <TableCell>
                                    {service.pricingType === "on_request"
                                        ? "Sob consulta"
                                        : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(service.basePrice ?? 0)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{pricingTypeLabels[service.pricingType]}</Badge>
                                </TableCell>
                                <TableCell>{service.includedCount}</TableCell>
                                <TableCell>{service.optionsCount}</TableCell>
                                <TableCell>
                                    <Badge variant={service.isActive ? "default" : "secondary"}>
                                        {service.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <ServiceEditDialog service={service} categories={categories} />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(service.id)}
                                            className="text-white hover:text-white"
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
