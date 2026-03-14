import { GuidanceEntry, GuidanceMap, LaunchData } from './types';

export const GUIDED_FIELD_CONFIG = [
  {
    field: 'avatarStory',
    sectionId: 'section-expert-info',
    label: 'História da Expert',
    prompt: 'Transforme os pontos fornecidos em uma narrativa envolvente que apresente a trajetória da expert, seu tempo de atuação, conquistas e motivos que a tornam autoridade.',
  },
  {
    field: 'mainProblem',
    sectionId: 'section-product-info',
    label: 'Problema Principal',
    prompt: 'Explique claramente a dor central que o produto resolve, usando linguagem acessível e conexão emocional.',
  },
  {
    field: 'mainBenefit',
    sectionId: 'section-product-info',
    label: 'Promessa Principal',
    prompt: 'Descreva o benefício máximo que o avatar alcançará após aplicar a metodologia.',
  },
  {
    field: 'avatarSummary',
    sectionId: 'section-avatar-info',
    label: 'Resumo do Avatar',
    prompt: 'Resuma o avatar em até 4 linhas, conectando perfil, contexto de vida, limitações e objetivo principal.',
  },
  {
    field: 'bonuses',
    sectionId: 'section-offer-info',
    label: 'Bônus Exclusivos',
    prompt: 'Escreva a descrição dos bônus, destacando benefícios e gatilhos de valor.',
  },
  {
    field: 'offerDetails',
    sectionId: 'section-offer-info',
    label: 'Detalhes da Oferta',
    prompt: 'Recapitule pontos extras da oferta para reforçar valor percebido e urgência.',
  },
  {
    field: 'cplThreeSolution',
    sectionId: 'section-offer-info',
    label: 'Âncora do CPL 3',
    prompt: 'Descreva a prova ou demonstração usada no CPL 3 para destravar a decisão.',
  },
] as const;

export type GuidedFieldKey = typeof GUIDED_FIELD_CONFIG[number]['field'];

export const guidanceKeyForField = (field: GuidedFieldKey) => `field:${field}`;
export const guidanceKeyForPhase = (phaseId: string) => `phase:${phaseId}`;

export const createEmptyGuidanceEntry = (): GuidanceEntry => ({
  keyPoints: '',
  framework: '',
});

export const ensureGuidanceKeys = (map: GuidanceMap | undefined, keys: string[]): GuidanceMap => {
  const source = map ?? {};
  let changed = false;
  const next: GuidanceMap = { ...source };
  keys.forEach(key => {
    if (!next[key]) {
      next[key] = createEmptyGuidanceEntry();
      changed = true;
    }
  });
  return changed ? next : source;
};

export const getFieldPrompt = (field: GuidedFieldKey) => {
  const config = GUIDED_FIELD_CONFIG.find(entry => entry.field === field);
  return config?.prompt ?? '';
};

export const collectFieldKeys = () => GUIDED_FIELD_CONFIG.map(entry => guidanceKeyForField(entry.field));

export const collectPhaseKeys = (planIds: string[]) => planIds.map(id => guidanceKeyForPhase(id));

