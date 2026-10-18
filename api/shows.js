// LaughLoop API — show submissions ("Add a show" / "Publish a show")
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = req.body || {};
    const title = String(b.title || '').trim().slice(0, 90);
    const date = String(b.date || '').trim().slice(0, 20);
    const time = String(b.time || '').trim().slice(0, 20);
    const city = String(b.city || '').trim().slice(0, 60);
    const contact_name = String(b.contact_name || '').trim().slice(0, 80);
    const contact_email = String(b.contact_email || '').trim().slice(0, 160);
    if (!title || !date || !time || !city || !contact_name || !contact_email) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const sql = neon(process.env.DATABASE_URL);
    await sql`INSERT INTO show_submissions
      (id, title, category, show_date, show_time, city, venue, price, description, contact_name, contact_email, contact_phone)
      VALUES (${crypto.randomUUID()}, ${title}, ${String(b.category || 'Other live show').slice(0, 40)},
              ${date}, ${time}, ${city}, ${String(b.venue || '').slice(0, 90)}, ${String(b.price || '').slice(0, 20)},
              ${String(b.description || '').slice(0, 300)}, ${contact_name}, ${contact_email}, ${String(b.contact_phone || '').slice(0, 25)})`;
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
