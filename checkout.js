/**
 * MANANCIAL STORE — checkout.js
 * Inspirado no modelo Amarô / Yever
 * - Banners rotativos automáticos no topo
 * - Fluxo por etapas com validação rigorosa
 * - Geração de QR Code PIX com fallback infalível
 * - Cupom de desconto dinâmico
 * - Resumo interativo com controle de quantidade
 */

// ═══════════════════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════════════════
let currentStep = 1;
let cartItems   = [];
let cartTotal   = 0;
let couponDiscount = 0;
let appliedCouponCode = '';
let currentSlide = 0;
let sliderInterval = null;
let pollingInterval = null;

// ═══════════════════════════════════════════════════════
//  BANNERS ROTATIVOS (SLIDER DO TOPO)
// ═══════════════════════════════════════════════════════
function initSlider() {
  const slides = document.querySelectorAll('.co-slide');
  const dots   = document.querySelectorAll('.co-dot');
  if (!slides.length) return;

  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentSlide = index;
  }

  window.goToSlide = function(index) {
    showSlide(index);
    resetSliderTimer();
  };

  function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  function resetSliderTimer() {
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, 5000);
  }

  resetSliderTimer();
}

// ═══════════════════════════════════════════════════════
//  UTILITÁRIOS & FORMATAÇÃO
// ═══════════════════════════════════════════════════════
function encSrc(raw) {
  if (!raw) return '';
  return raw.split('/').map(s => encodeURIComponent(s)).join('/');
}

