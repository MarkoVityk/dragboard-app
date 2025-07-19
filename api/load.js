// /api/load.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  // Check that id is a 4-digit string
  if (!/^\d{4}$/.test(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  const { data, error } = await supabase
    .from("boards")
    .select("data")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ error: "Board not found" });
  }

  return res.status(200).json(data.data);
}
