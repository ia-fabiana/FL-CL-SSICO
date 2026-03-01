export type PublikaCategory = 'diagnostic' | 'planning' | 'content' | 'performance';

export type PublikaModuleStatus = 'available' | 'soon';

export interface PublikaModule {
  code: string;
  name: string;
  description: string;
  benefit: string;
  credits: number;
  status: PublikaModuleStatus;
  actionLabel: string;
  category: PublikaCategory;
}

export interface PublikaSummary {
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  highlights: string[];
  creditPack: {
    label: string;
    amount: number;
    model: string;
  };
}

export const PUBLIKA_SUMMARY: PublikaSummary = {
  title: 'Painel de Crescimento · Publika.AI',
  subtitle: 'Projeto IA Fabiana',
  tagline: 'Da auditoria ao crescimento com uma única plataforma.',
  description:
    'Entenda o fluxo completo da IA Fabiana: diagnóstico, criação visual, anúncios e escala em uma central única pensada para negócios de beleza de luxo.',
  highlights: [
    'Modelo por créditos — de zero a nove créditos por geração, com bolso controlado módulo a módulo.',
    'Comece no diagnóstico, evolua para criação e finalize com operações e tráfego sem trocar de ferramenta.',
    'Desenhado para salões, clínicas e estúdios premium que precisam previsibilidade de agenda e autoridade visual.',
  ],
  creditPack: {
    label: 'Créditos ativos',
    amount: 5,
    model: 'Consumo por créditos',
  },
};

export const PUBLIKA_CATEGORY_COPY: Record<PublikaCategory, { title: string; description: string }> = {
  diagnostic: {
    title: 'Diagnóstico & Contexto',
    description: 'Mapas estratégicos para posicionar o negócio de beleza antes de produzir conteúdo.',
  },
  planning: {
    title: 'Planejamento & Operações',
    description: 'Workflows, pautas e aprovações que evitam retrabalho durante o lançamento.',
  },
  content: {
    title: 'Criação & Engajamento',
    description: 'Ferramentas criativas para roteiros, stories, carrosséis e presença diária.',
  },
  performance: {
    title: 'Performance & Escala',
    description: 'Módulos focados em criativos premium, tráfego e resposta imediata.',
  },
};