const CPL1_PHASE_KEYPOINTS = `ESTRUTURA GERAL CPL#01
100% VALOR 0% VENDA
DURAÇÃO
DE 8 A 180 MIN.
ELE PODE SER LONGO E OU CURTO SÓ NÃO PODE SER CHATO
NÃO TEM FILME LONGO, TEM FILME CHATO
METAS
1) O CPL 1 - PRECISA TIRAR O SONO DO AVATAR
2) EU QUERO (ROMA)
3) P.A.D (PELO AMOR DE DEUS) ME DEIXA VER A PRÓXIMA AULA
GATILHOS MENTAIS OBRIGATÓRIOS NO CPL 1
SIM PODE MOSTRAR OUTROS MAS ESSES SÃO OBRIGATÓRIOS
AUTORIDADE · ESPECIFICIDADE · PROVA · SIMILARIDADE · PROCEDÊNCIA DA OPORTUNIDADE · HISTÓRIA · RECIPROCIDADE · SURPRESA · RAZÃO
PERGUNTAS QUE TEMOS QUE NOS FAZER NO FINAL DO CPL1
- EU APLIQUEI?
- COMO EU POSSO INTENSIFICAR?

ESTRUTURA GERAL DO CPL#1
ROMA · PROVA · HISTÓRIA · CONTEÚDO · FINALIZAÇÃO
- APÓS FALAR ROMA PODE ENFRAQUECER OBJEÇÕES
- NO MOMENTO DE FALAR ROMA, QUANTO MAIS DIRETO MELHOR
- METRALHADORA DE PROVAS (30S A 1MIN) PODE VIR ANTES DA ROMA SE FOR REALMENTE UMA METRALHADORA
- TRANSIÇÃO: “EU SEI QUE VOCÊ DEVE ESTAR PENSANDO QUE ISSO É BOM DEMAIS…”

PROVA
- MATE O SÃO TOMÉ ANTES DE CRESCER
- PROVA PRECISA SER DIRETO AO PONTO DA ROMA

HISTÓRIA
- É O GATILHO VEICULAR QUE TRANSPORTA OUTROS GATILHOS E GERA CONEXÃO
- FOCO: PROCEDÊNCIA DO MÉTODO, NÃO APENAS A HISTÓRIA DO EXPERT
- PREPARA O AVATAR PARA RECEBER O CONTEÚDO

ENTRADA NA HISTÓRIA
- GANCHO: “ANTES DE TE FALAR COMO XXXX, DEIXA TE CONTAR A PROCEDÊNCIA…”
- ATOS: 1) ANTES (SIMILARIDADE, DORES, ASPIRAÇÕES) 2) VIRADA (O QUE ACONTECEU) 3) DEPOIS (CHEGADA À ROMA) 4) SURGIMENTO DO MÉTODO (PASSO A PASSO) 5) RAZÃO DA DIVULGAÇÃO (CAUSA)
- QUAL A SUA CAUSA? QUAL O SEU PORQUÊ? EX.: “VAMOS MUDAR A REALIDADE DE DONOS DE SALÕES”

ALINHAMENTO DE COMPROMETIMENTO
- TEMPO · TESOURO · CONTEÚDO

ESCOLHA DO ARQUÉTIPO
- CPL 1 PODE SER OPORTUNIDADE OU JEITO CERTO/ERRADO
- NA LINHA JCE MOSTRE ERROS NÃO ÓBVIOS E USE EMPATIA/SIMILARIDADE
- NA LINHA OPORTUNIDADE MOSTRE OPORTUNIDADES NÃO ÓBVIAS COM PROVAS E ESPECIFICIDADE

EXEMPLO (EMAGRECIMENTO / OPORTUNIDADE)
“Eu entendo perfeitamente… existe um jeito diferente…”

FECHAMENTO DO CPL 1
- PARTE 1 (OPCIONAL): REVISAR O QUE FOI APRENDIDO
- PARTE 2 (OBRIGATÓRIA): ANTECIPAR O PRÓXIMO EPISÓDIO / LUPIN PARA CPL2
- ESTIMULAR PARTICIPAÇÃO NA COMUNIDADE (PROVA, PROVA SOCIAL, GATILHO COMUNIDADE)

OBJEÇÕES CPL1
- PASSO 1: ATUALIZAR ÁRVORE DE OBJEÇÕES
- PASSO 2: ESCOLHER QUAIS OBJEÇÕES ENFRAQUECER NO CPL1
- PASSO 3: DEFINIR LOCAL NO SCRIPT
- PASSO 4: INSERIR O COMBATE

RASCUNHO CPL 1 – REGRAS
1) QUANDO ARQUÉTIPO JCE, MOSTRAR ERROS NÃO ÓBVIOS
2) QUANDO OPORTUNIDADE, MOSTRAR OPORTUNIDADES NÃO ÓBVIAS
3) FINAL RESUMO + LUPIN + CHAMADA PARA COMUNIDADE (EX.: GRUPO WHATSAPP)
4) CONSIDERAR PRESENTE PARA QUEM POSTAR E MARCAR @IA.FABIANA
5) REFORÇAR QUE O CAMINHO ATUAL NÃO LEVA AO DESTINO E QUE ELA ESTÁ GASTANDO “GASOLINA” À TOA.`;

