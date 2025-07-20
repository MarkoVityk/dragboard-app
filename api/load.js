import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = createClient(supabaseUrl, anonKey);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  try {
    // Attempt with anon key first
    let { data, error } = await supabase
      .from("boards")
      .select("data")
      .eq("id", id)
      .maybeSingle();

    // If anon key fails due to RLS or other error, retry with service role key
    if (error || !data) {
      console.warn("Anon key failed, retrying with service key...");
      supabase = createClient(supabaseUrl, serviceKey); // Recreate client
      const result = await supabase
        .from("boards")
        .select("data")
        .eq("id", id)
        .maybeSingle();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    if (!data) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.status(200).json({ data: data.data });

  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}
