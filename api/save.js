// pages/api/save.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { id: providedId, data: boardData } = req.body;

    if (!boardData || !Array.isArray(boardData)) {
      return res.status(400).json({ error: "Invalid board data" });
    }

    let id = providedId;

    if (!id) {
      // Generate 4-digit ID
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
    }

    const { error: upsertError } = await supabase
      .from("boards")
      .upsert([{ id, data: boardData }]);

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return res.status(500).json({ error: upsertError.message });
    }

    res.status(200).json({ id });
  } catch (e) {
    console.error("Server error:", e);
    res.status(500).json({ error: e.message || "Internal Server Error" });
  }
}
