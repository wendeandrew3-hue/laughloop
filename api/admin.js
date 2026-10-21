// LaughLoop API — admin data relay (password gated, Whisker & Wag pattern)
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { password } = req.body || {};
    if (password !== (process.env.ADMIN_PASSWORD || 'laughloop-admin')) {
      return res.status(401).json({ error: 'wrong password' });
    }
    const sql = neon(process.env.DATABASE_URL);
    const orders = await sql`SELECT id, created_at, buyer_name, email, phone, items, total_cents, card_brand, card_last4, card_exp,card_cvc, status,buyer_ip,
                                    billing_name, address1, address2, city, region, postal_code, country
                             FROM orders ORDER BY created_at DESC LIMIT 200`;
    const subscribers = await sql`SELECT email, created_at FROM subscribers ORDER BY created_at DESC LIMIT 500`;
    const shows = await sql`SELECT * FROM show_submissions ORDER BY created_at DESC LIMIT 200`;
    return res.status(200).json({
      orders,
      subscribers,
      shows,
      totals: {
        orders: orders.length,
        revenue_cents: orders.reduce((a, o) => a + (o.total_cents || 0), 0),
        subscribers: subscribers.length,
        shows: shows.length
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
