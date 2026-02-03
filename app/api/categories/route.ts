
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    const { data: maxRow } = await supabase
        .from("service_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;
    const payload = {
        name_pt: body.name_pt ?? "",
        name_en: body.name_en ?? "",
        description_pt: body.description_pt ?? null,
        description_en: body.description_en ?? null,
        icon: body.icon ?? null,
        sort_order: body.sort_order ?? nextSortOrder,
        is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
        .from("service_categories")
        .insert(payload)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