const CPL1_PHASE_FRAMEWORK = `QUAIS GATILHOS USAR NO CPL 1
Reciprocidade · Autoridade · Prova · Similaridade · História · Procedência · Especificidade · Surpresa · Comunidade e participação · Antecipação · Razão

JEITO CERTO VS JEITO ERRADO
- Mostre erros não óbvios, com empatia e similaridade: “Se eu estivesse no seu lugar…”
- Gatilho obrigatório: Razão (prove o porquê de estar errado)
- Mostre evidências (ex.: perfis que não vendem) e padrões
- Especificidade no “por que está errado” para gerar plausibilidade
- Faça o avatar pensar “não é minha culpa, me ensinaram errado”

OPORTUNIDADE
- Empatia + similaridade para mostrar que você também faria igual
- Prove que existe um caminho novo mais eficiente
- Mostre evidências e padrões (casos, prints, métricas)
- Use exemplos aplicados (Instagram, emagrecimento, produtividade)

FECHAMENTO
- Revisar aula
- Lupin para CPL2 (“no próximo encontro vamos…”)
- Chamada para comunidade para gerar prova social, comunidade, participação

OBJEÇÕES
- Atualize a árvore após escrever
- Escolha quais objeções enfraquecer e onde inseri-las

GATILHOS OBRIGATÓRIOS
Reciprocidade, Autoridade, Prova, Similaridade, História, Procedência, Especificidade, Surpresa, Comunidade/Participação, Antecipação.

Reforce que o caminho atual não leva à ROMA e que o método proposto é o único caminho replicável.`;

const CPL2_PHASE_KEYPOINTS = `CPL#02 — CONSIDERAÇÕES GERAIS
- Abra com um RESUMO rápido do CPL1 (ROMA, provas, principais aprendizados) e cite a interação da comunidade.
- Lembre o público de que agora os gatilhos mentais ficam mais intensos e que já existem pessoas comentando/participando (prova social).
- Antecipe levemente a oferta (~10% do tempo) usando gatilho do DESAPEGO: “Sim, existe uma solução mais profunda, mas hoje o foco é você aproveitar o conteúdo gratuito.”
- Duração: de 8 a 180 minutos. O sentimento final precisa ser “Pelo amor de Deus, eu quero mais disso”.

ESTRUTURA RESUMIDA DO CPL2
ROMA · PROVA · REVISÃO · CONTEÚDO · OFERTA (tease) · FECHAMENTO
- Erico costuma fazer: Revisão > Provas > Conteúdo.
- Sempre que citar pessoas, use apenas o primeiro nome para manter proximidade.

ROMA
- Recapture a promessa e contextualize o episódio (“Hoje vou te mostrar como melhorar X…”).
- Logo em seguida, provoque: “Parece bom demais? Então deixa eu te mostrar algo…” e transicione para PROVA.

PROVA
- Não repita as mesmas provas do CPL1. Se não houver prova nova, não use (melhor nada que repetido).
- Cada prova precisa mostrar que ROMA é possível apesar de uma objeção específica.
- Prove rapidamente para matar o São Tomé antes que cresça.

REVISÃO
- Ative curiosidade para quem perdeu o CPL1 (“Teve gente que...”).
- Compartilhe números/relatos da comunidade (mesmo poucos: “2 é maior que zero”).
- Faça a ponte: “Entra lá porque agora vou te ensinar…”

CONTEÚDO
- Jeito certo: explique o método + por que esse é o jeito certo (não basta mostrar, precisa justificar).
- Erros comuns que precisamos evitar: conteúdo óbvio demais, transformar o “jeito certo” em “compre meu curso”, não detalhar o raciocínio.
- Use exemplos de Oportunidade Amplificada (produtividade, finanças etc.) para demonstrar empatia, similaridade e amplificar a oportunidade.

OFERTA (TEASER)
- Use ganchos de descontinuidade/de desapego: “Eu dei o máximo dentro do tempo… sei que alguns querem algo mais completo… sim, existe um programa, mas vou falar disso mais para frente.”
- Não explicar o que é nem quando abre; apenas sinalizar que haverá inscrições.

FECHAMENTO
- Faça um “resumo da ópera” do CPL2, relembre o CPL1 e diga que vem mais.
- Antecipação obrigatória: “No próximo episódio vou revelar…”
- Enquanto o próximo CPL não chega, recomende: (1) comentar na comunidade o que aprendeu e fazer perguntas, (2) escrever um resumo das aulas, (3) rever os episódios anteriores.

OBJEÇÕES
- Depois de escrever o CPL2, atualize a Árvore de Objeções (AO).
- Identifique quais objeções surgiram agora ou ficaram mais fortes.
- Escolha onde cada combate entra no script e insira imediatamente.
- Reavalie também as objeções do CPL1 para ver se algo mudou.`;

