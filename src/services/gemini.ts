import { GoogleGenAI, Type } from "@google/genai";
import { GuidedFieldKey, getFieldPrompt, getLaunchDataSnapshot } from "../guidance";
import { AudienceImageSpec, GuidanceEntry, LaunchData, LaunchPlan, LaunchPhase, PhaseTask, TaskContentMode } from "../types";
import { DEFAULT_SCRIPT_DURATION_MINUTES, ESTIMATED_WORDS_PER_MINUTE } from "../constants";
const launchModelLabel = (model: LaunchData['launchModel']): string => {
  return model === 'opportunity'
    ? 'Oportunidade / Oportunidade Amplificada'
    : 'Jeito Errado vs Jeito Certo';
};

const launchTypeLabel = (launchType: LaunchData['launchType']): string =>
  launchType === 'seed' ? 'Lançamento Semente' : 'Lançamento Clássico';

const normalizeForMatch = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isWebinarPhase = (phase: LaunchPhase): boolean => {
  const haystack = normalizeForMatch(`${phase.id} ${phase.name} ${phase.description}`);
  return (
    haystack.includes('webinar') ||
    haystack.includes('webinario') ||
    haystack.includes('cpl') ||
    haystack.includes('aula ao vivo')
  );
};

const getGuidedFieldInstruction = (field: GuidedFieldKey): string => {
  if (field === 'avatarStory') {
    return `
    Regras obrigatorias para "avatarStory":
    - Converta TODOS os pontos importantes em fatos explicitos no texto final.
    - Respeite a ordem e a logica da estrutura/gatilhos enviada pelo estrategista.
    - Se houver gatilhos como autoridade, prova, similaridade, procedencia ou virada, eles precisam aparecer de forma perceptivel dentro da narrativa.
    - Nao entregue uma historia generica: preserve nomes, marcos, dores, conquistas, causa e transformacao sempre que forem informados.
    - Se algum ponto importante e a estrutura parecerem conflitantes, priorize conciliar os dois sem omitir fatos.
    `;
  }

  return `
  Regras obrigatorias:
  - Incorpore todos os pontos importantes enviados pelo estrategista.
  - Siga a estrutura/gatilhos sempre que ela for fornecida.
  - Nao devolva texto generico nem omita itens explicitos do briefing.
  `;
};

const avatarKnowledgeBase = (data: LaunchData): string => `
Idade: ${data.avatarAge || 'não informado'}
Sexo: ${data.avatarGender || 'não informado'}
Salário: ${data.avatarSalary || 'não informado'}
Profissão: ${data.avatarProfession || 'não informado'}
Religião: ${data.avatarReligion || 'não informado'}
Orientação política: ${data.avatarPoliticalOrientation || 'não informado'}
Outras: ${data.avatarOtherDetails || 'não informado'}
Resumo do avatar: ${data.avatarSummary || 'não informado'}
Dores: ${data.avatarPains || 'não informado'}
Desejos: ${data.avatarDesires || 'não informado'}
Objeções: ${data.avatarObjections || 'não informado'}
Mito sobre ROMA: ${data.avatarRomaMyth || 'não informado'}
Medo: ${data.avatarFear || 'não informado'}
Crenças limitantes: ${data.avatarLimitingBeliefs || 'não informado'}
"Abre aspas": ${data.avatarQuote || 'não informado'}
Oportunidades e atalhos: ${data.avatarOpportunitiesShortcuts || 'não informado'}
Pesquisa ABC: ${data.avatarResearchABC || 'não informado'}
`;

