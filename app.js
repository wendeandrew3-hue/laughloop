// LaughLoop client — cart, filters, modals, newsletter, show submissions, test-mode checkout
(() => {
  const $ = (s) => document.querySelector(s);

  const SHOWS = {
    pp:  { id: 'pp',  title: 'Punchline Playground',    date: 'Sat, Oct 24', time: '7:00 PM',  price: 15 },
    mic: { id: 'mic', title: 'Mic Check: Open Mic',      date: 'Sun, Nov 1',  time: '6:30 PM',  price: 8  },
    lad: { id: 'lad', title: 'Laugh After Dark',        date: 'Sat, Nov 7',  time: '8:00 PM',  price: 18 },
    imp: { id: 'imp', title: 'The Improv Experiment',   date: 'Sun, Nov 15', time: '6:00 PM',  price: 12 }
  };
  const KEY = 'laughloop-cart';

  // ---------- cart ----------
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { cart = {}; }

  const save = () => localStorage.setItem(KEY, JSON.stringify(cart));
  const qtyTotal = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const priceTotal = () => Object.entries(cart).reduce((a, [id, q]) => a + SHOWS[id].price * q, 0);
  const money = (c) => '$' + (c / 100).toFixed(2);

  function renderBadge() {
    const n = qtyTotal();
    $('#cart-count').textContent = n;
    $('#cart-open').setAttribute('aria-label', `Open cart, ${n} ticket${n === 1 ? '' : 's'}`);
  }

  function renderCart() {
    const items = $('#cart-items');
    const entries = Object.entries(cart);
    $('#cart-head-count').textContent = qtyTotal() + (qtyTotal() === 1 ? ' ticket' : ' tickets');
    $('#cart-total').textContent = money(priceTotal() * 100);
    $('#cart-foot').style.display = entries.length ? '' : 'none';
    if (!entries.length) {
      items.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">✳</div><h3>No tickets yet.</h3><p>Pick a night below and it’ll show up right here.</p><button class="cart-continue" id="cart-keep-shopping">See the lineup</button></div>`;
      const b = $('#cart-keep-shopping');
      if (b) b.onclick = () => { closeCart(); location.hash = '#shows'; };
      return;
    }
    items.innerHTML = entries.map(([id, q]) => {
      const s = SHOWS[id];
      return `<div class="cart-line"><div><p class="cart-line-title">${s.title}</p><p class="cart-line-meta">${s.date} · ${s.time}</p></div><span class="cart-line-price">${money(s.price * 100 * q)}</span><div class="cart-line-actions"><span class="qty-control"><button data-qty="-1" data-id="${id}" aria-label="One less">−</button><span>${q}</span><button data-qty="1" data-id="${id}" aria-label="One more">+</button></span><button class="cart-remove" data-remove="${id}">Remove</button></div></div>`;
    }).join('');
    items.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      cart[id] = Math.max(0, (cart[id] || 0) + Number(b.dataset.qty));
      if (!cart[id]) delete cart[id];
      save(); renderBadge(); renderCart();
    });
    items.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
      delete cart[b.dataset.remove]; save(); renderBadge(); renderCart();
    });
  }

  function addToCart(id) {
    if (!SHOWS[id]) return;
    cart[id] = (cart[id] || 0) + 1;
    save(); renderBadge();
    toast(`${SHOWS[id].title} added to cart.`);
  }

  // ---------- drawer / modals ----------
  const openCart = () => { renderCart(); $('#cart-backdrop').hidden = false; };
  const closeCart = () => { $('#cart-backdrop').hidden = true; };

  function openModal(id) { $('#' + id).hidden = false; }
  function closeModal(id) { $('#' + id).hidden = true; }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeCart();
    ['show-modal', 'checkout-modal', 'success-modal'].forEach(closeModal);
  });
  $('#cart-backdrop').addEventListener('click', (e) => { if (e.target.id === 'cart-backdrop') closeCart(); });
  ['show-modal', 'checkout-modal', 'success-modal'].forEach(id => {
    $('#' + id).addEventListener('click', (e) => {
      if (e.target.id === id || e.target.closest('[data-close="' + id + '"]')) closeModal(id);
    });
  });

  $('#cart-open').onclick = openCart;
  $('#cart-close').onclick = closeCart;
  $('#add-show-btn').onclick = () => openModal('show-modal');
  $('#publish-show-btn').onclick = () => openModal('show-modal');
  document.querySelectorAll('.add-ticket').forEach(b => b.onclick = () => addToCart(b.dataset.id));

  // ---------- filters ----------
  document.querySelectorAll('.filter-chip').forEach(chip => chip.onclick = () => {
    document.querySelectorAll('.filter-chip').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-selected', 'false'); });
    chip.classList.add('active'); chip.setAttribute('aria-selected', 'true');
    const f = chip.dataset.filter;
    document.querySelectorAll('.show-card').forEach(card => {
      card.style.display = (f === 'All shows' || card.dataset.category === f) ? '' : 'none';
    });
  });

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    $('#toast-msg').textContent = msg;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 2600);
  }

  // ---------- newsletter ----------
  $('#newsletter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#newsletter-email').value.trim();
    if (!email) return;
    const note = $('#newsletter-note');
    try {
      const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      if (!r.ok) throw new Error();
      note.textContent = 'You’re in the loop. First email lands with the next show announcement.';
      $('#newsletter-email').value = '';
      toast('Subscribed. See you at the next one.');
    } catch {
      note.textContent = 'That didn’t go through. Try again in a moment.';
    }
  });

  // ---------- add a show ----------
  $('#show-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const r = await fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      closeModal('show-modal'); e.target.reset();
      toast('Show sent in. We’ll be in touch.');
    } catch {
      toast('Couldn’t send that. Try again in a moment.');
    }
  });

  // ---------- checkout (test mode) ----------
  $('#checkout-btn').onclick = () => {
    if (!qtyTotal()) return;
    $('#checkout-amount').textContent = money(priceTotal() * 100);
    closeCart(); openModal('checkout-modal');
  };

  // light card formatting, numbers never leave the browser beyond brand + last4
  $('#cc-num').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  });
  $('#cc-exp').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  });

  $('#checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const digits = String(fd.get('cardnumber') || '').replace(/\D/g, '');
    if (digits.length < 12) { toast('Check the card number.'); return; }
    const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : digits.startsWith('3') ? 'Amex' : 'Card';
    const items = Object.entries(cart).map(([id, q]) => ({ title: SHOWS[id].title, date: SHOWS[id].date, qty: q, price_cents: SHOWS[id].price * 100 }));
    const body = {
      name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'),
      items, total_cents: priceTotal() * 100,
      card: { brand, last4: digits.slice(-4), exp: fd.get('exp') }
    };
    const btn = $('#checkout-submit');
    btn.disabled = true; btn.style.opacity = '.6';
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      const { reference } = await r.json();
      cart = {}; save(); renderBadge();
      closeModal('checkout-modal'); e.target.reset();
      $('#success-copy').textContent = `Order ${reference} received. Watch your email — we’ll confirm payment and your tickets.`;
      openModal('success-modal');
    } catch {
      toast('Order didn’t go through. Try again in a moment.');
    } finally {
      btn.disabled = false; btn.style.opacity = '';
    }
  });

  renderBadge();
})();
