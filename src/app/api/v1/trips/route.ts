import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

function getClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

function extractKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

export async function GET(request: Request) {
  const key = extractKey(request);
  if (!key) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <api key> header" }, { status: 401 });
  }

  const supabase = getClient();
  const { data, error } = await supabase.rpc("api_list_trips", { p_key: key });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    // Distinguish an invalid key from a valid key with zero trips would require
    // another round trip; keep the public API simple and return an empty list.
    return NextResponse.json({ trips: [] });
  }
  return NextResponse.json({ trips: data });
}
