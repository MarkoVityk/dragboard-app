import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const board = req.body;
    if (!board) {
      return res.status(400).json({ error: "No board data provided" });
    }

    let id;
    let tries = 0;

    while (tries < 5) {
      id = Math.floor(1000 + Math.random() * 9000).toString();
      const { data, error } = await supabase
        .from("boards")
        .select("id")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase select error:", error);
      }

      if (!data) break;
      tries++;
    }

    if (tries === 5) {
      return res.status(500).json({ error: "Failed to generate unique ID" });
    }

    const { error: insertError } = await supabase
      .from("boards")
      .insert([{ id, data: board }]);

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return res.status(500).json({ error: insertError.message });
    }

    res.status(200).json({ id });
  } catch (e) {
    console.error("Server error:", e);
    res.status(500).json({ error: e.message || "Internal Server Error" });
  }
}
