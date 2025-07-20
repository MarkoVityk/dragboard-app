import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("SUPABASE_URL", supabaseUrl);
console.log("SUPABASE_ANON_KEY", supabaseKey?.slice(0, 10));

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  try {
    const { data, error } = await supabase
      .from("boards")
      .select("data")
      .eq("id",id)
      .maybeSingle(); // ✅ tolerate no results instead of throwing

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    if (!data) {
      return res.status(404).json({ error: "Board not found" });
    }
    // ✅ Send back just the board data object
    res.status(200).json({ data: data.data });

  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}