const CPL2_PHASE_FRAMEWORK = `ESTRUTURA DO CPL2
ROMA (sem formalidade, só primeiro nome) · PROVA NOVA · REVISÃO + PROVA SOCIAL · CONTEÚDO (jeito certo + razão) · TEASER DA OFERTA COM DESAPEGO · FECHAMENTO/ANTECIPAÇÃO

Diretrizes táticas:
- Comece recapitulando CPL1 e reforçando participação da comunidade/grupo.
- Use gatilhos mais fortes: prova social (comentários do CPL1), comunidade, antecipação, desapego.
- Conteúdo precisa causar “agora entendi”, não algo que o avatar já sabe.
- Mostre oportunidade nova (ou erros não óbvios) e explique por que o método funciona.
- Não repita provas. Provas precisam atacar objeções específicas e frescas.
- Revisão deve gerar curiosidade para assistir CPL1 e trazer novos para a comunidade.
- Quando mencionar a oferta, seja 90% desapego / 10% antecipação. Não revelar datas nem detalhes.
- Feche com resumo + próximos passos (comunidade, resumo escrito, rever aulas).
- Objeções podem ser combatidas em qualquer ponto, desde que venham da Árvore atualizada.

Gatilhos reforçados
Empatia · Similaridade · Prova social · Desapego · Antecipação · Comunidade · Especificidade · Curiosidade · Razão.

Exemplos úteis
- Produtividade: “Eu também já testei todos os apps…” (mostra empatia + oportunidade).
- Finanças: “Guardar na poupança parece seguro, mas te faz perder dinheiro…” (razão + oportunidade).

Checklist pós-roterização
- Atualizar AO, definir onde cada objeção será combatida e inserir nos blocos.
- Garantir call-to-action para a comunidade e para revisão dos episódios anteriores.
- Verificar se o final gera desejo intenso pelo CPL3.`;

const CPL3_PHASE_KEYPOINTS = `CPL#03 — CONSIDERAÇÕES GERAIS
- Objetivo principal: demonstrar que o seu produto é o veículo ideal para levar o avatar até a ROMA.
- CPL3 precisa terminar de resolver objeções específicas de compra (preço, tempo, confiança, suporte, etc.).
- Introduza o gatilho de ESCASSEZ junto com DESAPEGO desde cedo.
- Planeje dedicar 30% a 50% do tempo para explicar a oferta completa e o passo a passo para se inscrever (dia, hora, condições).
- Intensifique a antecipação para a abertura do carrinho; o CPL3 deve funcionar como um pseudo “preview do carrinho”.

ESTRUTURA PROPONTA
ROMA · REVISÃO + PROVA SOCIAL · CONTEÚDO (com foco em objeções) · OFERTA · FECHAMENTO
- Duração: sem limite rígido, mas costuma ser maior que CPL1 e CPL2.

ROMA
- Reapresente rapidamente a promessa usando apenas primeiro nome para manter conexão.

REVISÃO + PROVA SOCIAL
- Fazer breve recapitulação do CPL1 e CPL2, ressaltando aprendizados.
- Incentive quem perdeu a assistir logo (vai sair do ar em X dias).
- Traga provas novas: comentários da comunidade, clipes de stories, depoimentos coletados após o CPL2.

CONTEÚDO
- Anuncie: “Nesta aula eu vou te explicar X (mecanismo do produto)”.
- Antes de escolher o arquétipo, atualize a Árvore de Objeções e liste o que precisa ser combatido.
- Defina o arquétipo (amostra/demonstração) e crie uma sessão dedicada a derrubar cada objeção (“obstáculos e como vencer”).

OFERTA
- Estruture como no lançamento semente: apresente o programa (GPT da Beleza), descreva entregáveis e benefícios (não basta ter, precisa parecer que tem).
- Fale de preço, garantia e escassez (vagas, tempo, bônus, acompanhamento).
- Use o gancho: “Se você quiser embarcar com a gente, a chance é agora”.
- Mostre claramente como se inscrever: datas, horário, link/canal, etapas.

FECHAMENTO
- Revise tudo o que a pessoa aprendeu na série e cite a quantidade de participantes/comentários.
- Reforce como a comunidade está ativa e até quando fica aberta.
- Liste o plano de preparação: reassistir aulas, fazer resumo, postar perguntas na comunidade, preparar-se para o dia da matrícula.
- Avise exatamente quando te encontrar (“te vejo no dia X às Yh para segurar sua mão na abertura”).
- Agradeça, faça a despedida e mantenha o clima de urgência suave.

CHECKLIST DE OBJEÇÕES
- Atualize a AO depois de escrever o CPL3.
- Garanta que todas as objeções críticas de compra estejam alocadas em blocos específicos e respondidas explicitamente.`;

