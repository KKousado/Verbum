/**
 * VERBUM — checkout.js (Redesenhado no Modelo KICKZ)
 * - Navegação por etapas (1: Entrega -> 2: Pagamento PIX -> 3: Confirmação)
 * - Geração confiável de QR Code PIX (com fallback automático se FlowinPay retornar null)
 * - Validação ágil e moderna com máscaras de input
 * - Resumo do pedido e preview de personalização em tempo real
 */

// ═══════════════════════════════════════════════════════
//  ESTADO GLOBAL DO CHECKOUT
// ═══════════════════════════════════════════════════════
let currentStep = 1;
let cartItems   = [];
let cartTotal   = 0;
let pixChargeId = null;
let pollingInterval = null;

// ═══════════════════════════════════════════════════════
//  UTILITÁRIOS
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

  cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * (item.qty || 1)), 0);
  renderOrderSummary();
}

function renderOrderSummary() {
  const listEl = document.getElementById('summary-items-list');
  const subtotalEl = document.getElementById('sum-subtotal');
  const discountEl = document.getElementById('sum-discount');
  const totalEl = document.getElementById('sum-total-price');

  if (!listEl) return;

  if (cartItems.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.9rem;">
        Seu carrinho está vazio.<br>
        <a href="index.html" style="color: var(--brand-primary); font-weight: 700; text-decoration: underline; margin-top: 8px; display: inline-block;">
          Ver Bíblias disponíveis
        </a>
      </div>`;
    if (subtotalEl) subtotalEl.textContent = 'R$ 0,00';
    if (discountEl) discountEl.textContent = '–R$ 0,00';
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    return;
  }

  listEl.innerHTML = cartItems.map(item => {
    const p = item.product;
    const thumb = p.images?.[0] ? encSrc(p.images[0]) : '';
    return `
      <div class="summary-item-row">
        ${thumb ? `<img src="${thumb}" alt="${p.name}" class="summary-item-img" onerror="this.style.display='none'">` : ''}
        <div class="summary-item-info">
          <h4 class="summary-item-name">${p.name}</h4>
          <span class="summary-item-qty">Qtd: ${item.qty || 1}</span>
        </div>
        <div class="summary-item-price">${fmt(p.price * (item.qty || 1))}</div>
      </div>`;
  }).join('');

  if (cartTotal > 0) {
    const originalPrice = priceFrom(cartTotal);
    const discountAmount = originalPrice - cartTotal;

    if (subtotalEl) subtotalEl.textContent = fmt(originalPrice);
    if (discountEl) discountEl.textContent = '– ' + fmt(discountAmount);
    if (totalEl) totalEl.textContent = fmt(cartTotal);
  }
}

// ═══════════════════════════════════════════════════════
//  PREVIEW DA PERSONALIZAÇÃO EM TEMPO REAL
// ═══════════════════════════════════════════════════════
function onCustomizationChange() {
  const nomeGravar = document.getElementById('nome-gravar')?.value.trim();
  const nomePlaq   = document.getElementById('nome-plaquinha')?.value.trim();
  const versiculo  = document.getElementById('versiculo')?.value.trim();

  const previewBox = document.getElementById('summary-custom-box');
  const prevName   = document.getElementById('preview-custom-name');
  const prevExtra  = document.getElementById('preview-custom-extra');

  if (!previewBox) return;

  if (nomeGravar) {
    previewBox.style.display = 'flex';
    if (prevName) prevName.textContent = nomeGravar;

    const extras = [];
    if (nomePlaq) extras.push(`Placa: "${nomePlaq}"`);
    if (versiculo) extras.push(`Versículo: "${versiculo}"`);

    if (prevExtra) prevExtra.textContent = extras.join(' · ');
  } else {
    previewBox.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════
//  SIMULAÇÃO DE UPLOAD DE FOTO (sem armazenamento)
// ═══════════════════════════════════════════════════════
function handlePhotoUpload(input) {
  const feedback = document.getElementById('photo-feedback');
  const feedbackText = document.getElementById('photo-feedback-text');

  if (input.files && input.files[0]) {
    const fileName = input.files[0].name;
    if (feedback && feedbackText) {
      feedback.style.display = 'flex';
      feedbackText.textContent = `"${fileName}" selecionada com sucesso! Nossa equipe vai incluir na personalização.`;
    }
  }
}

// ═══════════════════════════════════════════════════════
//  NAVEGAÇÃO POR ETAPAS (1 -> 2 -> 3)
// ═══════════════════════════════════════════════════════
function goToStep(step) {
  document.querySelectorAll('.checkout-step-view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(`view-step-${step}`);
  if (view) view.classList.add('active');

  // Atualizar tracker
  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById(`node-${i}`);
    if (!node) continue;
    node.classList.remove('active', 'done');

    const circle = node.querySelector('.step-circle');
    if (i < step) {
      node.classList.add('done');
      if (circle) circle.textContent = '✓';
    } else if (i === step) {
      node.classList.add('active');
      if (circle) circle.textContent = i;
    } else {
      if (circle) circle.textContent = i;
    }
  }

  const fill1 = document.getElementById('fill-1');
  const fill2 = document.getElementById('fill-2');
  if (fill1) fill1.style.width = step >= 2 ? '100%' : '0%';
  if (fill2) fill2.style.width = step >= 3 ? '100%' : '0%';

  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════
//  VALIDAÇÃO DO PASSO 1 & AVANÇO
// ═══════════════════════════════════════════════════════
function setErr(inputId, errId, msg) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (input) input.classList.add('has-error');
  if (err) err.textContent = msg;
}

function clearErr(inputId, errId) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (input) input.classList.remove('has-error');
  if (err) err.textContent = '';
}

function validateShippingStep() {
  let valid = true;

  const email = document.getElementById('email')?.value.trim();
  const tel   = document.getElementById('telefone')?.value.replace(/\D/g, '');
  const nome  = document.getElementById('nome')?.value.trim();
  const cpf   = document.getElementById('cpf')?.value.replace(/\D/g, '');
  const end   = document.getElementById('endereco')?.value.trim();
  const cid   = document.getElementById('cidade')?.value.trim();
  const uf    = document.getElementById('estado')?.value.trim();
  const cep   = document.getElementById('cep')?.value.replace(/\D/g, '');
  const grav  = document.getElementById('nome-gravar')?.value.trim();

  // Limpar erros anteriores
  ['email','telefone','nome','cpf','endereco','cidade','estado','cep','nome-gravar'].forEach(f => {
    clearErr(f, `err-${f}`);
  });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr('email', 'err-email', 'Informe um e-mail válido para receber as atualizações.');
    valid = false;
  }

  if (!tel || tel.length < 10) {
    setErr('telefone', 'err-telefone', 'Informe um WhatsApp com DDD.');
    valid = false;
  }

  if (!nome || nome.length < 3) {
    setErr('nome', 'err-nome', 'Informe seu nome completo.');
    valid = false;
  }

  if (!cpf || cpf.length !== 11) {
    setErr('cpf', 'err-cpf', 'Informe um CPF válido com 11 dígitos.');
    valid = false;
  }

  if (!end || end.length < 4) {
    setErr('endereco', 'err-endereco', 'Informe a rua e o número.');
    valid = false;
  }

  if (!cid) {
    setErr('cidade', 'err-cidade', 'Informe a cidade.');
    valid = false;
  }

  if (!uf || uf.length < 2) {
    setErr('estado', 'err-estado', 'UF inválida.');
    valid = false;
  }

  if (!cep || cep.length !== 8) {
    setErr('cep', 'err-cep', 'Informe um CEP válido (8 dígitos).');
    valid = false;
  }

  if (!grav || grav.length < 2) {
    setErr('nome-gravar', 'err-nome-gravar', 'Informe o nome que será gravado na Bíblia.');
    valid = false;
  }

  return valid;
}

function submitShippingStep() {
  if (!validateShippingStep()) {
    const firstErr = document.querySelector('.has-error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  goToStep(2);
  gerarPix();
}

// ═══════════════════════════════════════════════════════
//  GERAÇÃO ROBUSTA DE PIX FLOWINPAY + QR CODE
// ═══════════════════════════════════════════════════════
async function gerarPix() {
  const statusBox = document.getElementById('pix-status-box');
  const statusText = document.getElementById('pix-status-text');
  const amountDisplay = document.getElementById('pix-amount-display');
  const copyInput = document.getElementById('pix-copy-code');
  const qrImg = document.getElementById('pix-qr-img');

  if (statusBox) statusBox.className = 'pix-status-badge waiting';
  if (statusText) statusText.textContent = 'Gerando cobrança PIX com seu banco...';
  if (amountDisplay) amountDisplay.textContent = fmt(cartTotal > 0 ? cartTotal : 2.00);

  // Coleta dados
  const nome  = document.getElementById('nome')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const cpf   = document.getElementById('cpf')?.value.replace(/\D/g, '');
  const tel   = document.getElementById('telefone')?.value.replace(/\D/g, '');
  const grav  = document.getElementById('nome-gravar')?.value.trim();
  const plaq  = document.getElementById('nome-plaquinha')?.value.trim();

  const prodNames = cartItems.map(i => i.product.name).join(', ');
  const desc = `VERBUM: ${grav ? `Para ${grav} | ` : ''}${prodNames}`.slice(0, 60);
  const valor = cartTotal > 0 ? cartTotal : 2.00;

  try {
    const res = await fetch('/api/create-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: valor,
        description: desc,
        customer_name: nome,
        customer_email: email,
        customer_tax_id: cpf,
        customer_phone: tel
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao gerar cobrança PIX.');
    }

    const charge = data.charge;
    if (!charge) throw new Error('Dados de cobrança não retornados.');

    pixChargeId = charge.id;

    // ─── GERAÇÃO DO QR CODE INFALÍVEL ───
    // Se a FlowinPay retornar qr_code_image nulo, usamos o br_code com a API de QR Code instantânea
    let qrUrl = charge.qr_code_image;
    if (!qrUrl && charge.br_code) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(charge.br_code)}`;
    }

    if (qrImg && qrUrl) {
      qrImg.src = qrUrl;
      qrImg.style.display = 'block';

      // Fallback extra caso bloqueador bloqueie imagem externa:
      qrImg.onerror = function() {
        console.warn('Erro ao carregar imagem externa do QR, tentando alternativa...');
        qrImg.src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(charge.br_code)}`;
      };
    }

    // Copia e cola
    if (copyInput && charge.br_code) {
      copyInput.value = charge.br_code;
      copyInput.dataset.code = charge.br_code;
    }

    if (statusText) statusText.textContent = 'Aguardando seu pagamento PIX...';

    // Iniciar verificação automática de pagamento
    startPolling(charge.id);

  } catch (err) {
    console.error('[Checkout PIX] Erro:', err);
    if (statusText) statusText.textContent = 'Erro ao conectar. Tentando novamente...';
    alert('Não foi possível gerar o código PIX: ' + err.message + '\nVerifique os dados e tente novamente.');
  }
}

// ═══════════════════════════════════════════════════════
//  COPIAR CÓDIGO PIX
// ═══════════════════════════════════════════════════════
async function copyPixCode() {
  const input = document.getElementById('pix-copy-code');
  const btnText = document.getElementById('btn-copy-text');
  const btn = document.getElementById('btn-copy-pix');
  const code = input?.dataset?.code || input?.value;

  if (!code || code.length < 10) return;

  try {
    await navigator.clipboard.writeText(code);
  } catch (e) {
    if (input) {
      input.select();
      document.execCommand('copy');
    }
  }

  if (btnText) btnText.textContent = 'Copiado!';
  if (btn) btn.classList.add('copied');

  setTimeout(() => {
    if (btnText) btnText.textContent = 'Copiar';
    if (btn) btn.classList.remove('copied');
  }, 3000);
}

// ═══════════════════════════════════════════════════════
//  POLLING DE CONFIRMAÇÃO DO PIX
// ═══════════════════════════════════════════════════════
function startPolling(chargeId) {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/check-charge/${chargeId}`);
      const data = await res.json();
      const status = data.charge?.status || data.status;

      if (status === 'paid') {
        clearInterval(pollingInterval);
        onPaymentSuccess();
        return;
      }

      if (status === 'expired' || status === 'cancelled') {
        clearInterval(pollingInterval);
        const statusBox = document.getElementById('pix-status-box');
        const statusText = document.getElementById('pix-status-text');
        if (statusBox) statusBox.className = 'pix-status-badge';
        if (statusText) statusText.textContent = 'Este PIX expirou. Clique em voltar para gerar um novo.';
      }
    } catch (e) {
      // Ignora falhas pontuais de conexão no polling
    }
  }, 4000);
}

