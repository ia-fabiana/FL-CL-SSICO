import { GoogleGenAI, Type } from "@google/genai";
import { GuidedFieldKey, getFieldPrompt, getLaunchDataSnapshot } from "../guidance";
import { AudienceImageSpec, GuidanceEntry, LaunchData, LaunchPlan, LaunchPhase, LeadCapturePrepTask, PhaseTask, TaskContentMode } from "../types";
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
    - Não entregue uma história genérica: preserve nomes, marcos, dores, conquistas, causa e transformação sempre que forem informados.
    - Se algum ponto importante e a estrutura parecerem conflitantes, priorize conciliar os dois sem omitir fatos.
    - Entregue em markdown.
    - Todo gatilho mental usado no texto deve estar em **negrito** (isso vira rosa na interface).
    - Todo trecho vindo da base de conhecimento deve estar em \`codigo inline\` (isso vira azul na interface).
    - Se um trecho combinar gatilho e base, separe em duas partes proximas para manter as duas marcacoes.
    - Ao final, inclua "## Mapa de marcacoes" com:
      - "### Gatilhos mentais (rosa)" listando os gatilhos usados.
      - "### Base de conhecimento (azul)" listando os pontos da base realmente utilizados.
    `;
  }

  return `
  Regras obrigatorias:
  - Incorpore todos os pontos importantes enviados pelo estrategista.
  - Siga a estrutura/gatilhos sempre que ela for fornecida.
  - Não devolva texto genérico nem omita itens explícitos do briefing.
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
    Atue como um especialista em Fórmula de Lançamento (Erico Rocha).
    Crie uma VISÃO GERAL e ESTRUTURA de ${launchTypeLabel(data.launchType)} para o seguinte produto:
    
    Produto: ${data.productName}
    Nicho: ${data.niche}
    Público-Alvo: ${data.targetAudience}
    Nome interno do Avatar: ${data.avatarName}
    Problema Principal: ${data.mainProblem}
    Benefício Principal: ${data.mainBenefit}
    História Atual do Avatar (informada pelo estrategista): ${data.avatarStory}
    Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}
    Sinalizado para o CPL 3 (demonstração/solução): ${data.cplThreeSolution}
    
    DETALHES DA OFERTA:
    Preço de Venda: ${data.price}
    Preço de Âncora: ${data.anchorPrice || 'Não informado'}
    Bônus: ${data.bonuses}
    Garantia: ${data.guarantee}
    Formas de Pagamento: ${data.paymentMethods}
    Escassez/Urgência: ${data.scarcity}
    Outros Detalhes: ${data.offerDetails}
    
    Data de Início: ${data.launchDate}
    Modelo de CPL 1: ${launchModelLabel(data.launchModel)}
    Tipo de Lançamento: ${launchTypeLabel(data.launchType)}
    Gatilhos gerais: ${data.generalTriggers || 'não informado'}

    O plano deve conter:
    1. História do Avatar: Uma narrativa detalhada sobre a jornada do cliente ideal.
    2. Estratégia de Redes Sociais: Como se posicionar no Instagram/YouTube.
    3. Explicação do Modelo: Por que usar o modelo "${data.launchModel}".
    4. SNA (Sistema de Notificação de Audiência): Estratégia de grupos de WhatsApp e Telegram.
    5. Mapa de Entregáveis (Insider): Lista de tudo que precisa ser feito.
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
    Você é copywriter sênior da Fórmula de Lançamento.
    Escreva UM ÚNICO ROTEIRO LONGO para a fase "${phase.name}" do produto "${data.productName}".

    Objetivo: produzir o texto completo que será lido em uma live (tom de conversa guiada, ritmo natural, transições claras).
    Não crie listas de entregáveis, emails, anúncios ou posts isolados. Gere um único texto contínuo.

    Contexto:
    - Público: ${data.targetAudience}
    - Avatar: ${data.avatarName}
    - Promessa: ${data.mainBenefit}
    - Modelo de CPL 1: ${launchModelLabel(data.launchModel)}
    - Tipo de lançamento: ${launchTypeLabel(data.launchType)}
    - Gatilhos gerais: ${data.generalTriggers || 'não informado'}
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}
    - Demonstração do CPL3: ${data.cplThreeSolution}
    ${webinarPhase
      ? `- Oferta: ${data.price} (âncora ${data.anchorPrice || 'não informada'}), bônus ${data.bonuses}, garantia ${data.guarantee}, pagamento ${data.paymentMethods}, escassez ${data.scarcity}`
      : '- Restrição crítica: não use Informações de Oferta como base de conhecimento nesta fase. Isso só é permitido em webinários.'}

    Diretrizes personalizadas do estrategista para esta fase:
    - Pontos essenciais: ${guidance?.keyPoints || 'não informado'}
    - Estrutura / gatilhos: ${guidance?.framework || 'não informado'}

    Descrição oficial da fase: ${phase.description}

    Tempo orientado:
    - Produza um roteiro que preencha cerca de ${durationMinutes} minutos de apresentação ao vivo.
    - Utilize esse tempo para conduzir a audiência com fluidez, considerando um ritmo aproximado de ${ESTIMATED_WORDS_PER_MINUTE} palavras por minuto (aprox. ${estimatedWordCount} palavras no total).

    Formato do resultado:
    - Texto único, sem tópicos ou marcadores.
    ${webinarPhase
      ? '- Inclua aberturas, storytelling, quebras de padrão, prova, oferta e CTA seguindo a estrutura indicada.'
      : '- Inclua aberturas, storytelling, quebras de padrão, prova e CTA seguindo a estrutura indicada (sem usar oferta como base de conhecimento).'}
    - Utilize subtítulos curtos SOMENTE se a própria estrutura exigir (ex.: "Bloco 1 - Quebra de padrão"), caso contrário mantenha parágrafos.
    - Linguagem em português brasileiro, voz consultiva e energia de live.
    - Sempre que citar diretamente os "Pontos essenciais" ou a "Estrutura / gatilhos" fornecidos, envolva esse trecho com <span style="color:#2563eb;font-weight:600">...</span> para destacá-lo em azul.
    - No corpo do roteiro, destaque em rosa cada palavra ou frase que represente gatilho mental usando <span style="color:#ec4899;font-weight:700">...</span>.
    - Após concluir o roteiro, adicione um bloco intitulado "## Gatilhos utilizados" contendo uma lista dos gatilhos realmente aplicados. Cada gatilho deve estar dentro de <span style="color:#ec4899;font-weight:700">Nome do gatilho</span> seguido de uma breve explicação.
    - Distribua o conteúdo para ocupar os ${durationMinutes} minutos solicitados, evitando acelerar demais o ritmo ou encurtar blocos importantes.
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const output = response.text?.trim() ?? '';
  if (!output) {
    throw new Error('A IA não retornou texto para este processamento.');
  }

  return output;
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
    Você é copywriter sênior da Fórmula de Lançamento.
    Escreva UM ÚNICO ROTEIRO LONGO para um conteúdo RAIZ alinhado à ROMA do projeto abaixo.

    Contexto central:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Público: ${data.targetAudience}
    - Avatar: ${data.avatarName}
    - Problema principal: ${data.mainProblem}
    - ROMA / Promessa central: ${data.mainBenefit}
    - Modelo de lançamento: ${launchTypeLabel(data.launchType)}
    - Modelo narrativo: ${launchModelLabel(data.launchModel)}
    - Gatilhos gerais: ${data.generalTriggers || 'não informado'}
    - Restrição crítica: Informações de Oferta não podem ser usadas como base de conhecimento neste roteiro. Isso só é permitido em webinários.
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}

    Linhas editoriais escolhidas:
    ${input.editorialLines.map(line => `- ${line}`).join('\n')}

    Temas e perguntas selecionadas:
    ${selectedThemesBlock}

    Controle da solicitação:
    - Token único da geração: ${input.requestToken || 'não informado'}
    ${input.regenerationHint ? `- Instrução de nova versão: ${input.regenerationHint}` : ''}

    Regras obrigatórias:
    - O roteiro inteiro precisa reforçar e proteger a ROMA "${data.mainBenefit}".
    - Não se desvie da promessa central. Todo bloco deve servir para tornar a ROMA mais clara, desejável e crível.
    - Responda explicitamente as perguntas escolhidas pelo estrategista.
    - Use os temas escolhidos como eixo do conteúdo, sem perder coerência com o avatar.
    - Misture as linhas editoriais escolhidas apenas quando fizer sentido narrativo.
    - O roteiro deve seguir esta ordem:
      1. Introdução
      2. Contexto
      3. Benefícios
      4. Como
      5. Elementos complementares (somente se houver perguntas extras selecionadas)
      6. Fechamento com CTA coerente com a ROMA
    - Produza cerca de ${input.durationMinutes} minutos de apresentação ao vivo.
    - Considere aproximadamente ${ESTIMATED_WORDS_PER_MINUTE} palavras por minuto (aprox. ${estimatedWordCount} palavras no total).

    Formato do resultado:
    - Entregue em texto puro com estrutura markdown.
    - Use títulos como "# Roteiro do Raiz", "## Introdução", "## Contexto", "## Benefícios", "## Como", "## Elementos complementares", "## Fechamento".
    - Dentro de cada seção, escreva o roteiro em parágrafos prontos para leitura, não apenas bullets soltos.
    - Se usar bullets, use apenas para resumir perguntas escolhidas antes de desenvolver o texto.
    - Linguagem em português brasileiro, energia consultiva e ritmo de aula/live.
    - Marque em rosa todos os gatilhos mentais do texto usando markdown em negrito: **trecho de gatilho mental**.
    - Marque em azul os trechos que vierem da base de conhecimento usando markdown de codigo inline: \`trecho vindo da base\`.
    - Regra critica: nenhum gatilho mental pode aparecer sem ** **.
    - Regra crítica: nenhuma informação da base de conhecimento pode aparecer sem \` \`.
    - Se uma frase combinar gatilho mental e base de conhecimento, aplique ambas as marcações preservando legibilidade (priorize separar em dois trechos próximos quando necessário).
    - Revise o texto antes de finalizar e corrija qualquer trecho que esteja sem marcação obrigatória.
    - Considere como "base de conhecimento" qualquer informação derivada de:
      1. Informações da Expert · História
      2. Informações de Produto
      3. Informações de ROMA
      4. Informações de Avatar
      5. Informações da Solução
    - Regra crítica: Informações de Oferta não entram como base de conhecimento no roteiro do raiz (uso permitido somente em webinários).
    - Ao final, adicione a seção "## Mapa de marcações" com:
      - "### Gatilhos mentais (rosa)" listando os gatilhos realmente usados no roteiro.
      - "### Base de conhecimento (azul)" listando quais fontes da base foram utilizadas no texto.
    - Não use HTML para colorir, não use spans; use somente markdown com ** ** e \` \` para que a interface aplique as cores automaticamente.
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
    Você é copywriter sênior da Fórmula de Lançamento.
    Gere 5 headlines altamente atrativas e com forte efeito de curiosidade, com base no roteiro abaixo.

    Contexto:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Público: ${data.targetAudience}
    - Avatar: ${data.avatarName}
    - Problema principal: ${data.mainProblem}
    - ROMA / Promessa central: ${data.mainBenefit}

    Roteiro aprovado:
  ${scriptForPrompt}

    Regras obrigatorias:
    - Entregar EXATAMENTE 5 headlines.
    - Cada headline deve ser curta, clara e com gancho de curiosidade.
    - Evite clickbait vazio; manter coerencia com a promessa da ROMA.
    - Não repetir a mesma estrutura de frase nas 5 opções.
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
      - Não use JSON.
      - Não use texto extra.
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
  const expertPreliminaryContext = `
