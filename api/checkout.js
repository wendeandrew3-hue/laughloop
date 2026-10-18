// LaughLoop API — checkout (test mode: records order, brand + last4 only)
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = req.body || {};
    const name = String(b.name || '').slice(0, 80);
    const email = String(b.email || '').slice(0, 160);
    const phone = String(b.phone || '').slice(0, 25);
    const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
    const total = Math.round(Number(b.total_cents) || 0);
    if (!name || !email || !items.length || total <= 0) return res.status(400).json({ error: 'bad order' });

    // defense in depth: only ever store brand + last4
    let card = { brand: 'Card', last4: '' };
    if (b.card && typeof b.card === 'object') {
      card = { brand: String(b.card.brand || 'Card').slice(0, 12), last4: String(b.card.last4 || '').replace(/\D/g, '').slice(-4) };
    }
    const sql = neon(process.env.DATABASE_URL);
    const reference = 'LL-' + Date.now().toString(36).toUpperCase();
    await sql`INSERT INTO orders (id, buyer_name, email, phone, items, total_cents, card_brand, card_last4)
              VALUES (${reference}, ${name}, ${email}, ${phone}, ${JSON.stringify(items)}, ${total}, ${card.brand}, ${card.last4})`;
    return res.status(200).json({ ok: true, reference });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
