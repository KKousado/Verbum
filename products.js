/**
 * VERBUM — Dados dos Produtos
 * 13 Bíblias + 2 Acessórios
 * Preços com placeholder 0 — atualizar após receber valores
 *
 * Cálculo de promoção -45%:
 *   preço "de" (riscado) = preço real / 0.55
 *   preço "por" (atual)  = preço real
 */

const PRODUCTS = [

  // ═══════════════════════════════════════════════════════
  //  B Í B L I A S
  // ═══════════════════════════════════════════════════════

  {
    id: 1,
    slug: 'courino-marrom-josue',
    name: 'Bíblia Courino Marrom Envelhecido Josué 1.9 com Nome',
    category: 'biblia',
    description: 'Encadernada em courino marrom envelhecido com textura que evoca séculos de fé, esta Bíblia traz gravado o versículo que guia gerações — Josué 1.9 — ao lado do nome escolhido por você. Uma peça para guardar para sempre.',
    images: [
      'biblias/Bíblia Courino Marrom Envelhecido Josue 1.9 com Nome/WhatsAppImage2026-06-17at13.23.59.jpg',
      'biblias/Bíblia Courino Marrom Envelhecido Josue 1.9 com Nome/WhatsAppImage2026-06-17at13.23.59_1.jpg',
      'biblias/Bíblia Courino Marrom Envelhecido Josue 1.9 com Nome/WhatsAppImage2026-06-17at13.23.59_2.jpg'
    ],
    price: 97.90,
    stock: 4,
    featured: true
  },

  {
    id: 2,
    slug: 'courino-oliva-floral',
    name: 'Bíblia Courino Oliva Floral com Nome',
    category: 'biblia',
    description: 'Em tom oliva profundo, adornada por motivos florais delicados esculpidos no couro, esta Bíblia une a robustez do material à leveza do jardim. Seu nome, gravado com precisão artesanal, a transforma em um objeto verdadeiramente único.',
    images: [
      'biblias/Bíblia Courino Oliva Floral com Nome/006EFD4B-2A01-4D28-A0EF-5C3BEDE14DB8.png',
      'biblias/Bíblia Courino Oliva Floral com Nome/BF46FFF3-72BD-407D-BA6D-267C867A45C6.png'
    ],
    price: 97.90,
    stock: 3,
    featured: false
  },

  {
    id: 3,
    slug: 'courino-preto-espada-espirito',
    name: 'Bíblia Courino Preto Espada do Espírito com Nome',
    category: 'biblia',
    description: 'A Espada do Espírito em relevo sobre courino preto intenso. Uma Bíblia que carrega tanto a força da Palavra quanto a elegância de quem a porta. Personalizada com o nome gravado em dourado — uma declaração de fé que se vê antes mesmo de abrir.',
    images: [
      'biblias/Bíblia Courino Preto Espada do Espírito com Nome/ChatGPTImage26dejun.de2026_13_59_30.png',
      'biblias/Bíblia Courino Preto Espada do Espírito com Nome/ChatGPTImage26dejun.de2026_14_01_26.png'
    ],
    price: 102.10,
    stock: 5,
    featured: false
  },

  {
    id: 4,
    slug: 'caramelo-flor-lirio-placa-media',
    name: 'Bíblia Courino Caramelo Flor Lírio com Nome + Placa Média + Cartela de Índices',
    category: 'biblia',
    description: 'O lírio, símbolo de pureza e renovação, adorna esta Bíblia em courino caramelo. Acompanhada de placa de personalização e cartela de índices colorida — um conjunto completo para quem vive a Palavra com devoção no dia a dia.',
    images: [
      'biblias/Combo Bíblia Courino Caramelo Flor Lírio com Nome + Placa Média + Cartela de Índices/2B75EAA3-EC91-4D88-BD15-866E4BB9090E.png',
      'biblias/Combo Bíblia Courino Caramelo Flor Lírio com Nome + Placa Média + Cartela de Índices/4D7F822E-992B-43FD-88E8-494566E64451.png'
    ],
    price: 68.30,
    stock: 3,
    featured: false
  },

  {
    id: 5,
    slug: 'caramelo-floral-placa-grande',
    name: 'Bíblia Courino Caramelo Floral com Nome + Cartela de Índices + Placa Grande',
    category: 'biblia',
    description: 'Um jardim em pleno courino caramelo — flores entalhadas com riqueza de detalhes cobrem a capa desta Bíblia especial. Com placa grande personalizada e cartela de índices completa. O presente que não se esquece — nem quem deu, nem quem recebeu.',
    images: [
      'biblias/Combo Bíblia Courino Caramelo Floral com Nome + Cartela de índices + Placa Grande/28C01661-D966-47FB-9A3C-BB0B3781AFF4.png',
      'biblias/Combo Bíblia Courino Caramelo Floral com Nome + Cartela de índices + Placa Grande/E3982A9D-779C-4A44-8197-0824C3BFAAEA.png'
    ],
    price: 79.90,
    stock: 4,
    featured: true
  },

  {
    id: 6,
    slug: 'caramelo-leao-cruz-placa-media',
    name: 'Bíblia Courino Caramelo Leão e Cruz + Cartela de Índices + Placa Média',
    category: 'biblia',
    description: 'O leão de Judá e a cruz, símbolos eternos de poder e redenção, gravados sobre courino caramelo com maestria artesanal. Acompanha cartela de índices e placa personalizada — para quem quer carregar a fé com força e dignidade.',
    images: [
      'biblias/Combo Bíblia Courino Caramelo Leão e Cruz + Cartela de Índices + Placa Média/WhatsAppImage2026-07-06at14.48.27.jpg',
      'biblias/Combo Bíblia Courino Caramelo Leão e Cruz + Cartela de Índices + Placa Média/WhatsAppImage2026-07-06at14.48.27_1.jpg'
    ],
    price: 89.90,
    stock: 2,
    featured: false
  },

  {
    id: 7,
    slug: 'caramelo-pombinha-espirito-santo',
    name: 'Bíblia Courino Caramelo Pombinha Espírito Santo + Cartela de Índices + Placa Grande',
    category: 'biblia',
    description: 'A pomba do Espírito Santo pousa sobre a capa em courino caramelo desta Bíblia cheia de graça. Conjunto completo com placa grande personalizada e cartela de índices — um símbolo de paz e unção para presentear com o coração.',
    images: [
      'biblias/Combo Bíblia Courino Caramelo Pombinha Espírito Santo + Cartela de índices + Placa Grande/ChatGPTImage12deago.de2026_14_02_57.png',
      'biblias/Combo Bíblia Courino Caramelo Pombinha Espírito Santo + Cartela de índices + Placa Grande/ChatGPTImage12deago.de2026_14_04_14.png'
    ],
    price: 89.90,
    stock: 3,
    featured: false
  },

  {
    id: 8,
    slug: 'nude-floral-placa-media',
    name: 'Bíblia Courino Nude Floral com Nome + Placa Média + Cartela de Índices',
    category: 'biblia',
    description: 'Em nude elegante e delicado, com flores que evocam primavera e gratidão. Esta Bíblia com placa personalizada e cartela de índices é ideal para quem busca a leveza e a fé andando juntas. Linda por dentro e por fora.',
    images: [
      'biblias/Combo Bíblia Courino Nude Floral com Nome + Placa Média + Cartela de Índices/84E14090-FEF0-40BE-9FE8-B9B9BA4666EB.png',
      'biblias/Combo Bíblia Courino Nude Floral com Nome + Placa Média + Cartela de Índices/DA0F27C3-AA70-46E1-B0C8-2196F16C915E.png'
    ],
    price: 99.90,
    stock: 4,
    featured: false
  },

  {
    id: 9,
    slug: 'nude-maos-entrelacadas-iniciais',
    name: 'Bíblia Courino Nude Mãos Entrelaçadas e Iniciais + Placa Grande + Cartela de Índices',
    category: 'biblia',
    description: 'Mãos entrelaçadas e iniciais gravadas — esta Bíblia foi feita para celebrar uniões sagradas. Em courino nude com placa grande personalizada, é o presente perfeito para casamentos, bodas e aniversários que merecem ser eternizados.',
    images: [
      'biblias/Combo Bíblia Courino Nude Mãos Entrelaçadas e Iniciais + Placa Grande + Cartela de Índices/WhatsAppImage2026-04-29at09.28.39_2 (1).jpg',
      'biblias/Combo Bíblia Courino Nude Mãos Entrelaçadas e Iniciais + Placa Grande + Cartela de Índices/WhatsAppImage2026-04-29at09.28.39_3.jpg'
    ],
    price: 99.90,
    stock: 3,
    featured: true
  },

  {
    id: 10,
    slug: 'couro-preto-cruz-jesus-vazado',
    name: 'Bíblia Couro Preto Cruz em Relevo JESUS vazado + Placa Média + Cartela de Índices',
    category: 'biblia',
    description: 'A cruz e o nome de JESUS em técnica de relevo vazado sobre couro preto premium. Com placa de personalização e cartela de índices — uma declaração de fé que se vê antes mesmo de abrir as páginas. Para quem vive a Palavra sem reservas.',
    images: [
      'biblias/Combo Bíblia Couro Preto Cruz em Relevo JESUS vazado + Placa Média + Cartela de Índices/WhatsAppImage2026-04-30at14.41.10.jpg'
    ],
    price: 110.40,
    stock: 2,
    featured: false
  },

  {
    id: 11,
    slug: 'linho-jardim-margaridas',
    name: 'Bíblia Linho Jardim de Margaridas com Nome + Placa Grande + Cartela de Índices',
    category: 'biblia',
    description: 'Tecido de linho natural com um jardim de margaridas que parece ter saído de uma manhã no campo. Com técnica artesanal, placa grande personalizada e cartela de índices completa — a Bíblia que respira a leveza da criação de Deus.',
    images: [
      'biblias/Combo Bíblia Linho Jardim de Margaridas com nome + Placa Grande + Cartela de índices/16457032-5FF2-41E6-B9CC-AC8197780D35.png',
      'biblias/Combo Bíblia Linho Jardim de Margaridas com nome + Placa Grande + Cartela de índices/25D169BC-F0B3-4E0A-ACEB-1C720878B5BB.png'
    ],
    price: 89.90,
    stock: 4,
    featured: false
  },

  {
    id: 12,
    slug: 'viviane-martinello-azul-vintage',
    name: 'Bíblia Mulheres Viviane Martinello "Azul Vintage" + Placa Média + Cartela de Índices',
    category: 'biblia',
    description: 'A edição feminina da Bíblia Viviane Martinello, em azul vintage irresistível. Personalizada com sua placa e cartela de índices — para a mulher que estuda a Palavra com profundidade, intenção e estilo inconfundível.',
    images: [
      'biblias/Combo Bíblia Mulheres Viviane Martinello "Azul Vintage" + Placa Média + Cartela de Índices/WhatsAppImage2025-09-30at09.26.39_53841cec-0599-4863-b63a-679936729d65.jpg',
      'biblias/Combo Bíblia Mulheres Viviane Martinello "Azul Vintage" + Placa Média + Cartela de Índices/WhatsAppImage2025-09-30at09.26.40_1_2306f4f5-827c-43ac-8889-7eb59199a653.jpg'
    ],
    price: 92.30,
    stock: 3,
    featured: true
  },

  {
    id: 13,
    slug: 'linho-girassol-nome-vazado',
    name: 'Bíblia em Linho Girassol com Nome Vazado + Placa Média + Cartela de Índices',
    category: 'biblia',
    description: 'O girassol, que sempre volta o rosto para a luz, estampa o linho natural desta Bíblia especial. Com técnica de nome vazado que deixa a personalização em destaque, placa personalizada e cartela de índices — um presente que irradia alegria e fé.',
    images: [
      'biblias/Combo Bíblia em Linho Girassol com nome vazado + Placa Média + Cartela de índices/D1793D26-4ECC-4A3C-971E-049D524E9A2B.png',
      'biblias/Combo Bíblia em Linho Girassol com nome vazado + Placa Média + Cartela de índices/FE7B9280-89E3-4BE5-9865-89836CD32B23.png'
    ],
    price: 87.90,
    stock: 5,
    featured: false
  },

  // ═══════════════════════════════════════════════════════
  //  A C E S S Ó R I O S
  // ═══════════════════════════════════════════════════════

  {
    id: 14,
    slug: 'estojo-canetas-kit',
    name: 'Estojo para Canetas + Kit de Canetas',
    category: 'acessorio',
    description: 'O conjunto perfeito para quem estuda e anota nas margens da Palavra. Estojo artesanal com kit de canetas especiais para marcação em Bíblia — sem manchar, sem borrar, sem arrepender. Para quem leva o estudo a sério.',
    images: [
      'acessorios/Combo Estojo para Canetas + Kit de Canetas/ChatGPTImage3dejul.de2026_10_31_44.png',
      'acessorios/Combo Estojo para Canetas + Kit de Canetas/WhatsAppImage2026-07-03at10.59.51.jpg',
      'acessorios/Combo Estojo para Canetas + Kit de Canetas/WhatsAppImage2026-07-03at11.08.34.jpg'
    ],
    price: 54.90,
    stock: 8,
    featured: false
  },

  {
    id: 15,
    slug: 'expositor-acrilico',
    name: 'Expositor de Bíblia em Acrílico — Suporte para Bíblia',
    category: 'acessorio',
    description: 'Exiba sua Bíblia personalizada com o destaque que ela merece. Suporte em acrílico cristalino, discreto e elegante — ideal para mesa de estudo, criado-mudo ou estante. Porque uma obra tão especial merece ser vista, não guardada.',
    images: [
      'acessorios/Expositor de Bíblia em Acrílico | Suporte para Bíblia/WhatsAppImage2026-08-28at14.47.12 (1).jpg'
    ],
    price: 72.90,
    stock: 10,
    featured: false
  }
];

// ─── Utilitários ────────────────────────────────────────────────────────────

/**
 * Calcula o preço "de" (riscado) a partir do preço real com -45% de desconto.
 * Se priceReal = X, então priceFrom = X / 0.55
 */
function getPriceFrom(priceReal) {
  return (priceReal / 0.55).toFixed(2);
}

/**
 * Formata valor em reais: 40.00 → "R$ 40,00"
 */
function formatPrice(value) {
  return 'R$ ' + parseFloat(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Codifica um path de arquivo para uso em src=""
 */
function encodeSrc(rawPath) {
  return rawPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

// Exportar para uso no servidor (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS, getPriceFrom, formatPrice, encodeSrc };
}