Nome da expert: ${data.avatarName || 'não informado'}
História atual da expert: ${data.avatarStory || 'não informado'}
Nicho: ${data.niche || 'não informado'}
Público-alvo: ${data.targetAudience || 'não informado'}
Problema principal: ${data.mainProblem || 'não informado'}
ROMA / Benefício principal: ${data.mainBenefit || 'não informado'}
Produto / método: ${data.productName || 'não informado'}
Instagram @: ${data.expertInstagramHandle || 'não informado'}
Instagram URL: ${data.expertInstagramUrl || 'não informado'}
Link principal da bio: ${data.expertLinkInBio || 'não informado'}
Foto de referência da expert (URL): ${data.expertPhotoReferenceUrl || 'não informado'}
Guia de roupa/visual: ${data.expertLookGuide || 'não informado'}
Imagem de referência da roupa (URL): ${data.expertLookReferenceUrl || 'não informado'}
Guia de ambiente/cenário: ${data.expertEnvironmentGuide || 'não informado'}
Imagem de referência do ambiente (URL): ${data.expertEnvironmentReferenceUrl || 'não informado'}
Direção artística: ${data.expertArtDirection || 'não informado'}
Base ampliada do avatar:
${avatarKnowledgeBase(data)}
  `.trim();

  const prompt = `
    Você é uma estrategista sênior da Fórmula de Lançamento.
    Com base nos dados do briefing abaixo, reescreva o campo "${field}".

    Objetivo do campo: ${descriptor}

    Pontos importantes informados:
    ${guidance?.keyPoints || 'Não fornecido'}

    Estrutura, gatilhos ou frameworks desejados:
    ${guidance?.framework || 'Não fornecido'}

    Base preliminar da expert e da audiência (obrigatória para este processamento):
    ${field === 'avatarStory' ? expertPreliminaryContext : 'não se aplica'}

    Dados do diagnóstico:
    ${JSON.stringify(context, null, 2)}

    ${getGuidedFieldInstruction(field)}

    Regras finais de execução:
    - Gere um texto único, direto e pronto para ser usado no campo alvo.
    - Use tom consultivo e evite repetições.
    - ${field === 'avatarStory'
      ? 'Para avatarStory, use markdown e mantenha os títulos de apoio mínimos (ex.: ## História).'
      : 'Não explique seu raciocínio, não use listas e não adicione observações fora do texto final.'}
    - ${hasKeyPoints || hasFramework
      ? 'Considere os pontos importantes e a estrutura/gatilhos como requisitos obrigatórios do resultado.'
      : 'Na ausência de guidance extra, baseie-se somente no briefing informado.'}
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
    Você é especialista em Fórmula de Lançamento.
    Crie um checklist operacional para a fase "${phase.name}".

    Contexto:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Público: ${data.targetAudience}
    - Data oficial de lançamento: ${data.launchDate || 'não informada'}
    - Modelo: ${launchModelLabel(data.launchModel)}
    - Tipo de lançamento: ${launchTypeLabel(data.launchType)}
    - Gatilhos gerais: ${data.generalTriggers || 'não informado'}
    ${webinarPhase
      ? `- Oferta: preço ${data.price}, bônus ${data.bonuses}, garantia ${data.guarantee}`
      : '- Restrição crítica: não usar Informações de Oferta como base de conhecimento nesta fase.'}
    - Dor principal: ${data.mainProblem}
    - Benefício principal: ${data.mainBenefit}
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}

    Diretrizes extras:
    - Pontos importantes: ${guidance?.keyPoints || 'não informado'}
    - Estrutura/gatilhos: ${guidance?.framework || 'não informado'}
    - Descrição da fase: ${phase.description}

    Regras:
    - Retorne de 8 a 12 tarefas.
    - Tarefas curtas, práticas e acionáveis.
    - Cada tarefa deve ter:
      1) id (slug curto sem espaços),
      2) title (máximo 90 caracteres),
      3) details (1 a 2 frases objetivas),
      4) dueOffsetDays (inteiro relativo ao marco da fase, ex: -2, 0, +1),
      5) knowledgeBase (resumo prático da base de conhecimento para executar a tarefa),
      6) contentMode ("none", "text" ou "image"),
      7) proofRequired (true/false, quando precisa anexar prova da execução).
    ${webinarPhase
      ? '- É permitido usar dados de Oferta na knowledgeBase quando fizer sentido para o webinário.'
      : '- Proibido usar dados de Oferta na knowledgeBase desta fase. Oferta só pode ser base em webinários.'}
    - Não incluir markdown.
    - Não incluir campos extras.
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
    Você é especialista em Fórmula de Lançamento.
    Gere o conteúdo da tarefa abaixo.

    Contexto geral:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Público: ${data.targetAudience}
    - Benefício principal: ${data.mainBenefit}
    - Base de conhecimento do avatar:
    ${avatarKnowledgeBase(data)}
    - Fase: ${phase.name}
    - Descrição da fase: ${phase.description}

    Tarefa:
    - Título: ${task.title}
    - Detalhes: ${task.details}
    - Base de conhecimento: ${task.knowledgeBase || 'não informada'}
    - Tipo de conteúdo: ${task.contentMode || 'none'}
    ${webinarPhase
      ? '- Regra de oferta: pode usar Informações de Oferta como base de conhecimento neste webinário, se for relevante.'
      : '- Regra de oferta: ignore qualquer Informação de Oferta como base de conhecimento nesta fase.'}

    Regras de saída:
    ${isImage
      ? '- Entregue um BRIEFING DE IMAGEM pronto para criação visual, com: objetivo da imagem, conceito criativo, cena principal, texto na arte, variações e prompt final.'
      : '- Entregue um TEXTO final pronto para uso operacional na tarefa (copy, script, mensagem ou passo a passo).'}
    - Seja objetivo, prático e focado em conversão.
    - Não use markdown.
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
  subTaskId: string,
  subTaskTitle: string,
  contentMode: 'text' | 'image' | 'both',
  imageSpec?: AudienceImageSpec,
  expertPhotoRequired?: boolean
): Promise<string> {
  const wantsImage = contentMode === 'image' || contentMode === 'both';
  const wantsText = contentMode === 'text' || contentMode === 'both';
  const isSpecificInstagramTask = subTaskId === 'ig-02' || subTaskId === 'ig-04';

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
    ? isSpecificInstagramTask
      ? `
LEGENDA (CAPTION) PARA O POST:
- Hook de abertura forte (1–2 linhas que param o scroll)
- Apresentação: quem é, o que faz, para quem, qual a transformação entregue
- Prova ou gatilho de autoridade
- CTA claro (ex: "Salve este post", "Comenta aqui", "Link na bio")
- Hashtags relevantes ao nicho (8–12 hashtags no final)
`
      : `
PLANO OPERACIONAL DA TAREFA:
- Diagnóstico rápido do item
- Passo a passo prático para executar hoje
- Modelo de texto/script pronto para usar (se aplicável)
- Checklist final de validação (o que precisa estar pronto)
`
    : '';

  const expertKnowledgeBase = `
Nome da expert: ${data.avatarName || 'não informado'}
História e posicionamento da expert: ${data.avatarStory || 'não informado'}
Nicho de atuação: ${data.niche || 'não informado'}
Público que ela atende: ${data.targetAudience || 'não informado'}
Problema que ela resolve: ${data.mainProblem || 'não informado'}
Transformação / ROMA que ela entrega: ${data.mainBenefit || 'não informado'}
Produto / método: ${data.productName || 'não informado'}
Instagram @: ${data.expertInstagramHandle || 'não informado'}
Instagram URL: ${data.expertInstagramUrl || 'não informado'}
Facebook URL: ${data.expertFacebookUrl || 'não informado'}
YouTube URL: ${data.expertYoutubeUrl || 'não informado'}
Link principal da bio: ${data.expertLinkInBio || 'não informado'}
Foto de referência da expert (URL): ${data.expertPhotoReferenceUrl || 'não informado'}
Guia de roupa/visual: ${data.expertLookGuide || 'não informado'}
Imagem de referência da roupa (URL): ${data.expertLookReferenceUrl || 'não informado'}
Guia de ambiente/cenário: ${data.expertEnvironmentGuide || 'não informado'}
Imagem de referência do ambiente (URL): ${data.expertEnvironmentReferenceUrl || 'não informado'}
Direção artística desejada: ${data.expertArtDirection || 'não informado'}
`.trim();

  const taskOutputRule = subTaskId === 'ig-02'
    ? `
TAREFA ESPECÍFICA (IG-02): revisar bio de Instagram.
Entregue:
1. Diagnóstico da bio atual (pontos fortes e lacunas)
2. Checklist objetivo: cargo, promessa, palavra-chave e link
3. 3 versões de bio prontas para copiar (curta, média e direta para conversão)
4. Sugestão final de CTA para stories e destaque fixo
5. Validação final das redes informadas para mencionar no perfil
`
    : subTaskId === 'ig-04'
    ? `
TAREFA ESPECÍFICA (IG-04): criar/atualizar post fixado apresentando o trabalho.
Entregue:
1. Estrutura do post fixado (headline, proposta, prova, CTA)
2. Legenda final pronta
3. Briefing visual alinhado ao formato solicitado e foto da expert
4. CTA com @ da expert e link principal da bio
`
    : '';

  const prompt = `
Você é copywriter sênior especialista em Instagram e Fórmula de Lançamento.
Gere o conteúdo para a seguinte tarefa de criação de audiência.

BASE DE CONHECIMENTO DA EXPERT (use isto como fonte principal):
${expertKnowledgeBase}

TAREFA: ${subTaskTitle}
${imageBlock}
${textBlock}
${taskOutputRule}

REGRAS FINAIS:
- O conteúdo deve apresentar a EXPERT, não o avatar/cliente.
- Use os dados da história, nicho, público, problema e ROMA da expert para construir autoridade e identificação.
- Em tarefas visuais, respeite prioritariamente foto de referência, roupa, ambiente e direção artística informados.
- Se houver imagem de referência de roupa/ambiente, priorize essa referência visual acima da descrição em texto.
- Linguagem em português brasileiro, tom de autoridade, calor humano e energia.
- Seja específico ao nicho e ao perfil da expert.
- Não use markdown.
${wantsImage && wantsText ? '- Separe cada seção com uma linha "---".' : ''}
  `.trim();

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

export async function generateLeadCaptureTaskContent(
  data: LaunchData,
  dayLabel: string,
  blockTitle: string,
  task: LeadCapturePrepTask
): Promise<string> {
  const prompt = `
Você é estrategista sênior de Fórmula de Lançamento com foco em captação de leads e operação.
Monte um plano de execução pronto para entregar a tarefa abaixo.

CONTEXTO DO PROJETO:
- Produto: ${data.productName || 'não informado'}
- Nicho: ${data.niche || 'não informado'}
- Público: ${data.targetAudience || 'não informado'}
- Problema principal: ${data.mainProblem || 'não informado'}
- ROMA / promessa principal: ${data.mainBenefit || 'não informado'}
- Data oficial do lançamento: ${data.launchDate || 'não informado'}
- Gatilhos gerais: ${data.generalTriggers || 'não informado'}

BASE DO AVATAR:
${avatarKnowledgeBase(data)}

CONTEXTO OPERACIONAL:
- Dia da semana de preparação: ${dayLabel}
- Bloco: ${blockTitle}
- Tarefa: ${task.title}
- Observações extras: ${task.notes || 'não informado'}
- Direção do estrategista: ${task.promptHint || 'não informado'}

FORMATO DE SAÍDA:
- Entregue em texto puro, sem markdown.
- Organize em blocos curtos com estes títulos:
OBJETIVO
PASSO A PASSO
MATERIAIS / DADOS NECESSÁRIOS
ENTREGA ESPERADA
CHECKLIST FINAL
- Se a tarefa pedir criativo, copy, público, campanha, reels, áudios, lives ou stories, inclua um modelo prático pronto para usar dentro do plano.
- Seja específico para o nicho e para a promessa do projeto.
- Não responda de forma genérica.
  `.trim();

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