const CPL3_PHASE_FRAMEWORK = `ESTRUTURA DO CPL3
ROMA (reapresentação leve) · REVISÃO + PROVA SOCIAL NOVA · CONTEÚDO FOCADO EM OBJEÇÕES · OFERTA COMPLETA · FECHAMENTO COM ANTECIPAÇÃO

Diretrizes de conteúdo:
- Gere forte prova social: “Ontem 327 pessoas comentaram na comunidade...”
- Ressalte que CPL1 e CPL2 sairão do ar (gatilho escassez de conteúdo) para estimular binge watching.
- Ao explicar o conteúdo, conecte cada bloco a uma objeção (“Talvez você pense que não tem tempo… deixa eu te mostrar como…”).
- Tenha uma sessão dedicada a obstáculos e como vencê-los.

Diretrizes da oferta:
- Gatilho Desapego: “Se não for para você tudo bem, o conteúdo gratuito já valeu”.
- Escassez: vagas limitadas, bônus que expiram, tempo de inscrição.
- Detalhe entregáveis, benefícios, suporte, garantia, preço, condições de pagamento.
- Passo a passo para se inscrever (onde clicar, quando, o que precisa ter em mãos).

Gatilhos recomendados (baseado no texto):
- Escassez + Desapego desde a introdução.
- Prova social e comunidade (quantidade de pessoas, comentários, interações).
- Autoridade e especificidade ao detalhar o método.
- Reciprocidade (entregando conteúdo útil antes da oferta) e Antecipação (data/horário da abertura).
- Procedência e História curta para reforçar confiança.
- Urgência suave (“só até dia tal”).

Checklist final:
- Revisão reforça aprendizado e chama quem perdeu.
- Comunidade tem CTA claro com deadline.
- Preparação pré-carrinho está explícita (reassistir, resumo, perguntas, agenda do dia X).
- Todas as objeções mapeadas foram respondidas no script.`;

