/**
 * VERBUM — checkout.js (atualizado)
 * - Fluxo de 3 etapas
 * - Upload de foto (simulado — sem armazenamento)
 * - Mensagem de e-mail/WhatsApp pós-pagamento
 * - Integração PIX FlowinPay via /api/create-charge
 */

// ═══════════════════════════════════════════════════════
//  ESTADO
// ═══════════════════════════════════════════════════════
let currentStep = 1;
let cartItems   = [];
let cartTotal   = 0;
let pixChargeId = null;
let polling     = null;

// ═══════════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════════
function encSrc(raw) {
  return raw.split('/').map(s => encodeURIComponent(s)).join('/');
}

function fmt(v) {
  return 'R$\u00a0' + parseFloat(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function priceFrom(real) { return parseFloat(real) / 0.55; }

function maskCPF(v) {
  return v.replace(/\D/g,'')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
    .slice(0,14);
}

function maskPhone(v) {
  return v.replace(/\D/g,'')
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d{1,4})$/,'$1-$2')
    .slice(0,15);
}

function maskCEP(v) {
  return v.replace(/\D/g,'').replace(/(\d{5})(\d)/,'$1-$2').slice(0,9);
}

// ═══════════════════════════════════════════════════════
//  CARRINHO / RESUMO
// ═══════════════════════════════════════════════════════
function loadCart() {
  const raw = localStorage.getItem('verbum_cart');
  if (!raw) { cartItems = []; cartTotal = 0; renderSummary(); return; }

  const saved = JSON.parse(raw);
  cartItems = saved.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    return p ? { ...item, product: p } : null;
  }).filter(Boolean);

  cartTotal = cartItems.reduce((s, i) => s + (i.product.price * (i.qty || 1)), 0);
  renderSummary();
}

function renderSummary() {
  const block = document.getElementById('sum-product-block');
  if (!block) return;

  if (!cartItems.length) {
    block.innerHTML = `
      <p style="font-style:italic;color:var(--text-muted);font-size:.88rem;padding:8px 0;">
        Nenhum produto no carrinho.
        <a href="index.html" style="color:var(--maroon);text-decoration:underline;">Escolher Bíblia</a>
      </p>`;
    return;
  }

  block.innerHTML = cartItems.map(item => {
    const p = item.product;
    return `
      <div class="sum-product">
        ${p.images?.[0] ? `<img class="sum-product-img"
            src="${encSrc(p.images[0])}"
            alt="${p.name}"
            onerror="this.style.display='none'"
            loading="lazy">` : ''}
        <div class="sum-product-info">
          <div class="sum-product-name">${p.name}</div>
          <div class="sum-product-pers" id="sum-pers-${p.id}"></div>
        </div>
      </div>`;
  }).join('');

  updatePrices();
}

function updatePrices() {
  const fromEl  = document.getElementById('sum-price-from');
  const discEl  = document.getElementById('sum-discount');
  const totalEl = document.getElementById('sum-total');

  if (cartTotal > 0) {
    const from = priceFrom(cartTotal);
    const disc = from - cartTotal;
    if (fromEl)  fromEl.textContent  = fmt(from);
    if (discEl)  discEl.textContent  = '– ' + fmt(disc);
    if (totalEl) totalEl.textContent = fmt(cartTotal);
  } else {
    if (fromEl)  fromEl.textContent  = 'A confirmar';
    if (discEl)  discEl.textContent  = '—';
    if (totalEl) totalEl.textContent = 'A confirmar';
  }
}

// ═══════════════════════════════════════════════════════
//  NAVEGAÇÃO ENTRE PASSOS
// ═══════════════════════════════════════════════════════
function goToStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;

  // Oculta todos os painéis
  document.querySelectorAll('.co-panel').forEach(p => p.classList.remove('active'));

  // Ativa o painel destino
  const panel = document.getElementById(`panel-${n}`);
  if (panel) panel.classList.add('active');

  updateProgress(n);
  currentStep = n;

  // Scroll para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(step) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`prog-${i}`);
    if (!el) return;
    el.classList.remove('active', 'done');

    const seal = el.querySelector('.prog-seal');
    if (i < step)  { el.classList.add('done');   if (seal) seal.textContent = '✓'; }
    else if (i === step) { el.classList.add('active'); if (seal) seal.textContent = i; }
    else                 { if (seal) seal.textContent = i; }
  });

  const c1 = document.getElementById('conn-1');
  const c2 = document.getElementById('conn-2');
  if (c1) c1.style.width = step >= 2 ? '100%' : '0%';
  if (c2) c2.style.width = step >= 3 ? '100%' : '0%';
}

