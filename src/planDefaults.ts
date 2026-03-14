import { LaunchPlan, LaunchType } from './types';
import { getDefaultTasksByPhase } from './phaseTaskDefaults';

const phase = (
  launchType: LaunchType,
  id: string,
  name: string,
  description: string
): LaunchPlan['structure'][number] => ({
  id,
  name,
  description,
  tasks: getDefaultTasksByPhase(id, launchType),
});

export const DEFAULT_CLASSIC_PLAN: LaunchPlan = {
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
      'classic',
      'PPL',
      'AL - Aquecimento de Inscritos',
      'Reaqueça a base com lives semanais, séries PEC/REP e convites para a lista VIP. Objetivo: leads engajados antes dos CPLs.'
    ),
    phase('classic', 'CPL1', 'PL • CPL 1 — A Grande Oportunidade', 'Apresente a ROMA e quebre o "não é para mim". Mostre o caminho novo.'),
    phase('classic', 'CPL2', 'PL • CPL 2 — Conteúdo Transformador', 'Ensine uma parte aplicável e provoque o "eu consigo". Use provas e bastidores.'),
    phase('classic', 'CPL3', 'PL • CPL 3 — Oferta com Prova', 'Reforce o método, conte cases e prepare o terreno para a abertura de carrinho.'),
    phase('classic', 'L1', 'L • Abertura de Carrinho', 'Live de abertura, email bomba e sequência de anúncios. Priorize velocidade de resposta.'),
    phase('classic', 'L2', 'L • Meio do Carrinho', 'Gestão de objeções, estudos de caso, eventos Efeito W e squads de suporte.'),
    phase('classic', 'L3', 'L • Fechamento e Pós', 'Contagem regressiva, oferta final e plano de onboarding/pós-venda.'),
  ],
};

export const DEFAULT_SEED_PLAN: LaunchPlan = {
  avatarHistory:
    'Preencha os dados do briefing acima e clique em "Gerar Estrutura" quando quiser ver a narrativa completa do avatar. Até lá, use esta área como checklist mental do que precisa ser detalhado.',
  socialMediaStrategy:
    'Liste os canais principais (Instagram, YouTube, Email) e defina um ritmo mínimo antes de gerar o plano completo. A estratégia personalizada aparece aqui depois que você gerar a visão geral.',
  launchModelExplanation:
    'Escolha entre "A Oportunidade" ou "Jeito Certo vs Jeito Errado" no briefing. Assim que gerar a estrutura, esta seção explica como explorar o modelo escolhido.',
  snaStrategy:
    'Mapeie grupos principais (WhatsApp, Telegram, Comunidade) e nomeie responsáveis. A versão completa será preenchida automaticamente após gerar o plano.',
  insiderDeliverablesMap:
    'Organize tarefas por macro-fase do semente: CLI, aquecimento, webinario, vendas, entrega e debriefing. Ao gerar o plano, você receberá a lista detalhada pronta para delegar.',
  structure: [
    phase(
      'seed',
      'CLI',
      'CLI - Construcao da Lista de Inscritos',
      'Construa a lista de inscritos com pagina, campanhas e comunicacao preparadas para o webinario.'
    ),
    phase(
      'seed',
      'AL',
      'AL - Aquecimento de Inscritos',
      'Engaje e nutra os inscritos com conteudos e lembretes para garantir presenca ao vivo.'
    ),
    phase(
      'seed',
      'SEED_WEBINAR',
      'SEMENTE • Webinario (Aula Ao Vivo)',
      'Execute o roteiro de vendas com conteudo de alto valor e oferta ao final da aula.'
    ),
    phase(
      'seed',
      'SEED_CART',
      'SEMENTE • Carrinho Aberto',
      'Mantenha as vendas abertas apos o webinario, removendo objecoes e reforcando a oferta.'
    ),
    phase(
      'seed',
      'SEED_DELIVERY',
      'SEMENTE • Entrega do Produto',
      'Entregue as primeiras aulas e acompanhe os alunos para gerar resultados e provas iniciais.'
    ),
    phase(
      'seed',
      'SEED_DEBRIEF',
      'SEMENTE • Debriefing',
      'Analise o ciclo, documente aprendizados e ajuste o proximo lancamento.'
    ),
  ],
};

export const getDefaultPlan = (launchType: LaunchType): LaunchPlan =>
  launchType === 'seed' ? DEFAULT_SEED_PLAN : DEFAULT_CLASSIC_PLAN;
