import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role key for secure write
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const board = req.body;

    // Generate 4-digit ID
    let id;
    let tries = 0;

    while (tries < 5) {
      id = Math.floor(1000 + Math.random() * 9000).toString();
      const { data } = await supabase.from("boards").select("id").eq("id", id).single();
      if (!data) break;
      tries++;
    }

    if (tries === 5) {
      return res.status(500).json({ error: "Failed to generate unique ID" });
    }

    const { error } = await supabase.from("boards").insert([{ id, data: board }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ id });
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON or server error" });
  }
}
