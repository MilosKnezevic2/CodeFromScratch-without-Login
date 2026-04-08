import { NextResponse } from "next/server";
import { getCategoriesWithCounts } from "@/lib/sanity/queries";

export async function GET() {
  const categories = await getCategoriesWithCounts();
  return NextResponse.json({ categories });
}
