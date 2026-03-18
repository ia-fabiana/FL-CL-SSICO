import { LaunchType, PhaseTask } from './types';

const createTask = (
  id: string,
  title: string,
  details: string,
  options: Partial<PhaseTask> = {}
): PhaseTask => ({
  id,
  title,
  details,
  done: false,
  proofs: [],
  ...options,
});

const CLASSIC_DEFAULTS: Record<string, PhaseTask[]> = {
  PPL: [
    createTask('ppl-conteudo-raiz', 'Planejar conteúdos raiz semanais', 'Defina linhas editoriais e roteiros para manter pelo menos 1 raiz por semana até o lançamento.', {
      dueOffsetDays: -35,
      knowledgeBase: 'Use as dores e desejos do avatar descritos no briefing.',
      contentMode: 'text',
    }),
    createTask('ppl-reels-batch', 'Roteirizar série de reels/nutellas', 'Mapeie no mínimo 5 reels por semana com CTA para a lista VIP.', {
      dueOffsetDays: -35,
      contentMode: 'text',
    }),
    createTask('ppl-distribuicao-planejamento', 'Planejar distribuição paga', 'Reserve verba, escolha canais (Meta/Google) e registre métricas de impulsionamento.', {
      dueOffsetDays: -33,
      proofRequired: true,
    }),
    createTask('ppl-aquecimento-temas', 'Listar 10 temas de aquecimento', 'Temas devem quebrar objeções e antecipar os CPLs para lives, reels e stories.', {
      dueOffsetDays: -32,
      contentMode: 'text',
    }),
    createTask('ppl-audios-whatsapp', 'Escrever 10 áudios de WhatsApp', 'Prepare mensagens diárias (domingo a quinta) para aquecer grupos durante a captação.', {
      dueOffsetDays: -30,
      contentMode: 'text',
    }),
    createTask('ppl-lives-aquecimento', 'Desenhar 10 lives de aquecimento', 'Defina pauta, formato (aula/QA/entrevista) e CTA para cada live pré-CPL.', {
      dueOffsetDays: -29,
      contentMode: 'text',
    }),
    createTask('ppl-stories-interacao', 'Definir calendário de stories', 'Organize gatilhos de interação (caixas, enquetes, contagens) alinhados aos temas.', {
      dueOffsetDays: -28,
    }),
    createTask('ppl-onboarding-notificacoes', 'Personalizar onboarding de inscritos', 'Adapte email de obrigado, convites para grupos e mensagem de boas-vindas.', {
      dueOffsetDays: -27,
      contentMode: 'text',
      proofRequired: true,
    }),
    createTask('ppl-contagem-regressiva', 'Criar notificações “faltam X dias”', 'Escreva e agende mensagens de -7, -4 e -1 dia no email e WhatsApp.', {
      dueOffsetDays: -26,
      contentMode: 'text',
    }),
    createTask('ppl-remarketing-criativos', 'Produzir kit de remarketing', 'Crie 7 lembretes, 4 criativos de CPL e 7 de carrinho aberto, já com títulos e CTAs.', {
      dueOffsetDays: -24,
      contentMode: 'image',
      proofRequired: true,
    }),
    createTask('ppl-capitacao-setup', 'Ativar captação e provas sociais', 'Verifique campanhas, fixe post institucional e highlight de provas antes da captação.', {
      dueOffsetDays: -21,
      proofRequired: true,
    }),
    createTask('ppl-rituais-otimizacao', 'Documentar rituais de otimização', 'Defina rotina diária de orçamento, ajustes de criativo (2x/sem) e públicos (1x/sem).', {
      dueOffsetDays: -21,
      knowledgeBase: 'Siga o guia de otimização da planilha de tráfego.',
    }),
  ],
  CPL1: [
    createTask('cpl1-liberacao', 'Liberar CPL 1 às 8h', 'Suba o vídeo no blog, teste player e mantenha CTA claro para CPL 2.', {
      dueOffsetDays: -7,
      proofRequired: true,
    }),
    createTask('cpl1-email-sequence', 'Disparar emails de CPL 1', 'Envie “CPL1 no ar” e o reforço 24h depois usando o documento de notificações.', {
      dueOffsetDays: -7,
      contentMode: 'text',
      proofRequired: true,
    }),
    createTask('cpl1-whatsapp-sequence', 'Programar chamadas no WhatsApp', 'Agende chamadas 1 e 2 e dois reforços para leads inscritas.', {
      dueOffsetDays: -7,
      contentMode: 'text',
    }),
    createTask('cpl1-disparos-check', 'Conferir disparos e links', 'Valide diariamente se emails/WhatsApp foram enviados e se rastreamentos funcionam.', {
      dueOffsetDays: -7,
      proofRequired: true,
    }),
    createTask('cpl1-remarketing', 'Ativar remarketing do CPL 1', 'Confirme campanha de alcance/visualização com públicos de inscritos e engajados.', {
      dueOffsetDays: -7,
    }),
    createTask('cpl1-conteudo-support', 'Publicar conteúdo CTA CPL 1', 'Reforce nos reels/stories que o CPL 1 está no ar e convide para assistir no dia.', {
      dueOffsetDays: -7,
    }),
    createTask('cpl1-live-qa', 'Rodar live de bastidores/QA', 'Faça transmissão curta respondendo dúvidas e guiando para CPL 1.', {
      dueOffsetDays: -6,
      proofRequired: true,
    }),
  ],
  CPL2: [
    createTask('cpl2-liberacao', 'Liberar CPL 2 às 8h', 'Garanta que players e páginas estejam atualizados com o novo conteúdo.', {
      dueOffsetDays: -5,
      proofRequired: true,
    }),
    createTask('cpl2-email-sequence', 'Enviar emails do CPL 2', 'Dispare “CPL2 no ar” e reforço automático no dia seguinte.', {
      dueOffsetDays: -5,
      contentMode: 'text',
    }),
    createTask('cpl2-whatsapp-sequence', 'Agendar notificações no WhatsApp', 'Dispare chamadas 1 e 2 e reforços de acompanhamento do CPL 2.', {
      dueOffsetDays: -5,
      contentMode: 'text',
    }),
    createTask('cpl2-provas', 'Atualizar provas e bastidores', 'Selecione depoimentos e aprendizados para reforçar o conteúdo transformador.', {
      dueOffsetDays: -5,
      proofRequired: true,
    }),
    createTask('cpl2-recuperacao', 'Escrever sequência de recuperação', 'Configure emails de carrinho abandonado, boleto e compra cancelada para pós-CPL.', {
      dueOffsetDays: -5,
      contentMode: 'text',
      proofRequired: true,
    }),
    createTask('cpl2-lives-carrinho', 'Planejar lives de carrinho aberto', 'Defina três temas de lives para a semana seguinte usando o guia de raiz.', {
      dueOffsetDays: -4,
      contentMode: 'text',
    }),
    createTask('cpl2-remarketing', 'Refinar campanhas de CPL 2', 'Ajuste orçamentos e criativos de remarketing para ampliar as visualizações.', {
      dueOffsetDays: -4,
    }),
  ],
  CPL3: [
    createTask('cpl3-liberacao', 'Liberar CPL 3', 'Publicar aula final e reforçar CTA de preparação para efeito Tsunami.', {
      dueOffsetDays: -3,
      proofRequired: true,
    }),
    createTask('cpl3-emails', 'Rodar sequência de emails CPL 3', 'Envie CPL3 no ar, “Boa e Má notícia” e “Instruções para amanhã”.', {
      dueOffsetDays: -3,
      contentMode: 'text',
    }),
    createTask('cpl3-whatsapp', 'Programar Tsunami no WhatsApp', 'Configure 5 mensagens: CPL3 no ar, 2 tsunami, instruções e contagem.', {
      dueOffsetDays: -3,
      contentMode: 'text',
    }),
    createTask('cpl3-efeito-tsunami', 'Detalhar live de efeito Tsunami', 'Escolha tema (revisão ou desejo) e construa roteiro com perguntas que quebrem objeções.', {
      dueOffsetDays: -2,
      contentMode: 'text',
      proofRequired: true,
    }),
    createTask('cpl3-remarketing', 'Agendar criativos de Tsunami', 'Programe anúncios e posts que antecipem abertura de carrinho.', {
      dueOffsetDays: -2,
    }),
    createTask('cpl3-conteudo', 'Publicar conteúdos de antecipação', 'Realize reels/stories anunciando o efeito Tsunami e o que vem no carrinho aberto.', {
      dueOffsetDays: -2,
    }),
    createTask('cpl3-lives-preview', 'Ensaiar lives de carrinho', 'Confirme estrutura das lives diárias e recursos (slides, provas, CTA).', {
      dueOffsetDays: -1,
      proofRequired: true,
    }),
  ],
  L1: [
    createTask('l1-video-vendas', 'Liberar vídeo de vendas', 'Publicar VV às 8h, testar checkout e camadas de rastreamento.', {
      dueOffsetDays: 0,
      proofRequired: true,
    }),
    createTask('l1-email-dia1', 'Enviar sequência de abertura', 'Dispare três emails (abertura, cuidado, últimas horas) no dia 1.', {
      dueOffsetDays: 0,
      contentMode: 'text',
    }),
    createTask('l1-whatsapp-dia1', 'Enviar notificações de dia 1', 'Replique mensagens no WhatsApp/Telegram alinhadas aos emails.', {
      dueOffsetDays: 0,
    }),
    createTask('l1-remarketing-carrinho', 'Subir remarketing de carrinho', 'Confirme campanhas configuradas no ciclo anterior e programe para D0.', {
      dueOffsetDays: 0,
      proofRequired: true,
    }),
    createTask('l1-live-carrinho', 'Fazer live de abertura', 'Conduza live com oferta completa e CTA direto para checkout.', {
      dueOffsetDays: 1,
      proofRequired: true,
    }),
    createTask('l1-recuperacao', 'Iniciar recuperação de vendas', 'Mapeie quem chegou ao checkout e aplique roteiro de contato 1:1.', {
      dueOffsetDays: 1,
      proofRequired: true,
    }),
    createTask('l1-planilha-status', 'Atualizar planilha de recuperação', 'Registre cada contato, status e objeções na planilha do Launch Drive.', {
      dueOffsetDays: 1,
      proofRequired: true,
    }),
  ],
  L2: [
    createTask('l2-live-dia2', 'Executar lives diárias do meio', 'Realize lives e reels dos dias 2 e 3 reforçando prova e urgência.', {
      dueOffsetDays: 2,
      proofRequired: true,
    }),
    createTask('l2-conteudo-dia2', 'Publicar conteúdos do meio', 'Siga calendários de reels, stories e áudios com CTA direto para checkout.', {
      dueOffsetDays: 2,
    }),
    createTask('l2-remarketing', 'Manter remarketing otimizado', 'Revise orçamentos, criativos e KPIs das campanhas de carrinho aberto.', {
      dueOffsetDays: 2,
    }),
    createTask('l2-contato-personalizado', 'Fazer contatos 1:1 com leads quentes', 'Use script de ligação/WhatsApp para quebrar objeções específicas.', {
      dueOffsetDays: 2,
      proofRequired: true,
    }),
    createTask('l2-indicadores', 'Monitorar indicadores diários', 'Acompanhe leads, inscrições, boletos e conversão para ajustes rápidos.', {
      dueOffsetDays: 2,
      proofRequired: true,
    }),
    createTask('l2-boleto', 'Disparar lembretes de boleto', 'Envie mensagens para boletos emitidos e compras canceladas.', {
      dueOffsetDays: 3,
    }),
  ],
  L3: [
    createTask('l3-sequencia-fechamento', 'Execução da sequência final', 'Dispare emails e WhatsApp de “Encerra hoje” e “Última chamada”.', {
      dueOffsetDays: 4,
      contentMode: 'text',
      proofRequired: true,
    }),
    createTask('l3-live-final', 'Live final de contagem regressiva', 'Conduza live curta reforçando bônus, garantias e urgência real.', {
      dueOffsetDays: 4,
      proofRequired: true,
    }),
    createTask('l3-recuperacao-final', 'Último mutirão de recuperação', 'Contato ativo com leads do checkout até o minuto final.', {
      dueOffsetDays: 4,
      proofRequired: true,
    }),
    createTask('l3-grupos-wrap', 'Encerrar grupos e salvar históricos', 'Baixe conversas, remova participantes e arquive grupos de WhatsApp.', {
      dueOffsetDays: 5,
      proofRequired: true,
    }),
    createTask('l3-arvore-obje', 'Atualizar árvore de objeções', 'Documente novas objeções encontradas durante recuperação.', {
      dueOffsetDays: 5,
      contentMode: 'text',
    }),
    createTask('l3-debriefing', 'Preencher debriefing e solicitar análise', 'Envie debriefing no Insider Desk e peça análise com o navegador.', {
      dueOffsetDays: 6,
      proofRequired: true,
    }),
  ],
};