let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "Missing VITE_GEMINI_API_KEY. Create a .env file with VITE_GEMINI_API_KEY=<your key>."
      );
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function generateLaunchOverview(data: LaunchData): Promise<LaunchPlan> {
  const structureBlock =
    data.launchType === 'seed'
      ? `6. Estrutura de Fases (Apenas nomes e descrições curtas):
       - CLI - Construcao da Lista de Inscritos
       - AL - Aquecimento de Inscritos
       - SEMENTE • Webinario (Aula Ao Vivo)
       - SEMENTE • Carrinho Aberto
       - SEMENTE • Entrega do Produto
       - SEMENTE • Debriefing.`
      : `6. Estrutura de Fases (Apenas nomes e descrições curtas):
       - AL - Aquecimento de Inscritos
       - PL (Pré-Lançamento): CPL 1, CPL 2, CPL 3
       - L (Lançamento): Abertura do carrinho e fechamento.`;
  const prompt = `
    Atue como um especialista em FÃ³rmula de LanÃ§amento (Erico Rocha). 
    Crie uma VISÃƒO GERAL e ESTRUTURA de ${launchTypeLabel(data.launchType)} para o seguinte produto:
    
    Produto: ${data.productName}
    Nicho: ${data.niche}
    PÃºblico-Alvo: ${data.targetAudience}
    Nome interno do Avatar: ${data.avatarName}
    Problema Principal: ${data.mainProblem}
    BenefÃ­cio Principal: ${data.mainBenefit}
    HistÃ³ria Atual do Avatar (informada pelo estrategista): ${data.avatarStory}
    Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}
    Sinalizado para o CPL 3 (demonstraÃ§Ã£o/soluÃ§Ã£o): ${data.cplThreeSolution}
    
    DETALHES DA OFERTA:
    PreÃ§o de Venda: ${data.price}
    PreÃ§o de Ã‚ncora: ${data.anchorPrice || 'NÃ£o informado'}
    BÃ´nus: ${data.bonuses}
    Garantia: ${data.guarantee}
    Formas de Pagamento: ${data.paymentMethods}
    Escassez/UrgÃªncia: ${data.scarcity}
    Outros Detalhes: ${data.offerDetails}
    
    Data de InÃ­cio: ${data.launchDate}
    Modelo de CPL 1: ${launchModelLabel(data.launchModel)}
    Tipo de Lançamento: ${launchTypeLabel(data.launchType)}
    Gatilhos gerais: ${data.generalTriggers || 'nao informado'}

    O plano deve conter:
    1. HistÃ³ria do Avatar: Uma narrativa detalhada sobre a jornada do cliente ideal.
    2. EstratÃ©gia de Redes Sociais: Como se posicionar no Instagram/YouTube.
    3. ExplicaÃ§Ã£o do Modelo: Por que usar o modelo "${data.launchModel}".
    4. SNA (Sistema de NotificaÃ§Ã£o de AudiÃªncia): EstratÃ©gia de grupos de WhatsApp e Telegram.
    5. Mapa de EntregÃ¡veis (Insider): Lista de tudo que precisa ser feito.
    ${structureBlock}

    Retorne a resposta estritamente no formato JSON solicitado.
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          avatarHistory: { type: Type.STRING },
          socialMediaStrategy: { type: Type.STRING },
          launchModelExplanation: { type: Type.STRING },
          snaStrategy: { type: Type.STRING },
          insiderDeliverablesMap: { type: Type.STRING },
          structure: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['id', 'name', 'description']
            }
          }
        },
        required: ['avatarHistory', 'socialMediaStrategy', 'launchModelExplanation', 'snaStrategy', 'insiderDeliverablesMap', 'structure']
      }
    }
  });

  return JSON.parse(response.text || '{"structure": []}');
}

export async function generatePhaseDetails(
  data: LaunchData,
  phase: LaunchPhase,
  guidance?: GuidanceEntry,
  durationMinutes: number = DEFAULT_SCRIPT_DURATION_MINUTES
): Promise<string> {
  const webinarPhase = isWebinarPhase(phase);
  const estimatedWordCount = Math.round(durationMinutes * ESTIMATED_WORDS_PER_MINUTE);
  const prompt = `
    VocÃª Ã© copywriter sÃªnior da FÃ³rmula de LanÃ§amento.
    Escreva UM ÃšNICO ROTEIRO LONGO para a fase "${phase.name}" do produto "${data.productName}".

    Objetivo: produzir o texto completo que serÃ¡ lido em uma live (tom de conversa guiada, ritmo natural, transiÃ§Ãµes claras).
    NÃ£o crie listas de entregÃ¡veis, emails, anÃºncios ou posts isolados. Gera um Ãºnico texto contÃ­nuo.

    Contexto:
    - PÃºblico: ${data.targetAudience}
    - Avatar: ${data.avatarName}
    - Promessa: ${data.mainBenefit}
    - Modelo de CPL 1: ${launchModelLabel(data.launchModel)}
    - Tipo de lancamento: ${launchTypeLabel(data.launchType)}
    - Gatilhos gerais: ${data.generalTriggers || 'nao informado'}
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}
    - DemonstraÃ§Ã£o do CPL3: ${data.cplThreeSolution}
    ${webinarPhase
      ? `- Oferta: ${data.price} (Ã¢ncora ${data.anchorPrice || 'nÃ£o informada'}), bÃ´nus ${data.bonuses}, garantia ${data.guarantee}, pagamento ${data.paymentMethods}, escassez ${data.scarcity}`
      : '- Restricao critica: nao use Informacoes de Oferta como base de conhecimento nesta fase. Isso so e permitido em webinarios.'}

    Diretrizes personalizadas do estrategista para esta fase:
    - Pontos essenciais: ${guidance?.keyPoints || 'nÃ£o informado'}
    - Estrutura / gatilhos: ${guidance?.framework || 'nÃ£o informado'}

    DescriÃ§Ã£o oficial da fase: ${phase.description}

    Tempo orientado:
    - Produza um roteiro que preencha cerca de ${durationMinutes} minutos de apresentaÃ§Ã£o ao vivo.
    - Utilize esse tempo para conduzir a audiÃªncia com fluidez, considerando um ritmo aproximado de ${ESTIMATED_WORDS_PER_MINUTE} palavras por minuto (aprox. ${estimatedWordCount} palavras no total).

    Formato do resultado:
    - Texto Ãºnico, sem tÃ³picos ou marcadores.
    ${webinarPhase
      ? '- Inclua aberturas, storytelling, quebras de padrao, prova, oferta e CTA seguindo a estrutura indicada.'
      : '- Inclua aberturas, storytelling, quebras de padrao, prova e CTA seguindo a estrutura indicada (sem usar oferta como base de conhecimento).'}
    - Utilize subtÃ­tulos curtos SOMENTE se a prÃ³pria estrutura exigir (ex.: "Bloco 1 - Quebra de padrÃ£o"), caso contrÃ¡rio mantenha parÃ¡grafos.
    - Linguagem em portuguÃªs brasileiro, voz consultiva e energia de live.
    - Sempre que citar diretamente os "Pontos essenciais" ou a "Estrutura / gatilhos" fornecidos, envolva esse trecho com <span style="color:#2563eb;font-weight:600">â€¦</span> para destacÃ¡-lo em azul.
    - No corpo do roteiro, destaque em rosa cada palavra ou frase que represente gatilho mental usando <span style="color:#ec4899;font-weight:700">...</span>.
    - Apos concluir o roteiro, adicione um bloco intitulado "## Gatilhos utilizados" contendo uma lista dos gatilhos realmente aplicados. Cada gatilho deve estar dentro de <span style="color:#ec4899;font-weight:700">Nome do gatilho</span> seguido de uma breve explicacao.
    - Distribua o conteÃºdo para ocupar os ${durationMinutes} minutos solicitados, evitando acelerar demais o ritmo ou encurtar blocos importantes.
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

