import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const formData = await request.formData();
    
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${type}-${Date.now()}.${ext}`;
    const path = `branding/${filename}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("public")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
    
    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("public")
      .getPublicUrl(path);
    
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