const PHASE_GUIDANCE_PRESETS: Record<string, GuidanceEntry> = {
  PPL: {
    keyPoints: 'Reaqueça a base com lives semanais, séries PEC/REP e convites VIP seletivos. CTA principal: entrar na lista VIP e participar das micro-ativacões antes dos CPLs.',
    framework: 'Gatilhos: antecipação, pertencimento, autoridade e prova social através de bastidores e depoimentos rápidos.',
  },
  CLI: {
    keyPoints: 'Convide para a aula com CTA claro, foque em lista qualificada e preparo de comunicacao.',
    framework: 'Gatilhos: curiosidade, especificidade e prova social leve.',
  },
  AL: {
    keyPoints: 'Engaje inscritos com lembretes e beneficios da aula, reduzindo faltas.',
    framework: 'Gatilhos: antecipacao, pertencimento e reciprocidade.',
  },
  SEED_WEBINAR: {
    keyPoints: 'Aula com promessa clara, conteudo de valor e oferta ao final.',
    framework: 'Gatilhos: autoridade, prova e especificidade.',
  },
  SEED_CART: {
    keyPoints: 'Carrinho aberto com mensagens diretas e remocao de objecoes.',
    framework: 'Gatilhos: urgencia, compromisso e clareza.',
  },
  SEED_DELIVERY: {
    keyPoints: 'Entregue valor rapido e acompanhe alunos para gerar provas iniciais.',
    framework: 'Gatilhos: reciprocidade e prova social emergente.',
  },
  SEED_DEBRIEF: {
    keyPoints: 'Analise resultados, registre aprendizados e ajustes do proximo ciclo.',
    framework: 'Gatilhos: melhoria continua e foco em validacao.',
  },
  CPL1: {
    keyPoints: CPL1_PHASE_KEYPOINTS,
    framework: CPL1_PHASE_FRAMEWORK,
  },
  CPL2: {
    keyPoints: CPL2_PHASE_KEYPOINTS,
    framework: CPL2_PHASE_FRAMEWORK,
  },
  CPL3: {
    keyPoints: CPL3_PHASE_KEYPOINTS,
    framework: CPL3_PHASE_FRAMEWORK,
  },
  L1: {
    keyPoints: 'Abertura oficial do carrinho com recapitulação da promessa, apresentação completa da oferta, bônus e condições.',
    framework: 'Gatilhos: escassez inicial, urgência, autoridade e prova social recente das turmas anteriores.',
  },
  L2: {
    keyPoints: 'Meio do carrinho com foco em depoimentos, estudos de caso e respostas às objeções mais fortes.',
    framework: 'Gatilhos: prova social aprofundada, comunidade, quebra de objeções e reforço de pertencimento.',
  },
  L3: {
    keyPoints: 'Fechamento enfatizando última chamada, custo da inação e repetindo bônus e garantias que expiram.',
    framework: 'Gatilhos: urgência final, perda evitável, compromisso e garantia reforçada.',
  },
};

export const applyPhaseGuidanceDefaults = (map: GuidanceMap, phaseIds: string[]): GuidanceMap => {
  let changed = false;
  const next: GuidanceMap = { ...map };
  phaseIds.forEach(phaseId => {
    const key = guidanceKeyForPhase(phaseId);
    if (!next[key] || (!next[key].keyPoints && !next[key].framework)) {
      const preset = PHASE_GUIDANCE_PRESETS[phaseId];
      if (preset) {
        next[key] = { ...preset };
        changed = true;
      }
    }
  });

  return changed ? next : map;
};

export const getLaunchDataSnapshot = (data: LaunchData | null | undefined) => ({
  generalTriggers: data?.generalTriggers ?? '',
  productName: data?.productName ?? '',
  niche: data?.niche ?? '',
  targetAudience: data?.targetAudience ?? '',
  avatarName: data?.avatarName ?? '',
  mainProblem: data?.mainProblem ?? '',
  mainBenefit: data?.mainBenefit ?? '',
  avatarStory: data?.avatarStory ?? '',
  avatarAge: data?.avatarAge ?? '',
  avatarGender: data?.avatarGender ?? '',
  avatarSalary: data?.avatarSalary ?? '',
  avatarProfession: data?.avatarProfession ?? '',
  avatarReligion: data?.avatarReligion ?? '',
  avatarPoliticalOrientation: data?.avatarPoliticalOrientation ?? '',
  avatarOtherDetails: data?.avatarOtherDetails ?? '',
  avatarSummary: data?.avatarSummary ?? '',
  avatarPains: data?.avatarPains ?? '',
  avatarDesires: data?.avatarDesires ?? '',
  avatarObjections: data?.avatarObjections ?? '',
  avatarRomaMyth: data?.avatarRomaMyth ?? '',
  avatarFear: data?.avatarFear ?? '',
  avatarLimitingBeliefs: data?.avatarLimitingBeliefs ?? '',
  avatarQuote: data?.avatarQuote ?? '',
  avatarOpportunitiesShortcuts: data?.avatarOpportunitiesShortcuts ?? '',
  avatarResearchABC: data?.avatarResearchABC ?? '',
  cplThreeSolution: data?.cplThreeSolution ?? '',
  price: data?.price ?? '',
  anchorPrice: data?.anchorPrice ?? '',
  guarantee: data?.guarantee ?? '',
  bonuses: data?.bonuses ?? '',
  paymentMethods: data?.paymentMethods ?? '',
  scarcity: data?.scarcity ?? '',
  offerDetails: data?.offerDetails ?? '',
  launchModel: data?.launchModel ?? 'opportunity',
  launchType: data?.launchType ?? 'classic',
});