function fmt(v) {
  return 'R$\u00a0' + parseFloat(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function priceFrom(real) {
  return parseFloat(real) / 0.55;
}

function maskCPF(v) {
  return v.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function maskPhone(v) {
  return v.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    .slice(0, 15);
}

function maskCEP(v) {
  return v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

// ═══════════════════════════════════════════════════════
//  CARREGAMENTO DO CARRINHO & RESUMO DO PEDIDO
// ═══════════════════════════════════════════════════════
function loadCart() {
  const raw = localStorage.getItem('verbum_cart');
  if (!raw) {
    cartItems = [];
    cartTotal = 0;
    renderOrderSummary();
    return;
  }

  try {
    const saved = JSON.parse(raw);
    cartItems = saved.map(item => {
      const p = PRODUCTS.find(x => x.id === item.id);
      return p ? { ...item, product: p } : null;
    }).filter(Boolean);
  } catch (e) {
    console.error('Erro ao ler carrinho:', e);
    cartItems = [];
  }

  recalcTotal();
}

function recalcTotal() {
  cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * (item.qty || 1)), 0);
  renderOrderSummary();
}

function changeQty(index, delta) {
  if (!cartItems[index]) return;
  cartItems[index].qty = Math.max(1, (cartItems[index].qty || 1) + delta);
  localStorage.setItem('verbum_cart', JSON.stringify(cartItems));
  recalcTotal();
}

function renderOrderSummary() {
  const listEl      = document.getElementById('co-sum-items');
  const subtotalEl  = document.getElementById('sum-subtotal');
  const discountEl  = document.getElementById('sum-discount');
  const totalEl     = document.getElementById('sum-total-val');
  const instEl      = document.getElementById('sum-installment');
  const mobTotalEl  = document.getElementById('mobile-total-val');
  const mobCountEl  = document.getElementById('mobile-item-count');

  if (!listEl) return;

  if (cartItems.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 20px 0; color: var(--c-text-muted); font-size: 0.88rem;">
        Seu carrinho está vazio.<br>
        <a href="index.html" style="color: var(--c-primary); font-weight: 700; text-decoration: underline; margin-top: 6px; display: inline-block;">
          Ver Bíblias disponíveis
        </a>
      </div>`;
    if (subtotalEl) subtotalEl.textContent = 'R$ 0,00';
    if (discountEl) discountEl.textContent = '–R$ 0,00';
    if (totalEl)    totalEl.textContent    = 'R$ 0,00';
    if (mobTotalEl) mobTotalEl.textContent = 'R$ 0,00';
    return;
  }

  // Renderiza produtos com seletor de quantidade e versão
  listEl.innerHTML = cartItems.map((item, idx) => {
    const p = item.product;
    const thumb = p.images?.[0] ? encSrc(p.images[0]) : '';
    const originalUnitPrice = priceFrom(p.price);
    const spec = item.versao ? `Versão: ${item.versao} (${item.tamanhoLetra || 'Letra Grande'})` : '';

    return `
      <div class="co-sum-item-card">
        ${thumb ? `<img src="${thumb}" alt="${p.name}" class="co-sum-item-img" onerror="this.style.display='none'">` : ''}
        <div class="co-sum-item-info">
          <h4 class="co-sum-item-name">${p.name}</h4>
          ${spec ? `<div class="co-sum-item-spec">${spec}</div>` : ''}
          <div class="co-sum-qty-row">
            <button type="button" class="btn-qty" onclick="changeQty(${idx}, -1)" aria-label="Diminuir">-</button>
            <span class="qty-val">${item.qty || 1}</span>
            <button type="button" class="btn-qty" onclick="changeQty(${idx}, 1)" aria-label="Aumentar">+</button>
          </div>
        </div>
        <div class="co-sum-item-prices">
          <span class="co-item-price-from">${fmt(originalUnitPrice * (item.qty || 1))}</span>
          <strong class="co-item-price-to">${fmt(p.price * (item.qty || 1))}</strong>
        </div>
      </div>`;
  }).join('');

  // Cálculos de Total
  const originalTotalPrice = priceFrom(cartTotal);
  const baseDiscount = originalTotalPrice - cartTotal;
  const totalFinal = Math.max(0, cartTotal - couponDiscount);
  const totalDiscount = baseDiscount + couponDiscount;

  if (subtotalEl) subtotalEl.textContent = fmt(originalTotalPrice);
  if (discountEl) discountEl.textContent = '– ' + fmt(totalDiscount);
  if (totalEl)    totalEl.textContent    = fmt(totalFinal);
  if (mobTotalEl) mobTotalEl.textContent = fmt(totalFinal);

  const topTotalEl = document.getElementById('top-bar-total');
  if (topTotalEl) topTotalEl.textContent = fmt(totalFinal);

  // Parcelamento em 12x
  const parcela = (totalFinal / 12) * 1.15; // simulação de parcelamento
  if (instEl) {
    instEl.textContent = `12x de ${fmt(parcela)} (ou ${fmt(totalFinal)} à vista no PIX)`;
  }

  const count = cartItems.reduce((s, i) => s + (i.qty || 1), 0);
  if (mobCountEl) mobCountEl.textContent = `(${count} item${count > 1 ? 's' : ''})`;
}

// ═══════════════════════════════════════════════════════
//  CUPOM DE DESCONTO
// ═══════════════════════════════════════════════════════
function applyCoupon() {
  const input = document.getElementById('coupon-input');
  const msgEl = document.getElementById('coupon-msg');
  if (!input || !msgEl) return;

  const code = input.value.trim().toUpperCase();
  if (!code) return;

  if (code === 'MANANCIAL10' || code === 'PROPÓSITO10' || code === 'FE10') {
    couponDiscount = cartTotal * 0.10;
    appliedCouponCode = code;
    msgEl.style.color = 'var(--c-success)';
    msgEl.textContent = `✓ Cupom ${code} aplicado: 10% de desconto adicional!`;
    recalcTotal();
  } else if (code === 'FRETEGRATIS') {
    msgEl.style.color = 'var(--c-success)';
    msgEl.textContent = `✓ Frete Grátis ativado para seu CEP!`;
  } else {
    msgEl.style.color = 'var(--c-error)';
    msgEl.textContent = `Cupom inválido ou expirado.`;
  }
}

// ═══════════════════════════════════════════════════════
//  PREVIEW DA PERSONALIZAÇÃO EM TEMPO REAL
// ═══════════════════════════════════════════════════════
function onCustomizationInput() {
  const nomeGravar = document.getElementById('nome-gravar')?.value.trim();
  const nomePlaq   = document.getElementById('nome-plaquinha')?.value.trim();
  const versiculo  = document.getElementById('versiculo')?.value.trim();

  const previewBox = document.getElementById('co-pers-preview-box');
  const prevName   = document.getElementById('co-prev-name');
  const prevSub    = document.getElementById('co-prev-details');

  if (!previewBox) return;

  if (nomeGravar) {
    previewBox.style.display = 'block';
    if (prevName) prevName.textContent = `«${nomeGravar}»`;

    const extras = [];
    const bibliaItem = cartItems.find(i => i.versao);
    if (bibliaItem) {
      extras.push(`Versão ${bibliaItem.versao} (${bibliaItem.tamanhoLetra || 'Letra Grande'})`);
    }
    if (nomePlaq) extras.push(`Placa: "${nomePlaq}"`);
    if (versiculo) extras.push(`Versículo: "${versiculo}"`);

    if (prevSub) prevSub.textContent = extras.join(' · ');
  } else {
    previewBox.style.display = 'none';
  }
}

function handlePhotoUpload(input) {
  const feedback = document.getElementById('photo-feedback');
  if (input.files && input.files[0]) {
    const name = input.files[0].name;
    if (feedback) {
      feedback.style.display = 'block';
      feedback.textContent = `✓ Foto "${name}" selecionada! Incluiremos na confecção.`;
    }
  }
}

function toggleCnpjField(cb) {
  const grp = document.getElementById('cnpj-group');
  if (grp) grp.style.display = cb.checked ? 'block' : 'none';
}

function toggleMobileSummary() {
  const summaryCol = document.querySelector('.co-summary-column');
  if (summaryCol) {
    const isOpen = summaryCol.style.display === 'block';
    summaryCol.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) summaryCol.scrollIntoView({ behavior: 'smooth' });
  }
}

// ═══════════════════════════════════════════════════════
//  FLUXO POR ETAPAS (1 -> 2 -> 3)
// ═══════════════════════════════════════════════════════
function setErr(id, msg) {
  const input = document.getElementById(id);
  const err   = document.getElementById(`err-${id}`);
  if (input) input.classList.add('has-error');
  if (err)   err.textContent = msg;
}

function clearErr(id) {
  const input = document.getElementById(id);
  const err   = document.getElementById(`err-${id}`);
  if (input) input.classList.remove('has-error');
  if (err)   err.textContent = '';
}

function validateStep1() {
  let ok = true;
  ['nome', 'email', 'telefone', 'cpf'].forEach(clearErr);

  const nome  = document.getElementById('nome')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const tel   = document.getElementById('telefone')?.value.replace(/\D/g, '');
  const cpf   = document.getElementById('cpf')?.value.replace(/\D/g, '');

  if (!nome || nome.length < 3) {
    setErr('nome', 'Informe seu nome completo.');
    ok = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr('email', 'Informe um e-mail válido.');
    ok = false;
  }
  if (!tel || tel.length < 10) {
    setErr('telefone', 'Informe um WhatsApp com DDD.');
    ok = false;
  }
  if (!cpf || cpf.length !== 11) {
    setErr('cpf', 'Informe um CPF válido (11 dígitos).');
    ok = false;
  }

  return ok;
}

// ═══════════════════════════════════════════════════════
//  CONSULTA DE CEP (ViaCEP)
// ═══════════════════════════════════════════════════════
let lastCepQueried = '';
let cepAbortController = null;

async function consultarCep(cepValue) {
  const clean = (cepValue || '').replace(/\D/g, '');
  if (clean.length !== 8) return;
  if (clean === lastCepQueried) return;

  lastCepQueried = clean;

  const cepInput = document.getElementById('cep');
  const spinner  = document.getElementById('cep-spinner');

  clearErr('cep');
  if (spinner) spinner.style.display = 'inline-block';

  if (cepAbortController) {
    cepAbortController.abort();
  }
  cepAbortController = new AbortController();

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: cepAbortController.signal
    });
    const data = await res.json();

    if (data.erro) {
      setErr('cep', 'CEP não encontrado. Por favor, confira os números digitados.');
      return;
    }

    // Preenche os campos de endereço
    const endEl    = document.getElementById('endereco');
    const bairroEl = document.getElementById('bairro');
    const cidEl    = document.getElementById('cidade');
    const ufEl     = document.getElementById('estado');
    const numEl    = document.getElementById('numero');

    if (endEl && data.logradouro) {
      endEl.value = data.logradouro;
      clearErr('endereco');
    }
    if (bairroEl && data.bairro) {
      bairroEl.value = data.bairro;
      clearErr('bairro');
    }
    if (cidEl && data.localidade) {
      cidEl.value = data.localidade;
      clearErr('cidade');
    }
    if (ufEl && data.uf) {
      ufEl.value = data.uf;
      clearErr('estado');
    }

    // Foco automático no número para conveniência
    if (numEl) {
      numEl.focus();
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('ViaCEP indisponível:', err);
    }
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

function validateStep2() {
  let ok = true;
  ['cep', 'estado', 'endereco', 'numero', 'bairro', 'cidade', 'nome-gravar'].forEach(clearErr);

  const cep    = document.getElementById('cep')?.value.replace(/\D/g, '');
  const uf     = document.getElementById('estado')?.value.trim();
  const end    = document.getElementById('endereco')?.value.trim();
  const num    = document.getElementById('numero')?.value.trim();
  const bairro = document.getElementById('bairro')?.value.trim();
  const cid    = document.getElementById('cidade')?.value.trim();
  const grav   = document.getElementById('nome-gravar')?.value.trim();

  if (!cep || cep.length !== 8) {
    setErr('cep', 'Informe um CEP válido (8 dígitos).');
    ok = false;
  }
  if (!uf || uf.length < 2) {
    setErr('estado', 'Informe o Estado (UF).');
    ok = false;
  }
  if (!end || end.length < 3) {
    setErr('endereco', 'Informe a rua ou avenida.');
    ok = false;
  }
  if (!num) {
    setErr('numero', 'Informe o número.');
    ok = false;
  }
  if (!bairro || bairro.length < 2) {
    setErr('bairro', 'Informe o bairro.');
    ok = false;
  }
  if (!cid) {
    setErr('cidade', 'Informe a cidade.');
    ok = false;
  }
  if (!grav || grav.length < 2) {
    setErr('nome-gravar', 'Informe o nome que será gravado na Bíblia.');
    ok = false;
  }

  return ok;
}

function advanceToStep(step) {
  if (step === 2) {
    if (!validateStep1()) {
      const err = document.querySelector('.has-error');
      if (err) err.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // Esconde body 1 e mostra body 2
    document.getElementById('step-body-1').style.display = 'none';
    document.getElementById('step-body-2').style.display = 'block';
    document.getElementById('step-body-3').style.display = 'none';
    document.getElementById('btn-edit-1').style.display = 'inline-block';
    document.getElementById('step-card-1').classList.remove('active');
    document.getElementById('step-card-2').classList.add('active');
    document.getElementById('step-card-3').classList.remove('active');
    window.scrollTo({ top: document.getElementById('step-card-2').offsetTop - 60, behavior: 'smooth' });
  }

  if (step === 1) {
    document.getElementById('step-body-1').style.display = 'block';
    document.getElementById('step-body-2').style.display = 'none';
    document.getElementById('step-body-3').style.display = 'none';
    document.getElementById('step-card-1').classList.add('active');
    document.getElementById('step-card-2').classList.remove('active');
    document.getElementById('step-card-3').classList.remove('active');
  }

  if (step === 3) {
    if (!validateStep2()) {
      const err = document.querySelector('.has-error');
      if (err) err.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Atualiza os dados de revisão (Estilo Mercado Pago Imagem 2)
    const end = document.getElementById('endereco')?.value.trim();
    const num = document.getElementById('numero')?.value.trim();
    const bai = document.getElementById('bairro')?.value.trim();
    const cep = document.getElementById('cep')?.value.trim();
    const cid = document.getElementById('cidade')?.value.trim();
    const uf  = document.getElementById('estado')?.value.trim();

    const revStreet = document.getElementById('mp-rev-street');
    const revCity   = document.getElementById('mp-rev-city');
    if (revStreet) revStreet.textContent = `${end || 'Endereço'}, ${num || 'S/N'}${bai ? ` — ${bai}` : ''}`;
    if (revCity)   revCity.textContent   = `CEP: ${cep || ''} — ${cid || ''}, ${uf || ''}`;

    document.getElementById('step-body-1').style.display = 'none';
    document.getElementById('step-body-2').style.display = 'none';
    document.getElementById('step-body-3').style.display = 'block';
    document.getElementById('step-card-1').classList.remove('active');
    document.getElementById('step-card-2').classList.remove('active');
    document.getElementById('step-card-3').classList.add('active');

    window.scrollTo({ top: document.getElementById('step-card-3').offsetTop - 60, behavior: 'smooth' });
    gerarPix();
  }

  // Atualiza as abas de navegação no topo (Estilo Mercado Pago)
  [1, 2, 3].forEach(s => {
    const tab = document.getElementById(`tab-step-${s}`);
    if (tab) {
      tab.classList.remove('active', 'done');
      if (s === step) tab.classList.add('active');
      else if (s < step) tab.classList.add('done');
    }
  });

  currentStep = step;
}

// ═══════════════════════════════════════════════════════
//  GERAÇÃO DE PIX FLOWINPAY + QR CODE + UTMIFY
// ═══════════════════════════════════════════════════════
let currentChargeId = null;

function getTrackingParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck'];
  const params = {};
  keys.forEach(k => {
    const val = urlParams.get(k) || localStorage.getItem(k);
    if (val) {
      params[k] = val;
      try { localStorage.setItem(k, val); } catch (e) {}
    }
  });
  return params;
}

async function gerarPix() {
  const statusAlert = document.getElementById('pix-status-alert');
  const statusMsg   = document.getElementById('pix-status-msg');
  const totalValEl  = document.getElementById('pix-total-val');
  const qrContainer = document.getElementById('pix-qr-container');
  const qrLoading   = document.getElementById('pix-qr-loading');
  const qrImage     = document.getElementById('pix-qr-image');
  const copyInput   = document.getElementById('pix-copy-input');

  const finalAmount = Math.max(2.00, cartTotal - couponDiscount);
  if (totalValEl) totalValEl.textContent = fmt(finalAmount);

  const nome  = document.getElementById('nome')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const cpf   = document.getElementById('cpf')?.value.replace(/\D/g, '');
  const tel   = document.getElementById('telefone')?.value.replace(/\D/g, '');
  const grav  = document.getElementById('nome-gravar')?.value.trim();

  const prodNames = cartItems.map(i => `${i.product.name}${i.versao ? ` [${i.versao}]` : ''}`).join(', ');
  const desc = `MANANCIAL: ${grav ? `Para ${grav} | ` : ''}${prodNames}`.slice(0, 60);

  if (statusAlert) statusAlert.className = 'pix-status-alert waiting';
  if (statusMsg) statusMsg.textContent = 'Gerando seu código PIX com segurança...';

  // Exibe o spinner de carregamento centralizado e oculta a imagem até estar pronta
  if (qrLoading) qrLoading.style.display = 'flex';
  if (qrImage) {
    qrImage.style.display = 'none';
    qrImage.src = '';
  }

  try {
    const res = await fetch('/api/create-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: finalAmount,
        description: desc,
        customer_name: nome,
        customer_email: email,
        customer_tax_id: cpf,
        customer_phone: tel,
        products: cartItems.map(item => ({
          id: String(item.product.id),
          name: `${item.product.name}${item.versao ? ` (${item.versao})` : ''}`,
          quantity: item.qty || 1,
          priceInCents: Math.round(item.product.price * 100)
        })),
        trackingParameters: getTrackingParams()
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX.');

    const charge = data.charge;
    if (!charge) throw new Error('Cobrança não retornada.');
    currentChargeId = charge.id;

    // QR Code infalível (se retornar null, geramos na hora via br_code)
    let qrUrl = charge.qr_code_image;
    if (!qrUrl && charge.br_code) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(charge.br_code)}`;
    }

    if (qrImage && qrUrl) {
      qrImage.onload = () => {
        if (qrLoading) qrLoading.style.display = 'none';
        qrImage.style.display = 'block';
      };
      qrImage.onerror = () => {
        qrImage.src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(charge.br_code)}`;
      };
      qrImage.src = qrUrl;
    }

    if (copyInput && charge.br_code) {
      copyInput.value = charge.br_code;
      copyInput.dataset.code = charge.br_code;
    }

    if (statusMsg) statusMsg.textContent = 'Aguardando seu pagamento PIX...';

    // Inicia verificação automática
    startPolling(charge.id);

  } catch (err) {
    console.error('Erro PIX:', err);
    if (qrLoading) qrLoading.style.display = 'none';
    if (statusAlert) statusAlert.className = 'pix-status-alert';
    if (statusMsg) {
      if (err.message.includes('150') || err.message.includes('máximo')) {
        statusMsg.innerHTML = '⚠ <strong>Aviso de Limite por Transação:</strong><br>O valor desta compra ultrapassou o limite bancário inicial por transação PIX. Por favor, adquira os itens individualmente ou entre em contato com nosso atendimento.';
      } else {
        statusMsg.textContent = 'Erro ao processar pagamento: ' + err.message;
      }
    }
    alert(err.message.includes('150')
      ? 'Aviso: Esta transação ultrapassou o limite bancário permitido por PIX. Por favor, adquira os itens individualmente ou fale com nosso suporte.'
      : 'Erro ao gerar PIX: ' + err.message);
  }
}

async function copyPixCode() {
  const input = document.getElementById('pix-copy-input');
  const btn   = document.getElementById('btn-copy-code');
  const code  = input?.dataset?.code || input?.value;

  if (!code || code.length < 10) return;

  try {
    await navigator.clipboard.writeText(code);
  } catch {
    if (input) {
      input.select();
      document.execCommand('copy');
    }
  }

  if (btn) {
    btn.textContent = 'Copiado!';
    btn.style.background = 'var(--c-success)';
    setTimeout(() => {
      btn.textContent = 'Copiar';
      btn.style.background = '';
    }, 3000);
  }
}

function startPolling(chargeId) {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/check-charge/${chargeId}`);
      const data = await res.json();
      const status = data.charge?.status || data.status;

      if (status === 'paid') {
        clearInterval(pollingInterval);
        onPaymentConfirmed();
      }
    } catch {
      // Ignora falhas momentâneas de rede
    }
  }, 4000);
}