// ═══════════════════════════════════════════════════════
//  VALIDAÇÃO
// ═══════════════════════════════════════════════════════
function validateStep(step) {
  if (step === 1) return validateStep1();
  if (step === 2) return validateStep2();
  return true;
}

function setErr(fieldId, errId, msg) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errId);
  if (f) f.classList.add('err');
  if (e) e.textContent = msg;
}

function clearErr(fieldId, errId) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errId);
  if (f) f.classList.remove('err');
  if (e) e.textContent = '';
}

function validateStep1() {
  let ok = true;

  const nome    = document.getElementById('nome')?.value.trim();
  const email   = document.getElementById('email')?.value.trim();
  const tel     = document.getElementById('telefone')?.value.replace(/\D/g,'');
  const cpf     = document.getElementById('cpf')?.value.replace(/\D/g,'');

  ['nome','email','telefone','cpf'].forEach(f => clearErr(f, `err-${f}`));

  if (!nome || nome.length < 3)
    { setErr('nome','err-nome','Informe seu nome completo.'); ok = false; }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    { setErr('email','err-email','Informe um e-mail válido.'); ok = false; }

  if (!tel || tel.length < 10)
    { setErr('telefone','err-telefone','Informe o WhatsApp com DDD.'); ok = false; }

  if (!cpf || cpf.length !== 11)
    { setErr('cpf','err-cpf','Informe um CPF válido (11 dígitos).'); ok = false; }

  return ok;
}

