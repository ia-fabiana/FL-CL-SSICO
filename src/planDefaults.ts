import { LaunchPlan } from './types';

const phase = (id: string, name: string, description: string): LaunchPlan['structure'][number] => ({
  id,
  name,
  description,
});

export const DEFAULT_PLAN: LaunchPlan = {
  avatarHistory:
    'Preencha os dados do briefing acima e clique em "Gerar Estrutura" quando quiser ver a narrativa completa do avatar. Até lá, use esta área como checklist mental do que precisa ser detalhado.',
  socialMediaStrategy:
    'Liste os canais principais (Instagram, YouTube, Email) e defina um ritmo mínimo antes de gerar o plano completo. A estratégia personalizada aparece aqui depois que você gerar a visão geral.',
  launchModelExplanation:
    'Escolha entre "A Oportunidade" ou "Jeito Certo vs Jeito Errado" no briefing. Assim que gerar a estrutura, esta seção explica como explorar o modelo escolhido.',
  snaStrategy:
    'Mapeie grupos principais (WhatsApp, Telegram, Comunidade) e nomeie responsáveis. A versão completa será preenchida automaticamente após gerar o plano.',
  insiderDeliverablesMap:
    'Organize tarefas por macro-fase: Aquecimento, CPLs, Tsunami e Carrinho. Ao gerar o plano, você receberá a lista detalhada pronta para delegar.',
  structure: [
    phase(
      'PPL',
      'PPL • Aquecimento Estratégico',
      'Reaqueça a base com lives semanais, séries PEC/REP e convites para a lista VIP. Objetivo: leads engajados antes dos CPLs.'
    ),
    phase('CPL1', 'PL • CPL 1 — A Grande Oportunidade', 'Apresente a ROMA e quebre o "não é para mim". Mostre o caminho novo.'),
    phase('CPL2', 'PL • CPL 2 — Conteúdo Transformador', 'Ensine uma parte aplicável e provoque o "eu consigo". Use provas e bastidores.'),
    phase('CPL3', 'PL • CPL 3 — Oferta com Prova', 'Reforce o método, conte cases e prepare o terreno para a abertura de carrinho.'),
    phase('L1', 'L • Abertura de Carrinho', 'Live de abertura, email bomba e sequência de anúncios. Priorize velocidade de resposta.'),
    phase('L2', 'L • Meio do Carrinho', 'Gestão de objeções, estudos de caso, eventos Efeito W e squads de suporte.'),
    phase('L3', 'L • Fechamento e Pós', 'Contagem regressiva, oferta final e plano de onboarding/pós-venda.'),
  ],
};
