import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const CATEGORY = "analytics";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .eq("category", CATEGORY);
    
    if (error) {
      return NextResponse.json({});
    }
    
    const settings: Record<string, unknown> = {};
    data?.forEach((row: { key: string; value: unknown }) => {
      settings[row.key] = row.value;
    });
    
    return NextResponse.json(settings);
  } catch (e) {
    console.error("Analytics settings GET error:", e);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();
    
    const entries = Object.entries(body);
    for (const [key, value] of entries) {
      await supabase
        .from("site_settings")
        .upsert(
          { category: CATEGORY, key, value, updated_at: new Date().toISOString() },
          { onConflict: "category,key" }
        );
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Analytics settings POST error:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