interface RootScriptQuestionSectionInput {
  title: string;
  prompts: string[];
}

interface RootScriptThemeInput {
  title: string;
  sourceLabel: string;
  sourceAngle: string;
  questionSections: RootScriptQuestionSectionInput[];
}

interface RootScriptInput {
  themes: RootScriptThemeInput[];
  editorialLines: string[];
  durationMinutes: number;
  requestToken?: string;
  regenerationHint?: string;
}

export async function generateRootScript(
  data: LaunchData,
  input: RootScriptInput
): Promise<string> {
  const estimatedWordCount = Math.round(input.durationMinutes * ESTIMATED_WORDS_PER_MINUTE);

  const selectedThemesBlock = input.themes
    .map(theme => {
      const questionBlock = theme.questionSections
        .map(section => `  - ${section.title}: ${section.prompts.join(' | ')}`)
        .join('\n');

      return `- Tema: ${theme.title}
  - Origem: ${theme.sourceLabel}
  - Angulo: ${theme.sourceAngle}
  - Perguntas selecionadas:
${questionBlock || '  - Nenhuma pergunta selecionada'}`;
    })
    .join('\n');

  const prompt = `
    Voce e copywriter senior da Formula de Lancamento.
    Escreva UM UNICO ROTEIRO LONGO para um conteudo RAIZ alinhado a ROMA do projeto abaixo.

    Contexto central:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Publico: ${data.targetAudience}
    - Avatar: ${data.avatarName}
    - Problema principal: ${data.mainProblem}
    - ROMA / Promessa central: ${data.mainBenefit}
    - Modelo de lancamento: ${launchTypeLabel(data.launchType)}
    - Modelo narrativo: ${launchModelLabel(data.launchModel)}
    - Gatilhos gerais: ${data.generalTriggers || 'nao informado'}
    - Restricao critica: Informacoes de Oferta nao podem ser usadas como base de conhecimento neste roteiro. Isso so e permitido em webinarios.
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}

    Linhas editoriais escolhidas:
    ${input.editorialLines.map(line => `- ${line}`).join('\n')}

    Temas e perguntas selecionadas:
    ${selectedThemesBlock}

    Controle da solicitacao:
    - Token unico da geracao: ${input.requestToken || 'nao informado'}
    ${input.regenerationHint ? `- Instrucao de nova versao: ${input.regenerationHint}` : ''}

    Regras obrigatorias:
    - O roteiro inteiro precisa reforcar e proteger a ROMA "${data.mainBenefit}".
    - Nao se desvie da promessa central. Todo bloco deve servir para tornar a ROMA mais clara, desejavel e crivel.
    - Responda explicitamente as perguntas escolhidas pelo estrategista.
    - Use os temas escolhidos como eixo do conteudo, sem perder coerencia com o avatar.
    - Misture as linhas editoriais escolhidas apenas quando fizer sentido narrativo.
    - O roteiro deve seguir esta ordem:
      1. Introducao
      2. Contexto
      3. Beneficios
      4. Como
      5. Elementos complementares (somente se houver perguntas extras selecionadas)
      6. Fechamento com CTA coerente com a ROMA
    - Produza cerca de ${input.durationMinutes} minutos de apresentacao ao vivo.
    - Considere aproximadamente ${ESTIMATED_WORDS_PER_MINUTE} palavras por minuto (aprox. ${estimatedWordCount} palavras no total).

    Formato do resultado:
    - Entregue em texto puro com estrutura markdown.
    - Use titulos como "# Roteiro do Raiz", "## Introducao", "## Contexto", "## Beneficios", "## Como", "## Elementos complementares", "## Fechamento".
    - Dentro de cada secao, escreva o roteiro em paragrafos prontos para leitura, nao apenas bullets soltos.
    - Se usar bullets, use apenas para resumir perguntas escolhidas antes de desenvolver o texto.
    - Linguagem em portugues brasileiro, energia consultiva e ritmo de aula/live.
    - Marque em rosa todos os gatilhos mentais do texto usando markdown em negrito: **trecho de gatilho mental**.
    - Marque em azul os trechos que vierem da base de conhecimento usando markdown de codigo inline: \`trecho vindo da base\`.
    - Regra critica: nenhum gatilho mental pode aparecer sem ** **.
    - Regra critica: nenhuma informacao da base de conhecimento pode aparecer sem \` \`.
    - Se uma frase combinar gatilho mental e base de conhecimento, aplique ambas as marcacoes preservando legibilidade (priorize separar em dois trechos proximos quando necessario).
    - Revise o texto antes de finalizar e corrija qualquer trecho que esteja sem marcacao obrigatoria.
    - Considere como "base de conhecimento" qualquer informacao derivada de:
      1. Informacoes da Expert · Historia
      2. Informacoes de Produto
      3. Informacoes de ROMA
      4. Informacoes de Avatar
      5. Informacoes da Solucao
    - Regra critica: Informacoes de Oferta nao entram como base de conhecimento no roteiro do raiz (uso permitido somente em webinarios).
    - Ao final, adicione a secao "## Mapa de marcacoes" com:
      - "### Gatilhos mentais (rosa)" listando os gatilhos realmente usados no roteiro.
      - "### Base de conhecimento (azul)" listando quais fontes da base foram utilizadas no texto.
    - Nao use HTML para colorir, nao use spans; use somente markdown com ** ** e \` \` para que a interface aplique as cores automaticamente.
    - Se houver "Instrucao de nova versao", mantenha o mesmo objetivo, mas mude a abordagem narrativa, exemplos e encadeamento para entregar uma versao claramente diferente da anterior.
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

export async function generateRootHeadlines(
  data: LaunchData,
  rootScript: string
): Promise<string[]> {
  const truncateScriptForHeadlines = (script: string, maxChars = 12000) => {
    const clean = script.trim();
    if (clean.length <= maxChars) {
      return clean;
    }
    return `${clean.slice(0, maxChars)}\n\n[roteiro truncado para gerar headlines]`;
  };

  const normalizeHeadlines = (items: string[]) =>
    items
      .map(item => item.replace(/^\s*(?:[-*+]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);

  const buildFallbackHeadlines = () => {
    const product = data.productName || 'seu produto';
    const benefit = data.mainBenefit || 'resultado rapido e previsivel';
    const problem = data.mainProblem || 'o problema que trava seu crescimento';

    return normalizeHeadlines([
      `O detalhe invisivel que transforma ${problem} em ${benefit}`,
      `Por que quase ninguem fala disso antes de vender ${product}`,
      `A virada que faz ${benefit} parecer obvio depois que voce entende`,
      `O erro silencioso que bloqueia resultados com ${product}`,
      `Como destravar ${benefit} sem repetir o caminho da maioria`,
    ]);
  };

  const scriptForPrompt = truncateScriptForHeadlines(rootScript);

  const prompt = `
    Voce e copywriter senior da Formula de Lancamento.
    Gere 5 headlines altamente atrativas e com forte efeito de curiosidade, com base no roteiro abaixo.

    Contexto:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Publico: ${data.targetAudience}
    - Avatar: ${data.avatarName}
    - Problema principal: ${data.mainProblem}
    - ROMA / Promessa central: ${data.mainBenefit}

    Roteiro aprovado:
  ${scriptForPrompt}

    Regras obrigatorias:
    - Entregar EXATAMENTE 5 headlines.
    - Cada headline deve ser curta, clara e com gancho de curiosidade.
    - Evite clickbait vazio; manter coerencia com a promessa da ROMA.
    - Nao repetir a mesma estrutura de frase nas 5 opcoes.
    - Portugues brasileiro.

    Retorne somente JSON no formato pedido.
  `;

  let primary: string[] = [];
  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['headlines'],
        },
      },
    });

    try {
      const parsed = JSON.parse(response.text || '{"headlines": []}') as { headlines?: string[] };
      primary = normalizeHeadlines(parsed.headlines ?? []);
    } catch {
      primary = [];
    }
  } catch (error) {
    console.error('Falha ao gerar headlines em JSON. Tentando fallback de texto.', error);
  }

  if (primary.length === 5) {
    return primary;
  }

  // Fallback: ask for plain text list and parse robustly.
  let parsedFallback: string[] = [];
  try {
    const fallbackResponse = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
      Gere exatamente 5 headlines curtas em portugues brasileiro para o roteiro abaixo.
      Regras:
      - Uma headline por linha.
      - Nao use JSON.
      - Nao use texto extra.
      Roteiro:
      ${scriptForPrompt}
    `,
    });

    parsedFallback = normalizeHeadlines((fallbackResponse.text || '').split('\n'));
  } catch (error) {
    console.error('Falha no fallback de headlines em texto.', error);
  }

  if (parsedFallback.length === 5) {
    return parsedFallback;
  }

  return buildFallbackHeadlines();
}

