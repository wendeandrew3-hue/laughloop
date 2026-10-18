// LaughLoop checkout page — 4-step checkout mirroring the reference flow
(() => {
  const $ = (s) => document.querySelector(s);

  const SHOWS = {
    pp:  { id: 'pp',  title: 'Punchline Playground',  cat: 'STAND-UP',        date: 'Sat, Oct 24', full: 'Sat, Oct 24, 2026', time: '7:00 PM', price: 15, color: '#e7a900' },
    mic: { id: 'mic', title: 'Mic Check: Open Mic',   cat: 'OPEN MIC',        date: 'Sun, Nov 1',  full: 'Sun, Nov 1, 2026',  time: '6:30 PM', price: 8,  color: '#b45641' },
    lad: { id: 'lad', title: 'Laugh After Dark',      cat: 'COMEDY & MUSIC',  date: 'Sat, Nov 7',  full: 'Sat, Nov 7, 2026',  time: '8:00 PM', price: 18, color: '#6d5b91' },
    imp: { id: 'imp', title: 'The Improv Experiment', cat: 'IMPROV',          date: 'Sun, Nov 15', full: 'Sun, Nov 15, 2026', time: '6:00 PM', price: 12, color: '#4d7d71' }
  };
  const KEY = 'laughloop-cart';

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { cart = {}; }
  const save = () => localStorage.setItem(KEY, JSON.stringify(cart));
  const entries = () => Object.entries(cart);
  const qtyTotal = () => entries().reduce((a, [, q]) => a + q, 0);
  const priceTotal = () => entries().reduce((a, [id, q]) => a + SHOWS[id].price * q, 0);
  const money = (c) => '$' + (c / 100).toFixed(2);

  function toast(msg) {
    $('#toast-msg').textContent = msg;
    const t = $('#toast');
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 3200);
  }

  function render() {
    const list = $('#tix-list');
    const n = qtyTotal();
    $('#tix-count').textContent = n + (n === 1 ? ' ticket' : ' tickets') + ' in your order.';
    if (!entries().length) {
      $('#co-main').innerHTML = `<div class="empty-cart"><h1 class="co-h1">No tickets <em>yet.</em></h1><p class="co-sub" style="margin:10px 0 18px">Your cart is empty. Head back and pick your night.</p><a href="/#shows">← Back to the lineup</a></div>`;
      return;
    }
    list.innerHTML = entries().map(([id, q]) => {
      const s = SHOWS[id];
      return `<div class="tix-row">
        <div><h3>${s.title}</h3><p class="tix-meta">${s.full} · ${s.time} · Harare · Venue announced soon</p></div>
        <div class="tix-right">
          <span class="tix-price">${money(s.price * 100 * q)}</span>
          <span class="qty"><button data-qty="-1" data-id="${id}" aria-label="One less" type="button">−</button><span>${q}</span><button data-qty="1" data-id="${id}" aria-label="One more" type="button">+</button></span>
          <button class="del" data-del="${id}" aria-label="Remove ${s.title}" type="button">🗑</button>
        </div></div>`;
    }).join('');
    list.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      cart[id] = Math.max(0, (cart[id] || 0) + Number(b.dataset.qty));
      if (!cart[id]) delete cart[id];
      save(); render();
    });
    list.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      delete cart[b.dataset.del]; save(); render();
    });

    $('#side-cards').innerHTML = entries().map(([id, q]) => {
      const s = SHOWS[id];
      return `<div class="side-card" style="background:${s.color};color:var(--ink)">
        <p class="sc-top">${s.cat} · LAUGHLOOP</p><p class="sc-title">${s.title}</p>
        <span class="sc-badge">${String(q).padStart(2, '0')} TIX</span></div>`;
    }).join('');
    $('#side-lines').innerHTML = entries().map(([id, q]) => {
      const s = SHOWS[id];
      return `<div class="side-line"><span>${s.title} × ${q}</span><span>${money(s.price * 100 * q)}</span></div>`;
    }).join('') + `<div class="side-line"><span>Fees</span><span class="side-fees">Shown at secure checkout</span></div>`;
    $('#side-total').textContent = money(priceTotal() * 100);
    $('#place-amount').textContent = money(priceTotal() * 100);
  }

  // card brand selection: clickable chips, auto-detected from the typed number
  const chips = [...document.querySelectorAll('.card-logo')];
  const detectBrand = (d) => d.startsWith('4') ? 'Visa' : d.startsWith('5') ? 'Mastercard' : d.startsWith('3') ? 'Amex' : d.startsWith('6') ? 'Discover' : 'Card';
  const press = (brand) => chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.brand === brand)));
  chips.forEach(c => c.addEventListener('click', () => press(c.dataset.brand)));

  // light card formatting, numbers never leave the browser beyond brand + last4
  $('#cc-num').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    press(detectBrand(e.target.value));
  });
  $('#cc-cvc').addEventListener('input',(e)=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,4)});
$('#cc-exp').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  });

  $('#co-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!e.target.reportValidity()) return;
    const digits = String(fd.get('cardnumber') || '').replace(/\D/g, '');
    if (digits.length < 12) { toast('Check the card number.'); return; }
    const brand = detectBrand(digits);
    const items = entries().map(([id, q]) => ({ title: SHOWS[id].title, date: SHOWS[id].date, qty: q, price_cents: SHOWS[id].price * 100 }));
    const body = {
      name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'),
      billing: {
        name: fd.get('billing_name'), address1: fd.get('address1'), address2: fd.get('address2'),
        city: fd.get('city'), region: fd.get('region'), postal_code: fd.get('postal_code'), country: fd.get('country')
      },
      items, total_cents: priceTotal() * 100,
      card: { brand, last4: digits.slice(-4), exp: fd.get('exp') }
    };
    const btn = $('#place-btn');
    btn.disabled = true;
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      const { reference } = await r.json();
      cart = {}; save();
      document.querySelector('.co-main').innerHTML = `<div class="done">
        <p class="star">✳</p>
        <h2>You’re in.</h2>
        <p>Order ${reference} received. Watch your email — we’ll confirm payment and your tickets.</p>
        <a class="button" href="/#shows">Back to the laughs</a>
      </div>`;
      window.scrollTo(0, 0);
    } catch {
      toast('Order didn’t go through. Try again in a moment.');
    } finally {
      btn.disabled = false;
    }
  });

  render();
})();
