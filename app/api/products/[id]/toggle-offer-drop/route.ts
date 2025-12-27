import { NextRequest, NextResponse } from "next/server";
import { toggleProductOfferDrop } from "@/lib/db";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const result = await toggleProductOfferDrop(params.id);
        if (result.success) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to toggle offer drop status" }, { status: 500 });
    }
}
