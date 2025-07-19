// /api/load.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  const { data, error } = await supabase
    .from("boards")
    .select("data")
    .eq("id", id.toString()) // Ensure string match
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error.message);
    return res.status(500).json({ error: "Database error" });
  }

  if (!data) {
    return res.status(404).json({ error: "Board not found" });
  }

  return res.status(200).json(data.data); // note: data.data because supabase returns { data: { data: ... } }
}
