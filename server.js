/**
 * VERBUM — Servidor Express
 * Serve os arquivos estáticos e faz proxy seguro para a API FlowinPay PIX
 * Requer Node.js >= 18.0.0 (fetch nativo)
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Configuração FlowinPay ────────────────────────────────────────────────
const FLOWINPAY_API_KEY = 'fpk_fhaKuwiqqItDJn9Wvht6RADD5Q82zZUE';
const FLOWINPAY_BASE = 'https://app.flowinpay.com.br/api/v1';

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (HTML, CSS, JS, imagens) da pasta raiz
app.use(express.static(path.join(__dirname)));

// ─── Proxy: Criar cobrança PIX ─────────────────────────────────────────────
app.post('/api/create-charge', async (req, res) => {
  try {
    const {
      value,
      description,
      customer_name,
      customer_email,
      customer_tax_id,
      customer_phone
    } = req.body;

    // Monta a callbackUrl baseada no host atual
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const callbackUrl = `${protocol}://${host}/webhook/flowinpay`;

    const response = await fetch(`${FLOWINPAY_BASE}/charges`, {
      method: 'POST',
      headers: {
        'X-Api-Key': FLOWINPAY_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Verbum-Checkout/1.0 (Node.js)'
      },
      body: JSON.stringify({
        value,
        description,
        customer_name,
        customer_email,
        customer_tax_id,
        customer_phone,
        callbackUrl
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[FlowinPay] Erro ao criar cobrança:', data);
      let errorMsg = data.message || 'Erro ao gerar cobrança PIX';
      if (data.errors && data.errors.value) {
        errorMsg = Array.isArray(data.errors.value) ? data.errors.value.join(' ') : data.errors.value;
      }
      return res.status(response.status).json({
        error: errorMsg,
        details: data
      });
    }

    // Se FlowinPay retornar qr_code_image nulo, gera automaticamente a partir do br_code
    if (data.charge && !data.charge.qr_code_image && data.charge.br_code) {
      data.charge.qr_code_image = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(data.charge.br_code)}`;
    }

    console.log(`[PIX] Cobrança criada: #${data.charge?.id} — R$ ${value}`);
    res.json(data);

  } catch (error) {
    console.error('[FlowinPay] Erro interno:', error.message);
    res.status(500).json({ error: 'Erro interno ao processar pagamento. Tente novamente.' });
  }
});

// ─── Proxy: Consultar status da cobrança ───────────────────────────────────
app.get('/api/check-charge/:id', async (req, res) => {
  try {
    const response = await fetch(`${FLOWINPAY_BASE}/charges/${req.params.id}`, {
      headers: {
        'X-Api-Key': FLOWINPAY_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'Verbum-Checkout/1.0 (Node.js)'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Webhook FlowinPay ─────────────────────────────────────────────────────
app.post('/webhook/flowinpay', (req, res) => {
  const event = req.headers['x-flowinpay-event'] || req.headers['event'];
  const payload = req.body;

  console.log(`\n[Webhook] ─── Evento recebido: ${event} ───`);

  switch (event) {
    case 'charge.completed':
      const chargeId = payload.charge?.id || payload.id;
      const chargeValue = payload.charge?.value || payload.value;
      console.log(`[PIX] ✓ PAGAMENTO CONFIRMADO — Cobrança #${chargeId} — R$ ${chargeValue}`);
      // TODO: Adicionar lógica de fulfillment:
      // - Enviar e-mail de confirmação ao cliente
      // - Registrar pedido no sistema
      // - Notificar equipe de produção
      break;

    case 'charge.expired':
      console.log(`[PIX] ✗ Cobrança expirada — #${payload.charge?.id || payload.id}`);
      break;

    case 'charge.cancelled':
      console.log(`[PIX] ✗ Cobrança cancelada — #${payload.charge?.id || payload.id}`);
      break;

    default:
      console.log('[Webhook] Payload:', JSON.stringify(payload, null, 2));
  }

  // FlowinPay exige resposta em até 5 segundos
  res.status(200).json({ received: true });
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ✝ ════════════════════════════════════════════ ✝
  
      M A N A N C I A L   S T O R E
      Produtos Cristãos com Propósito
      Servidor rodando em http://localhost:${PORT}
  
  ✝ ════════════════════════════════════════════ ✝
  `);
});