function onPaymentConfirmed() {
  document.getElementById('step-card-1').style.display = 'none';
  document.getElementById('step-card-2').style.display = 'none';
  document.getElementById('step-card-3').style.display = 'none';
  document.getElementById('step-card-confirmed').style.display = 'block';

  const email = document.getElementById('email')?.value.trim();
  const tel   = document.getElementById('telefone')?.value.trim();

  const emailEl = document.getElementById('confirmed-email-line');
  const waEl    = document.getElementById('confirmed-wa-line');

  if (emailEl && email) {
    emailEl.innerHTML = `✉️ Enviaremos todas as etapas da gravação para <strong>${email}</strong>.`;
  }
  if (waEl && tel) {
    waEl.innerHTML = `📱 Nossa equipe entrará em contato via WhatsApp <strong>${tel}</strong> com o código de rastreamento.`;
  }

  localStorage.removeItem('verbum_cart');

  // ── Sincronização UTMify: Pedido Pago ─────────────────
  try {
    fetch('/api/utmify/paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: currentChargeId || `ord_${Date.now()}`,
        value: Math.max(2.00, cartTotal - couponDiscount),
        customer_name: document.getElementById('nome')?.value.trim(),
        customer_email: email,
        customer_phone: tel,
        customer_tax_id: document.getElementById('cpf')?.value.replace(/\D/g, ''),
        trackingParameters: getTrackingParams()
      })
    }).catch(() => {});
  } catch (e) {}

  // ── Evento de Conversão: Meta Pixel Purchase ──────────
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      value: Math.max(2.00, cartTotal - couponDiscount),
      currency: 'BRL'
    });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════
//  INICIALIZAÇÃO & MÁSCARAS
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initSlider();
  loadCart();
  onCustomizationInput();

  const cpfEl = document.getElementById('cpf');
  if (cpfEl) cpfEl.addEventListener('input', e => { e.target.value = maskCPF(e.target.value); });

  const telEl = document.getElementById('telefone');
  if (telEl) telEl.addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });

  const cepEl = document.getElementById('cep');
  if (cepEl) {
    cepEl.addEventListener('input', e => {
      e.target.value = maskCEP(e.target.value);
      const clean = e.target.value.replace(/\D/g, '');
      if (clean.length === 8) {
        consultarCep(clean);
      }
    });
    cepEl.addEventListener('blur', e => {
      const clean = e.target.value.replace(/\D/g, '');
      if (clean.length === 8) {
        consultarCep(clean);
      }
    });
  }
});