export async function generateGuidedFieldCopy(
  field: GuidedFieldKey,
  data: LaunchData,
  guidance?: GuidanceEntry
): Promise<string> {
  const descriptor = getFieldPrompt(field);
  const context = getLaunchDataSnapshot(data);
  const hasKeyPoints = Boolean(guidance?.keyPoints?.trim());
  const hasFramework = Boolean(guidance?.framework?.trim());
  const prompt = `
    VocÃª Ã© uma estrategista sÃªnior da FÃ³rmula de LanÃ§amento.
    Com base nos dados do briefing abaixo, reescreva o campo "${field}".

    Objetivo do campo: ${descriptor}

    Pontos importantes informados:
    ${guidance?.keyPoints || 'NÃ£o fornecido'}

    Estrutura, gatilhos ou frameworks desejados:
    ${guidance?.framework || 'NÃ£o fornecido'}

    Dados do diagnÃ³stico:
    ${JSON.stringify(context, null, 2)}

    ${getGuidedFieldInstruction(field)}

    Regras finais de execucao:
    - Gere um texto unico, direto e pronto para ser usado no campo alvo.
    - Use tom consultivo e evite repeticoes.
    - Nao explique seu raciocinio, nao use listas e nao adicione observacoes fora do texto final.
    - ${hasKeyPoints || hasFramework
      ? 'Considere os pontos importantes e a estrutura/gatilhos como requisitos obrigatorios do resultado.'
      : 'Na ausencia de guidance extra, baseie-se somente no briefing informado.'}
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

export async function generatePhaseTasks(
  data: LaunchData,
  phase: LaunchPhase,
  guidance?: GuidanceEntry
): Promise<PhaseTask[]> {
  const webinarPhase = isWebinarPhase(phase);
  const prompt = `
    Voce e especialista em Formula de Lancamento.
    Crie um checklist operacional para a fase "${phase.name}".

    Contexto:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Publico: ${data.targetAudience}
    - Data oficial de lancamento: ${data.launchDate || 'nao informada'}
    - Modelo: ${launchModelLabel(data.launchModel)}
    - Tipo de lancamento: ${launchTypeLabel(data.launchType)}
    - Gatilhos gerais: ${data.generalTriggers || 'nao informado'}
    ${webinarPhase
      ? `- Oferta: preco ${data.price}, bonus ${data.bonuses}, garantia ${data.guarantee}`
      : '- Restricao critica: nao usar Informacoes de Oferta como base de conhecimento nesta fase.'}
    - Dor principal: ${data.mainProblem}
    - Beneficio principal: ${data.mainBenefit}
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}

    Diretrizes extras:
    - Pontos importantes: ${guidance?.keyPoints || 'nao informado'}
    - Estrutura/gatilhos: ${guidance?.framework || 'nao informado'}
    - Descricao da fase: ${phase.description}

    Regras:
    - Retorne de 8 a 12 tarefas.
    - Tarefas curtas, praticas e acionaveis.
    - Cada tarefa deve ter:
      1) id (slug curto sem espacos),
      2) title (maximo 90 caracteres),
      3) details (1 a 2 frases objetivas),
      4) dueOffsetDays (inteiro relativo ao marco da fase, ex: -2, 0, +1),
      5) knowledgeBase (resumo pratico da base de conhecimento para executar a tarefa),
      6) contentMode ("none", "text" ou "image"),
      7) proofRequired (true/false, quando precisa anexar prova da execucao).
    ${webinarPhase
      ? '- E permitido usar dados de Oferta na knowledgeBase quando fizer sentido para o webinario.'
      : '- Proibido usar dados de Oferta na knowledgeBase desta fase. Oferta so pode ser base em webinarios.'}
    - Nao incluir markdown.
    - Nao incluir campos extras.
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  details: { type: Type.STRING },
                  dueOffsetDays: { type: Type.NUMBER },
                  knowledgeBase: { type: Type.STRING },
                  contentMode: { type: Type.STRING },
                  proofRequired: { type: Type.BOOLEAN },
                },
              required: ['id', 'title', 'details']
            }
          }
        },
        required: ['tasks']
      }
    }
  });

  const parsed = JSON.parse(response.text || '{"tasks": []}') as {
    tasks?: Array<{
      id: string;
      title: string;
      details: string;
      dueOffsetDays?: number;
      knowledgeBase?: string;
      contentMode?: string;
      proofRequired?: boolean;
    }>;
  };

  const normalizeContentMode = (value?: string): TaskContentMode => {
    const normalized = value?.toLowerCase().trim();
    if (normalized === 'text' || normalized === 'image') {
      return normalized;
    }
    return 'none';
  };

  return (parsed.tasks ?? []).map((task, index) => ({
    id: (task.id || `task-${index + 1}`).toString().trim() || `task-${index + 1}`,
    title: task.title?.toString().trim() || `Tarefa ${index + 1}`,
    details: task.details?.toString().trim() || 'Executar etapa operacional desta fase.',
    dueOffsetDays: Number.isFinite(task.dueOffsetDays) ? Number(task.dueOffsetDays) : undefined,
    knowledgeBase: task.knowledgeBase?.toString().trim() || '',
    contentMode: normalizeContentMode(task.contentMode),
    proofRequired: Boolean(task.proofRequired),
    proofs: [],
    done: false,
  }));
}