const SEED_DEFAULTS: Record<string, PhaseTask[]> = {
  CLI: [
    createTask('seed-cli-pagina', 'Criar página de inscrição', 'Suba landing com formulário e página de obrigado.', {
      dueOffsetDays: -14,
      proofRequired: true,
    }),
    createTask('seed-cli-campanhas', 'Criar campanhas de captação', 'Planeje orgânico e/ou tráfego pago para captar inscritos.', {
      dueOffsetDays: -13,
    }),
    createTask('seed-cli-metas', 'Definir metas e orçamentos', 'Defina meta de inscritos, CAC e verba diária.', {
      dueOffsetDays: -12,
      contentMode: 'text',
    }),
    createTask('seed-cli-criativos', 'Produzir criativos para anúncios', 'Crie copys e criativos com CTA para inscrição.', {
      dueOffsetDays: -11,
      contentMode: 'image',
      proofRequired: true,
    }),
    createTask('seed-cli-comunicacao', 'Configurar ferramentas de comunicação', 'Ajuste emails, WhatsApp e automações para confirmação.', {
      dueOffsetDays: -10,
      contentMode: 'text',
    }),
  ],
  AL: [
    createTask('seed-al-emails', 'Enviar sequência de aquecimento', 'Dispare emails e mensagens de aquecimento até o dia da aula.', {
      dueOffsetDays: -6,
      contentMode: 'text',
    }),
    createTask('seed-al-conteudos', 'Preparar conteúdos de engajamento', 'Organize posts, stories e interações para manter interesse.', {
      dueOffsetDays: -5,
    }),
    createTask('seed-al-beneficios', 'Reforçar benefícios da aula', 'Reforce a promessa e o valor do webinário.', {
      dueOffsetDays: -4,
      contentMode: 'text',
    }),
    createTask('seed-al-lembretes', 'Programar lembretes finais', 'Agende lembretes 24h, 6h e 1h antes.', {
      dueOffsetDays: -1,
      contentMode: 'text',
    }),
  ],
  SEED_WEBINAR: [
    createTask('seed-webinar-roteiro', 'Escrever roteiro do webinário', 'Estruture promessa, conteúdo, prova e oferta final.', {
      dueOffsetDays: -2,
      contentMode: 'text',
    }),
    createTask('seed-webinar-slides', 'Preparar slides da aula', 'Crie slides com promessa, metodo, prova e oferta.', {
      dueOffsetDays: -2,
      proofRequired: true,
    }),
    createTask('seed-webinar-ensaio', 'Ensaiar abertura e transições', 'Teste abertura, ritmo e chamada para oferta.', {
      dueOffsetDays: -1,
      proofRequired: true,
    }),
  ],
  SEED_CART: [
    createTask('seed-cart-checkout', 'Validar checkout e página de obrigado', 'Teste pagamentos e mensagem de confirmação.', {
      dueOffsetDays: 0,
      proofRequired: true,
    }),
    createTask('seed-cart-mensagens', 'Enviar mensagens de carrinho aberto', 'Dispare emails e WhatsApp com oferta e gravação.', {
      dueOffsetDays: 0,
      contentMode: 'text',
    }),
    createTask('seed-cart-duvidas', 'Responder dúvidas e objeções', 'Atenda leads quentes e remova bloqueios de compra.', {
      dueOffsetDays: 1,
      proofRequired: true,
    }),
  ],
  SEED_DELIVERY: [
    createTask('seed-delivery-aulas', 'Entregar primeiras aulas', 'Libere modulo inicial e agenda de acompanhamento.', {
      dueOffsetDays: 2,
      proofRequired: true,
    }),
    createTask('seed-delivery-suporte', 'Acompanhar alunos de perto', 'Garanta suporte ativo para colher resultados iniciais.', {
      dueOffsetDays: 3,
    }),
    createTask('seed-delivery-provas', 'Coletar provas e depoimentos', 'Solicite e organize feedbacks dos primeiros alunos.', {
      dueOffsetDays: 4,
      proofRequired: true,
    }),
  ],
  SEED_DEBRIEF: [
    createTask('seed-debrief-analise', 'Conduzir debriefing', 'Analise conversão, objeções, mensagens e melhorias.', {
      dueOffsetDays: 5,
      contentMode: 'text',
    }),
    createTask('seed-debrief-documento', 'Documentar aprendizados', 'Registre o que funcionou e o que ajustar no classico.', {
      dueOffsetDays: 5,
      contentMode: 'text',
    }),
  ],
};

export function getDefaultTasksByPhase(phaseId: string, launchType: LaunchType = 'classic'): PhaseTask[] {
  const source = (launchType === 'seed' ? SEED_DEFAULTS : CLASSIC_DEFAULTS)[phaseId] ?? [];
  return source.map(task => ({
    ...task,
    proofs: [...(task.proofs ?? [])],
  }));
}