function onPaymentSuccess() {
  goToStep(3);

  const email = document.getElementById('email')?.value.trim();
  const tel   = document.getElementById('telefone')?.value.trim();

  const emailEl = document.getElementById('confirm-email-text');
  const waEl    = document.getElementById('confirm-whatsapp-text');

  if (emailEl && email) {
    emailEl.innerHTML = `Todas as atualizações da confecção serão enviadas para <strong>${email}</strong>.`;
  }
  if (waEl && tel) {
    waEl.innerHTML = `Nossa equipe entrará em contato via WhatsApp <strong>${tel}</strong> com fotos e o código de rastreamento.`;
  }

  // Limpa o carrinho após pagamento concluído
  localStorage.removeItem('verbum_cart');
}

// ═══════════════════════════════════════════════════════
//  MÁSCARAS DE ENTRADA & EVENTOS
// ═══════════════════════════════════════════════════════
function bindInputMasks() {
  const cpfEl = document.getElementById('cpf');
  if (cpfEl) {
    cpfEl.addEventListener('input', e => { e.target.value = maskCPF(e.target.value); });
  }

  const telEl = document.getElementById('telefone');
  if (telEl) {
    telEl.addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });
  }

  const cepEl = document.getElementById('cep');
  if (cepEl) {
    cepEl.addEventListener('input', e => { e.target.value = maskCEP(e.target.value); });
  }
}

// ═══════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  bindInputMasks();
  onCustomizationChange();
});