function validateStep2() {
  const ng = document.getElementById('nome-gravar')?.value.trim();
  clearErr('nome-gravar','err-nome-gravar');

  if (!ng || ng.length < 2) {
    setErr('nome-gravar','err-nome-gravar','Informe o nome a ser gravado na Bíblia.');
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════
//  PREVIEW DE PERSONALIZAÇÃO (atualiza em tempo real)
// ═══════════════════════════════════════════════════════
function onPersChange() {
  const nome     = document.getElementById('nome-gravar')?.value.trim();
  const versiculo= document.getElementById('versiculo')?.value.trim();
  const plaquinha= document.getElementById('nome-plaquinha')?.value.trim();

  const preview  = document.getElementById('pers-preview');
  const prevName = document.getElementById('prev-name');
  const prevVerse= document.getElementById('prev-verse');

  if (preview) preview.style.display = nome ? '' : 'none';
  if (prevName) prevName.textContent = nome || '—';
  if (prevVerse) prevVerse.textContent = versiculo || (plaquinha ? `Plaquinha: ${plaquinha}` : '');

  // Atualiza o texto de personalização no bloco do produto
  cartItems.forEach(item => {
    const el = document.getElementById(`sum-pers-${item.product.id}`);
    if (el && nome) el.textContent = `✒ Gravado: ${nome}`;
  });
}

// ═══════════════════════════════════════════════════════
//  UPLOAD DE FOTO (simulado — sem armazenamento real)
// ═══════════════════════════════════════════════════════
function handleFotoUpload(input) {
  const successEl = document.getElementById('foto-success');
  if (!successEl) return;

  if (input.files && input.files[0]) {
    const fileName = input.files[0].name;

    // Exibe mensagem de sucesso
    successEl.style.display = '';
    successEl.textContent = `✓ "${fileName}" foi enviada com sucesso! Nossa equipe vai incluir na personalização.`;

    // A foto NÃO é armazenada nem enviada a nenhum servidor
    // Limpa o input para que o usuário possa enviar outra se quiser
    setTimeout(() => { input.value = ''; }, 100);

    // Esconde a mensagem após 8 segundos
    setTimeout(() => { successEl.style.display = 'none'; }, 8000);
  }
}

// ═══════════════════════════════════════════════════════
//  INTEGRAÇÃO PIX — FlowinPay (via proxy server.js)
// ═══════════════════════════════════════════════════════
async function gerarPix() {
  const btn = document.getElementById('btn-pix');
  if (btn) { btn.disabled = true; btn.textContent = 'Gerando PIX...'; }

  // Dados do cliente
  const nome    = document.getElementById('nome')?.value.trim();
  const email   = document.getElementById('email')?.value.trim();
  const cpf     = document.getElementById('cpf')?.value.replace(/\D/g,'');
  const tel     = document.getElementById('telefone')?.value.replace(/\D/g,'');
  const ngrav   = document.getElementById('nome-gravar')?.value.trim();
  const plaq    = document.getElementById('nome-plaquinha')?.value.trim();
  const vers    = document.getElementById('versiculo')?.value.trim();

  // Montagem da descrição
  const prodNames = cartItems.map(i => i.product.name).join(', ');
  const parts = [];
  if (ngrav) parts.push(`Para: ${ngrav}`);
  if (plaq)  parts.push(`Plaquinha: ${plaq}`);
  const desc = `VERBUM — ${parts.join(' | ')} — ${prodNames}`.slice(0, 60);

  const valor = cartTotal > 0 ? cartTotal : 2.00;

  try {
    const res = await fetch('/api/create-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value:           valor,
        description:     desc,
        customer_name:   nome,
        customer_email:  email,
        customer_tax_id: cpf,
        customer_phone:  tel
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Erro ao gerar PIX.');
    }

    const charge = data.charge;
    if (!charge) throw new Error('Resposta inválida da API.');

    pixChargeId = charge.id;
    showPix(charge, valor);

  } catch (err) {
    console.error('[PIX] Erro:', err);
    const msg = err.message.includes('Failed to fetch')
      ? 'Verifique sua conexão ou se o servidor está rodando (node server.js).'
      : err.message;
    alert(`Não foi possível gerar o PIX:\n${msg}`);
    if (btn) { btn.disabled = false; btn.textContent = 'Tentar novamente'; }
  }
}

function showPix(charge, valor) {
  // Oculta botão de gerar
  const genSec = document.getElementById('pix-gen-section');
  if (genSec) genSec.style.display = 'none';

  // Mostra seção de pagamento
  const paySec = document.getElementById('pix-pay-section');
  if (paySec) paySec.style.display = '';

  // QR Code
  const qrImg = document.getElementById('pix-qr');
  if (qrImg && charge.qr_code_image) {
    qrImg.src = charge.qr_code_image;
  }

  // Valor
  const valEl = document.getElementById('pix-val');
  if (valEl) valEl.textContent = fmt(valor);

  // Código copia-e-cola
  const codeEl = document.getElementById('pix-code');
  if (codeEl && charge.br_code) {
    codeEl.textContent = charge.br_code;
    codeEl.dataset.code = charge.br_code;
  }

  // Inicia polling
  startPolling(charge.id);
}

// ─── Copiar código PIX ──────────────────────────────
async function copiarPix() {
  const codeEl = document.getElementById('pix-code');
  const btn    = document.getElementById('pix-copy-btn');
  const code   = codeEl?.dataset.code || codeEl?.textContent;
  if (!code || code.length < 10) return;

  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), {
      value: code, style: 'position:fixed;opacity:0'
    });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  if (btn) {
    btn.textContent = '✓ Copiado!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('copied'); }, 2500);
  }
}

// ─── Polling de status ──────────────────────────────
function startPolling(chargeId) {
  if (polling) clearInterval(polling);

  polling = setInterval(async () => {
    const statusBar = document.getElementById('pix-status');

    try {
      if (statusBar) {
        statusBar.className = 'pix-status checking';
        statusBar.innerHTML = '<span class="pix-spinner"></span> Verificando pagamento...';
      }

      const res  = await fetch(`/api/check-charge/${chargeId}`);
      const data = await res.json();
      const st   = data.charge?.status || data.status;

      if (st === 'paid') {
        clearInterval(polling);
        onPaid();
        return;
      }

      if (st === 'expired' || st === 'cancelled') {
        clearInterval(polling);
        if (statusBar) {
          statusBar.className = 'pix-status expired';
          statusBar.innerHTML =
            '⚠ Este PIX expirou. ' +
            '<button onclick="resetPix()" ' +
            'style="color:var(--maroon);text-decoration:underline;background:none;border:none;cursor:pointer;font-family:inherit;">' +
            'Gerar novo código</button>';
        }
        return;
      }

      // Ainda aguardando
      if (statusBar) {
        statusBar.className = 'pix-status waiting';
        statusBar.innerHTML = '<span class="pix-spinner"></span> Aguardando seu pagamento PIX...';
      }

    } catch {
      if (statusBar) {
        statusBar.className = 'pix-status waiting';
        statusBar.innerHTML = '<span class="pix-spinner"></span> Aguardando confirmação...';
      }
    }
  }, 5000);
}

