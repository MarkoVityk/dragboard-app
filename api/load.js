import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  const { data, error } = await supabase
    .from("boards")
    .select("data")
    .eq("id", id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Board not found" });
  }

  res.status(200).json(data.data);
}
