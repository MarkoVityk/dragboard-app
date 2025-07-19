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

  const id = req.query.id;
  console.log("Loading board with ID:", id);

  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  const { data, error } = await supabase
    .from("boards")
    .select("data")
    .eq("id", id)
    .single();

  console.log("Data:", data);
  console.log("Error:", error);

  if (error || !data) {
    return res.status(404).json({ error: "Board not found" });
  }

  res.status(200).json(data.data);
}
