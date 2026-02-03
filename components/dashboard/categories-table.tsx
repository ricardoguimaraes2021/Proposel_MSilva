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
import { ServiceCategory } from "@/types"

interface CategoriesTableProps {
    categories: ServiceCategory[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhuma categoria encontrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">
                                    <div>{category.name.pt}</div>
                                    <div className="text-xs text-muted-foreground">{category.name.en}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[300px] truncate text-sm" title={category.description?.pt}>
                                        {category.description?.pt}
                                    </div>
                                </TableCell>
                                <TableCell>{category.sortOrder}</TableCell>
                                <TableCell>
                                    <Badge variant={category.isActive ? "default" : "secondary"}>
                                        {category.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
