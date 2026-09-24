/**
 * VERBUM — app.js (Mobile-First rewrite)
 * Renderização de produtos, carrinho, gatilhos de venda,
 * notificações de prova social, countdown de urgência
 */

// ═══════════════════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════════════════
let cart = JSON.parse(localStorage.getItem('verbum_cart') || '[]');
let cartOpen = false;
let modalProduct = null;
let modalIndex  = 0;

// ═══════════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════════
function encSrc(raw) {
  return raw.split('/').map(s => encodeURIComponent(s)).join('/');
}

function formatBRL(v) {
  return 'R$\u00a0' + parseFloat(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function priceFrom(real) { return parseFloat(real) / 0.55; }

// ═══════════════════════════════════════════════════════
//  RENDERIZAÇÃO DE PRODUTOS
// ═══════════════════════════════════════════════════════
function renderProducts() {
  const bibGrid = document.getElementById('biblias-grid');
  const accGrid = document.getElementById('acessorios-grid');

  PRODUCTS.forEach(p => {
    const card = buildCard(p);
    if (p.category === 'biblia'    && bibGrid) bibGrid.appendChild(card);
    if (p.category === 'acessorio' && accGrid) accGrid.appendChild(card);
  });
}

function buildCard(p) {
  const el = document.createElement('article');
  el.className = 'product-item-card';
  el.setAttribute('role', 'listitem');
  el.dataset.id = p.id;

  const hasPrice = p.price > 0;
  const isLow    = p.stock <= 3;
  const stockPct = Math.min((p.stock / 10) * 100, 100);

  // ── Preço HTML ──
  let priceHtml = '';
  if (hasPrice) {
    const pFrom = priceFrom(p.price);
    priceHtml = `
      <div class="product-pricing-box">
        <div class="product-price-from">${formatBRL(pFrom)}</div>
        <div class="product-price-current">
          <span>${formatBRL(p.price)}</span>
          <span class="product-discount-pill">–45% OFF</span>
        </div>
      </div>`;
  } else {
    priceHtml = `<div class="product-pricing-box"><div class="price-placeholder">Aguardando disponibilidade</div></div>`;
  }

  // ── Thumbnails (só se houver múltiplas) ──
  let thumbsHtml = '';
  if (p.images.length > 1) {
    thumbsHtml = `<div class="product-thumbs-bar" role="list" aria-label="Imagens do produto">` +
      p.images.map((img, i) =>
        `<img class="product-thumb-btn ${i === 0 ? 'active' : ''}"
              src="${encSrc(img)}"
              alt="Imagem ${i + 1}"
              loading="lazy"
              role="listitem"
              onclick="switchImg(${p.id}, ${i})"
              onerror="this.style.display='none'">`
      ).join('') +
      `</div>`;
  }

  el.innerHTML = `
    <!-- Frame da imagem -->
    <div class="product-media-wrap" onclick="openModal(${p.id}, 0)"
         role="button" tabindex="0"
         aria-label="Ver imagens de ${p.name}"
         onkeydown="if(event.key==='Enter')openModal(${p.id},0)">
      <span class="product-badge-float">${isLow ? 'Restam ' + p.stock + ' un.' : '⭐ Destaque'}</span>
      <img class="product-img-main"
           id="card-main-${p.id}"
           src="${encSrc(p.images[0])}"
           alt="${p.name}"
           loading="lazy"
           onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23F7F5EF%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%22200%22 y=%22150%22 font-size=%2216%22 text-anchor=%22middle%22 fill=%22%23B08D57%22%3E✝ Manancial Store%3C/text%3E%3C/svg%3E'">
    </div>

    ${thumbsHtml}

    <!-- Conteúdo -->
    <div class="product-content-body">
      <h3 class="product-item-title">${p.name}</h3>
      <p class="product-item-desc">${p.description}</p>
      ${priceHtml}
      
      <div class="product-delivery-note">
        <span>⏳ Produção: <strong>4 dias</strong></span>
        <span>·</span>
        <span>🚚 Frete: <strong>7 dias</strong></span>
      </div>

      <button class="btn-card-action" onclick="handlePersonalizeClick(${p.id})">
        <span>Personalizar meu Exemplar</span>
        <span>→</span>
      </button>
    </div>`;

  return el;
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (item) item.classList.toggle('active');
}

// Troca imagem principal ao clicar na thumbnail
function switchImg(productId, index) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  const mainImg = document.getElementById(`card-main-${productId}`);
  if (mainImg) mainImg.src = encSrc(p.images[index]);

  const card = document.querySelector(`.product-item-card[data-id="${productId}"]`);
  if (card) {
    card.querySelectorAll('.product-thumb-btn').forEach((t, i) =>
      t.classList.toggle('active', i === index));
  }
}

// ═══════════════════════════════════════════════════════
//  MODAL DE IMAGENS
// ═══════════════════════════════════════════════════════
function openModal(productId, startIndex) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  modalProduct = p;
  modalIndex   = startIndex;
  updateModal();
  const m = document.getElementById('image-modal');
  if (m) m.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function updateModal() {
  if (!modalProduct) return;
  const imgEl   = document.getElementById('img-modal-main');
  const thumbEl = document.getElementById('img-modal-thumbs');
  if (imgEl) {
    imgEl.src = encSrc(modalProduct.images[modalIndex]);
    imgEl.alt = `${modalProduct.name} — imagem ${modalIndex + 1}`;
  }
  if (thumbEl) {
    thumbEl.innerHTML = modalProduct.images.map((img, i) =>
      `<img class="img-modal-thumb ${i === modalIndex ? 'active' : ''}"
            src="${encSrc(img)}"
            alt="Imagem ${i + 1}"
            onclick="setModalImg(${i})"
            loading="lazy">`
    ).join('');
  }
}

function setModalImg(index) { modalIndex = index; updateModal(); }

function closeModal() {
  const m = document.getElementById('image-modal');
  if (m) m.classList.add('hidden');
  document.body.style.overflow = '';
  modalProduct = null;
}

// ═══════════════════════════════════════════════════════
//  CARRINHO
// ═══════════════════════════════════════════════════════
function saveCart() {
  localStorage.setItem('verbum_cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }

  saveCart();
  bumpCartCount();
  openCartDrawer();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  renderCartItems();
}

function updateCartCount() {
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = total;
}

function bumpCartCount() {
  const el = document.getElementById('cart-count');
  if (el) {
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 300);
  }
}

// ═══════════════════════════════════════════════════════
//  MODAL DE OPÇÕES DA BÍBLIA (VERSÃO & TAMANHO DA LETRA)
// ═══════════════════════════════════════════════════════
let currentOptionsProduct = null;

function handlePersonalizeClick(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  if (p.category === 'biblia') {
    openBibleOptionsModal(p);
  } else {
    addToCart(productId);
  }
}

function openBibleOptionsModal(product) {
  currentOptionsProduct = product;
  const modal = document.getElementById('bible-options-modal');
  const imgEl = document.getElementById('opt-product-img');
  const nameEl = document.getElementById('opt-product-name');
  const priceEl = document.getElementById('opt-product-price');

  if (imgEl && product.images?.[0]) imgEl.src = encSrc(product.images[0]);
  if (nameEl) nameEl.textContent = product.name;
  if (priceEl) priceEl.textContent = formatBRL(product.price);

  // Seleciona ARA por padrão (com a badge ⭐ Mais Pedida)
  const araCard = document.querySelector('.opt-version-card input[value="ARA"]')?.closest('.opt-version-card');
  if (araCard) selectVersionCard(araCard);

  const lgCard = document.querySelector('.opt-font-card input[value="Letra Grande"]')?.closest('.opt-font-card');
  if (lgCard) selectFontSizeCard(lgCard);

  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeBibleOptionsModal() {
  const modal = document.getElementById('bible-options-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  currentOptionsProduct = null;
}

function selectVersionCard(card) {
  document.querySelectorAll('.opt-version-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const radio = card.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
}

function selectFontSizeCard(card) {
  document.querySelectorAll('.opt-font-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const radio = card.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
}

function confirmBibleOptions() {
  if (!currentOptionsProduct) return;

  const version = document.querySelector('input[name="bible-version"]:checked')?.value || 'ARA';
  const fontSize = document.querySelector('input[name="bible-font-size"]:checked')?.value || 'Letra Grande';

  // Adiciona ao carrinho com as opções escolhidas
  const existing = cart.find(i => i.id === currentOptionsProduct.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
    existing.versao = version;
    existing.tamanhoLetra = fontSize;
  } else {
    cart.push({
      id: currentOptionsProduct.id,
      qty: 1,
      versao: version,
      tamanhoLetra: fontSize
    });
  }

  saveCart();
  closeBibleOptionsModal();

  // Avança direto para o checkout para preencher nome e dados de gravação
  window.location.href = 'checkout.html';
}

function renderCartItems() {
  const wrap = document.getElementById('cart-items-list');
  const chkBtn = document.getElementById('cart-checkout-btn');
  if (!wrap) return;

  if (cart.length === 0) {
    wrap.innerHTML = '<div class="cart-empty-msg">Sua cestinha está vazia.<br><small>Escolha uma Bíblia para começar.</small></div>';
    if (chkBtn) chkBtn.classList.add('hidden');
    return;
  }

  let total = 0;
  wrap.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    total += p.price * (item.qty || 1);
    const versionLabel = item.versao ? `<div style="font-size:0.75rem;color:var(--gold);font-style:italic;margin-top:2px;">Versão: ${item.versao} · ${item.tamanhoLetra}</div>` : '';
    return `
      <div class="cart-item">
        <img class="cart-item-img"
             src="${encSrc(p.images[0])}"
             alt="${p.name}"
             onerror="this.style.display='none'"
             loading="lazy">
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          ${versionLabel}
          <div class="cart-item-price">${p.price > 0 ? formatBRL(p.price) : 'Valor a confirmar'}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${p.id})" aria-label="Remover ${p.name}">✕</button>
      </div>`;
  }).join('');

  const totalEl = document.getElementById('cart-total-value');
  if (totalEl) totalEl.textContent = total > 0 ? formatBRL(total) : 'A confirmar';
  if (chkBtn) chkBtn.classList.remove('hidden');
}

function openCartDrawer() {
  const overlay = document.getElementById('cart-overlay');
  const drawer  = document.getElementById('cart-drawer');
  if (overlay) { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); }
  if (drawer)  drawer.classList.add('open');
  cartOpen = true;
  document.body.style.overflow = 'hidden';
  renderCartItems();
}

function closeCartDrawer() {
  const overlay = document.getElementById('cart-overlay');
  const drawer  = document.getElementById('cart-drawer');
  if (overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); }
  if (drawer)  drawer.classList.remove('open');
  cartOpen = false;
  document.body.style.overflow = '';
}

function goToCheckout() {
  if (cart.length === 0) return;
  window.location.href = 'checkout.html';
}

// ═══════════════════════════════════════════════════════
//  GATILHO: PROVA SOCIAL (notificações)
// ═══════════════════════════════════════════════════════
const BUYERS = [
  { name: 'Maria S.', city: 'São Paulo', product: 'Bíblia Courino Caramelo Floral' },
  { name: 'Ana C.', city: 'Belo Horizonte', product: 'Bíblia Linho Girassol' },
  { name: 'Juliana M.', city: 'Curitiba', product: 'Bíblia Courino Nude Floral' },
  { name: 'Fernanda R.', city: 'Fortaleza', product: 'Bíblia Mulheres Azul Vintage' },
  { name: 'Carla B.', city: 'Recife', product: 'Bíblia Courino Oliva Floral' },
  { name: 'Lucas T.', city: 'Brasília', product: 'Bíblia Couro Preto Cruz JESUS' },
  { name: 'Rafael A.', city: 'Porto Alegre', product: 'Bíblia Courino Preto Espada' },
  { name: 'Thiago N.', city: 'Salvador', product: 'Bíblia Courino Caramelo Leão' },
  { name: 'Patrícia O.', city: 'Manaus', product: 'Bíblia Courino Caramelo Pombinha' },
  { name: 'Isabela F.', city: 'Campinas', product: 'Bíblia Jardim de Margaridas' },
  { name: 'Marcelo V.', city: 'Belém', product: 'Bíblia Courino Marrom Josué 1.9' },
  { name: 'Camila P.', city: 'Goiânia', product: 'Bíblia Mãos Entrelaçadas' },
];

const TIME_HINTS = ['agora mesmo', 'há 2 min', 'há 5 min', 'há 9 min'];
let buyerIdx = 0;

function showSocialProof() {
  const buyer = BUYERS[buyerIdx % BUYERS.length];
  buyerIdx++;
  const time = TIME_HINTS[Math.floor(Math.random() * TIME_HINTS.length)];

  const container = document.getElementById('notification-container');
  if (!container) return;

  const n = document.createElement('div');
  n.className = 'notif';
  n.setAttribute('role', 'status');
  n.innerHTML = `
    <div class="notif-ico" aria-hidden="true">✝</div>
    <div class="notif-txt">
      <div class="notif-name">${buyer.name} · ${buyer.city}</div>
      <div class="notif-action">acabou de personalizar a <em>${buyer.product}</em> ❤️</div>
      <div class="notif-time">${time}</div>
    </div>`;

  container.appendChild(n);
  setTimeout(() => {
    n.classList.add('out');
    setTimeout(() => n.remove(), 380);
  }, 5500);
}

function startSocialProof() {
  setTimeout(() => {
    showSocialProof();
    setInterval(showSocialProof, 16000 + Math.random() * 9000);
  }, 5000);
}

// ═══════════════════════════════════════════════════════
//  GATILHO: COUNTDOWN DE URGÊNCIA
// ═══════════════════════════════════════════════════════
function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  const DURATION = 3 * 60 * 60 * 1000;
  let exp = parseInt(localStorage.getItem('verbum_offer_exp') || '0');

  if (!exp || Date.now() > exp) {
    exp = Date.now() + DURATION;
    localStorage.setItem('verbum_offer_exp', exp);
  }

  const tick = () => {
    const rem = Math.max(0, exp - Date.now());
    if (rem === 0) {
      exp = Date.now() + DURATION;
      localStorage.setItem('verbum_offer_exp', exp);
    }
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  function pad(n) { return String(n).padStart(2, '0'); }
  tick();
  setInterval(tick, 1000);
}

// ═══════════════════════════════════════════════════════
//  BINDINGS DE EVENTOS
// ═══════════════════════════════════════════════════════
function bindEvents() {
  // Cart toggle
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', () => {
    cartOpen ? closeCartDrawer() : openCartDrawer();
  });

  // Fechar overlay e drawer
  const overlay  = document.getElementById('cart-overlay');
  const closeBtn = document.getElementById('cart-close-btn');
  if (overlay)  overlay.addEventListener('click', closeCartDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

  // Ir para checkout
  const chkBtn = document.getElementById('cart-checkout-btn');
  if (chkBtn) chkBtn.addEventListener('click', goToCheckout);

  // Fechar modal de imagem
  const imgModalClose = document.getElementById('image-modal-close');
  if (imgModalClose) imgModalClose.addEventListener('click', closeModal);

  // Fechar modal clicando no fundo
  const imgModal = document.getElementById('image-modal');
  if (imgModal) imgModal.addEventListener('click', e => {
    if (e.target === imgModal) closeModal();
  });

  // Teclado: ESC fecha; setas navegam imagens
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeCartDrawer();
    }
    if (modalProduct) {
      if (e.key === 'ArrowRight') setModalImg((modalIndex + 1) % modalProduct.images.length);
      if (e.key === 'ArrowLeft')  setModalImg((modalIndex - 1 + modalProduct.images.length) % modalProduct.images.length);
    }
  });
}

// ═══════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartCount();
  bindEvents();
  startCountdown();
  startSocialProof();
});
