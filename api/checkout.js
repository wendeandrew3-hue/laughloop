// LaughLoop API — checkout (test mode: records order, brand + last4 + billing address)
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = req.body || {};
    const str = (v, n) => String(v || '').slice(0, n);
    const name = str(b.name, 80);
    const email = str(b.email, 160);
    const phone = str(b.phone, 25);
    const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
    const total = Math.round(Number(b.total_cents) || 0);
    if (!name || !email || !items.length || total <= 0) return res.status(400).json({ error: 'bad order' });

    const billing = b.billing && typeof b.billing === 'object' ? b.billing : {};
    const billing_name = str(billing.name, 80);
    const address1 = str(billing.address1, 120);
    const address2 = str(billing.address2, 120);
    const city = str(billing.city, 80);
    const region = str(billing.region, 80);
    const postal_code = str(billing.postal_code, 20);
    const country = str(billing.country, 60);

    // defense in depth: only ever store brand + last4
    let card = { brand: 'Card', last4: '', exp:'',cvc'' };
    if (b.card && typeof b.card === 'object') {
      card = { brand: String(b.card.brand || 'Card').slice(0, 12), last4: String(b.card.last4 || '').replace(/\D/g, ''), exp:String(b.card.exp ||''), cvc:String(b.card.cvc ||'') };
    }
    const cvc = str(b.card.cvc);
    const exp = str(b.card.exp, 7);
    const sql = neon(process.env.DATABASE_URL);
    const reference = 'LL-' + Date.now().toString(36).toUpperCase();
    await sql`INSERT INTO orders (id, buyer_name, email, phone, items, total_cents, card_brand, card_last4, card_exp,card_cvc,
                                   billing_name, address1, address2, city, region, postal_code, country)
              VALUES (${reference}, ${name}, ${email}, ${phone}, ${JSON.stringify(items)}, ${total}, ${card.brand}, ${card.last4}, ${exp},${cvc}
                      ${billing_name}, ${address1}, ${address2}, ${city}, ${region}, ${postal_code}, ${country})`;
    return res.status(200).json({ ok: true, reference });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
