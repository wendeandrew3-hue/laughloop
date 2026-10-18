// LaughLoop API — subscribe (newsletter)
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { email } = req.body || {};
    const clean = String(email || '').trim().toLowerCase().slice(0, 160);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return res.status(400).json({ error: 'bad email' });
    const sql = neon(process.env.DATABASE_URL);
    await sql`INSERT INTO subscribers (id, email) VALUES (${crypto.randomUUID()}, ${clean})
              ON CONFLICT (email) DO NOTHING`;
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
