import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post('/api/save', async (req, res) => {
  const { id, data } = req.body;

  const { error } = await supabase
    .from('boards')
    .upsert({ id, data });

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Saved successfully' });
});

app.get('/api/load', async (req, res) => {
  const { id } = req.query;

  const { data, error } = await supabase
    .from('boards')
    .select('data')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Board not found' });

  res.status(200).json(data);
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