// ─── Pagamento confirmado ───────────────────────────
function onPaid() {
  // Oculta QR code
  const paySec = document.getElementById('pix-pay-section');
  if (paySec) paySec.style.display = 'none';

  // Mostra confirmação
  const confSec = document.getElementById('pix-confirm-section');
  if (confSec) confSec.style.display = '';

  // Preenche mensagem com dados reais do cliente
  const email  = document.getElementById('email')?.value.trim();
  const tel    = document.getElementById('telefone')?.value.trim();

  const emailMsg = document.getElementById('confirm-email-msg');
  const waMsg    = document.getElementById('confirm-whatsapp-msg');

  if (emailMsg)
    emailMsg.textContent = email
      ? `Você receberá atualizações do seu pedido no e-mail ${email}.`
      : 'Você receberá atualizações do seu pedido por e-mail.';

  if (waMsg)
    waMsg.textContent = tel
      ? `Nossa equipe entrará em contato via WhatsApp ${tel} em breve. Lembramos que o prazo de produção é de 4 dias úteis e o frete de 7 dias úteis.`
      : 'Nossa equipe entrará em contato via WhatsApp em breve. Lembramos que o prazo de produção é de 4 dias úteis e o frete de 7 dias úteis.';

  // Atualiza barra de progresso para "tudo concluído"
  updateProgress(4);

  // Limpa o carrinho
  localStorage.removeItem('verbum_cart');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetPix() {
  const genSec = document.getElementById('pix-gen-section');
  const paySec = document.getElementById('pix-pay-section');
  if (genSec) genSec.style.display = '';
  if (paySec) paySec.style.display = 'none';
  const btn = document.getElementById('btn-pix');
  if (btn) { btn.disabled = false; btn.textContent = 'Gerar novo código PIX'; }
}

// ═══════════════════════════════════════════════════════
//  MÁSCARAS DE INPUT
// ═══════════════════════════════════════════════════════
function bindMasks() {
  const cpfEl = document.getElementById('cpf');
  if (cpfEl) cpfEl.addEventListener('input', e => { e.target.value = maskCPF(e.target.value); });

  const telEl = document.getElementById('telefone');
  if (telEl) telEl.addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });

  const cepEl = document.getElementById('cep');
  if (cepEl) cepEl.addEventListener('input', e => { e.target.value = maskCEP(e.target.value); });
}

// ═══════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  bindMasks();
  updateProgress(1);

  // Se o carrinho estiver vazio, mostra aviso amigável
  if (cartItems.length === 0) {
    const main = document.querySelector('.co-main');
    if (main) {
      main.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
          <div style="font-size:3rem;margin-bottom:1rem;">📖</div>
          <h2 style="font-family:'Cormorant Garamond',serif;color:var(--maroon-dark);font-size:1.7rem;margin-bottom:0.75rem;">
            Carrinho vazio
          </h2>
          <p style="color:var(--text-muted);font-style:italic;margin-bottom:2rem;font-size:0.95rem;">
            Escolha uma Bíblia para personalizar antes de continuar.
          </p>
          <a href="index.html"
             style="display:inline-flex;align-items:center;justify-content:center;
                    min-height:48px;padding:0 28px;background:var(--maroon);
                    color:var(--gold-light);font-family:'Cormorant Garamond',serif;
                    font-size:1rem;letter-spacing:.05em;border:none;text-decoration:none;">
            Ver Bíblias →
          </a>
        </div>`;
    }
  }
});
