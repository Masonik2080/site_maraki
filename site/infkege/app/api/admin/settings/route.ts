import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// GET all settings
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("site_settings")
      .select("*");
    
    if (error) {
      // If table doesn't exist, return empty object
      return NextResponse.json({});
    }
    
    // Convert array to object by category
    const settings: Record<string, Record<string, unknown>> = {};
    data?.forEach((row: { category: string; key: string; value: unknown }) => {
      if (!settings[row.category]) {
        settings[row.category] = {};
      }
      settings[row.category][row.key] = row.value;
    });
    
    return NextResponse.json(settings);
  } catch (e) {
    console.error("Settings GET error:", e);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