export const PUBLIKA_MODULES: PublikaModule[] = [
  {
    code: 'PB',
    name: 'Análise de Perfil',
    description: 'Auditoria que entrega um plano de ação claro para elevar o posicionamento no mercado de luxo.',
    benefit: 'Usado antes do PPL para alinhar branding, copy base e indicadores do funil.',
    credits: 0,
    status: 'available',
    actionLabel: 'Executar auditoria base',
    category: 'diagnostic',
  },
  {
    code: 'PL',
    name: 'Preciso Te Conhecer',
    description: 'Base única de contexto que alimenta planejadores, workflows e calendário sem retrabalho.',
    benefit: 'Centraliza briefing, voz da marca e inventário de ofertas antes dos CPLs.',
    credits: 0,
    status: 'available',
    actionLabel: 'Preencher cadastro base',
    category: 'diagnostic',
  },
  {
    code: 'CQ',
    name: 'Planejamento de Conteúdo',
    description: 'Plano mensal com previsibilidade comercial e gatilhos PEC/REP distribuídos.',
    benefit: 'Vira grade oficial do aquecimento (21 dias) com entregas alinhadas ao PPL.',
    credits: 1,
    status: 'available',
    actionLabel: 'Planejar temas do mês',
    category: 'planning',
  },
  {
    code: 'GS',
    name: 'Workflow de Elite',
    description: 'Processo produtivo sem falhas com aprovações estratégicas antes de cada post.',
    benefit: 'Mantém squad e especialistas sincronizados durante CPLs e Tsunami.',
    credits: 0,
    status: 'available',
    actionLabel: 'Organizar workflow',
    category: 'planning',
  },
  {
    code: 'F1',
    name: 'Calendário Editorial',
    description: 'Visualização macro das ativações com paz mental e organização total.',
    benefit: 'Garante cadência das notificações SNA e pauta PEC/REP no PPL.',
    credits: 0,
    status: 'available',
    actionLabel: 'Abrir calendário',
    category: 'planning',
  },
  {
    code: 'ST',
    name: 'Auditores de Feed (1:1)',
    description: 'Curadoria manual que entrega um post impecável com foco no serviço e padrão de luxo.',
    benefit: 'Refina peças hero para CPL2, CPL3 e abertura de carrinho.',
    credits: 3,
    status: 'available',
    actionLabel: 'Refinar feed premium',
    category: 'planning',
  },
  {
    code: 'RV',
    name: 'Caixinha de Perguntas',
    description: 'Perguntas estratégicas e artes exclusivas que aceleram a resposta do público.',
    benefit: 'Ativa social listening durante o aquecimento e coleta objeções reais.',
    credits: 1,
    status: 'available',
    actionLabel: 'Gerar caixinhas',
    category: 'content',
  },
  {
    code: 'VD',
    name: 'Roteiro de Vídeo',
    description: 'Texto pronto com argumento, storytelling de venda e CTA claro.',
    benefit: 'Economiza tempo nos CPLs e nas lives de abertura de carrinho.',
    credits: 1,
    status: 'available',
    actionLabel: 'Gerar roteiro de vídeo',
    category: 'content',
  },
  {
    code: 'CP',
    name: 'Story Creator (9:16)',
    description: 'Stories imersivos que prendem a atenção e criam desejo imediato.',
    benefit: 'Mantém o SNA pulsando com conteúdo de bastidor premium.',
    credits: 2,
    status: 'available',
    actionLabel: 'Expandir para story',
    category: 'content',
  },
  {
    code: 'LG',
    name: 'Composição de Cenário',
    description: 'Transforma fotos simples em campanhas com acabamento de moda europeia.',
    benefit: 'Eleva o visual dos anúncios de luxo e das capas de CPL.',
    credits: 3,
    status: 'available',
    actionLabel: 'Compor cenários premium',
    category: 'content',
  },
  {
    code: 'AD',
    name: 'Legendas Estratégicas',
    description: 'Textos persuasivos que convertem seguidores em clientes pagantes.',
    benefit: 'Serve como copy base para emails de carrinho e posts de escassez.',
    credits: 1,
    status: 'available',
    actionLabel: 'Criar legendas',
    category: 'content',
  },
  {
    code: 'TG',
    name: 'Conteúdo Carrossel',
    description: 'Roteiros prontos que posicionam a especialista como referência máxima.',
    benefit: 'Usado como peça âncora dos CPLs e anúncios de nutrição.',
    credits: 9,
    status: 'available',
    actionLabel: 'Roteiro de carrossel',
    category: 'content',
  },
  {
    code: 'WF',
    name: 'Vídeo Dinâmico',
    description: 'Vídeo curto com acabamento cinematográfico e identidade preservada.',
    benefit: 'Entrega criativos dignos de tráfego pago premium sem equipe externa.',
    credits: 4,
    status: 'available',
    actionLabel: 'Transformar foto em vídeo',
    category: 'performance',
  },
  {
    code: 'CR',
    name: 'Gerar Anúncio',
    description: 'Anúncios de alto padrão com texto sobreposto e copy persuasiva.',
    benefit: 'Garante consistência entre criativo, headline e oferta durante o Tsunami.',
    credits: 4,
    status: 'available',
    actionLabel: 'Criar campanha pronta',
    category: 'performance',
  },
  {
    code: 'IA',
    name: 'Tráfego & IA',
    description: 'Agenda lotada com o público ideal e distribuição inteligente dos anúncios.',
    benefit: 'Destrava o scaling após a abertura de carrinho com direcionamento em tempo real.',
    credits: 0,
    status: 'soon',
    actionLabel: 'Em breve',
    category: 'performance',
  },
  {
    code: 'IR',
    name: 'IA Responde',
    description: 'Resposta instantânea em alto nível para não perder leads quentes.',
    benefit: 'Cuida do suporte durante o carrinho e reduz desistências.',
    credits: 0,
    status: 'soon',
    actionLabel: 'Em breve',
    category: 'performance',
  },
];