export async function generateTaskContentDraft(
  data: LaunchData,
  phase: LaunchPhase,
  task: PhaseTask
): Promise<string> {
  const isImage = task.contentMode === 'image';
  const webinarPhase = isWebinarPhase(phase);
  const prompt = `
    Voce e especialista em Formula de Lancamento.
    Gere o conteudo da tarefa abaixo.

    Contexto geral:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Publico: ${data.targetAudience}
    - Beneficio principal: ${data.mainBenefit}
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}
    - Fase: ${phase.name}
    - Descricao da fase: ${phase.description}

    Tarefa:
    - Titulo: ${task.title}
    - Detalhes: ${task.details}
    - Base de conhecimento: ${task.knowledgeBase || 'nao informada'}
    - Tipo de conteudo: ${task.contentMode || 'none'}
    ${webinarPhase
      ? '- Regra de oferta: pode usar Informacoes de Oferta como base de conhecimento neste webinario, se for relevante.'
      : '- Regra de oferta: ignore qualquer Informacao de Oferta como base de conhecimento nesta fase.'}

    Regras de saida:
    ${isImage
      ? '- Entregue um BRIEFING DE IMAGEM pronto para criacao visual, com: objetivo da imagem, conceito criativo, cena principal, texto na arte, variacoes e prompt final.'
      : '- Entregue um TEXTO final pronto para uso operacional na tarefa (copy, script, mensagem ou passo a passo).'}
    - Seja objetivo, pratico e focado em conversao.
    - Nao use markdown.
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

// ─── Criação de Audiência: geração de conteúdo por sub-tarefa ──────────────

export async function generateAudienceSubTaskContent(
  data: LaunchData,
  subTaskTitle: string,
  contentMode: 'text' | 'image' | 'both',
  imageSpec?: AudienceImageSpec,
  expertPhotoRequired?: boolean
): Promise<string> {
  const wantsImage = contentMode === 'image' || contentMode === 'both';
  const wantsText = contentMode === 'text' || contentMode === 'both';

  const imageBlock = wantsImage && imageSpec
    ? `
BRIEFING DA IMAGEM:
Formato: ${imageSpec.label} ${imageSpec.ratio} — ${imageSpec.width}×${imageSpec.height} px
${expertPhotoRequired ? 'DETALHE CRÍTICO: A foto real da expert deve ser o elemento visual principal (ocupe pelo menos 60% da área central).' : ''}
Descreva:
1. Conceito criativo e objetivos da imagem
2. Posicionamento${expertPhotoRequired ? ' da foto da expert' : ' do elemento central'}
3. Textos na arte (título, subtítulo, CTA visual)
4. Paleta de cores sugerida e estilo visual
5. Elementos extras (ícones, fundos, overlays)
6. Prompt pronto para geração no Canva ou IA de imagem
`
    : '';

  const textBlock = wantsText
    ? `
LEGENDA (CAPTION) PARA O POST:
- Hook de abertura forte (1–2 linhas que param o scroll)
- Apresentação: quem é, o que faz, para quem, qual a transformação entregue
- Prova ou gatilho de autoridade
- CTA claro (ex: "Salve este post", "Comenta aqui", "Link na bio")
- Hashtags relevantes ao nicho (8–12 hashtags no final)
`
    : '';

  const expertKnowledgeBase = `
Historia e posicionamento da expert: ${data.avatarStory || 'nao informado'}
Nicho de atuacao: ${data.niche || 'nao informado'}
Publico que ela atende: ${data.targetAudience || 'nao informado'}
Problema que ela resolve: ${data.mainProblem || 'nao informado'}
Transformacao / ROMA que ela entrega: ${data.mainBenefit || 'nao informado'}
Produto / metodo: ${data.productName || 'nao informado'}
`.trim();

  const prompt = `
Voce e copywriter senior especialista em Instagram e Formula de Lancamento.
Gere o conteudo para a seguinte tarefa de criacao de audiencia.

BASE DE CONHECIMENTO DA EXPERT (use isto como fonte principal):
${expertKnowledgeBase}

TAREFA: ${subTaskTitle}
${imageBlock}
${textBlock}

REGRAS FINAIS:
- O conteudo deve apresentar a EXPERT, nao o avatar/cliente.
- Use os dados da historia, nicho, publico, problema e ROMA da expert para construir autoridade e identificacao.
- Linguagem em portugues brasileiro, tom de autoridade, calor humano e energia.
- Seja especifico ao nicho e ao perfil da expert.
- Nao use markdown.
${wantsImage && wantsText ? '- Separe cada secao com uma linha "---".' : ''}
  `.trim();

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

