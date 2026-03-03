import { GoogleGenAI, Type } from "@google/genai";
import { GuidedFieldKey, getFieldPrompt, getLaunchDataSnapshot } from "../guidance";
import { GuidanceEntry, LaunchData, LaunchPlan, LaunchPhase, PhaseTask } from "../types";
import { DEFAULT_SCRIPT_DURATION_MINUTES, ESTIMATED_WORDS_PER_MINUTE } from "../constants";
const launchModelLabel = (model: LaunchData['launchModel']): string => {
  return model === 'opportunity'
    ? 'Oportunidade / Oportunidade Amplificada'
    : 'Jeito Errado vs Jeito Certo';
};

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
  const prompt = `
    Atue como um especialista em Fórmula de Lançamento (Erico Rocha). 
    Crie uma VISÃO GERAL e ESTRUTURA de Lançamento Clássico para o seguinte produto:
    
    Produto: ${data.productName}
    Nicho: ${data.niche}
    Público-Alvo: ${data.targetAudience}
    Nome interno do Avatar: ${data.avatarName}
    Problema Principal: ${data.mainProblem}
    Benefício Principal: ${data.mainBenefit}
    História Atual do Avatar (informada pelo estrategista): ${data.avatarStory}
    Dores e sintomas mapeados: ${data.avatarPainPoints}
    Objeções ou crenças limitantes: ${data.avatarObjections}
    Estado desejado / visão de futuro: ${data.avatarDesiredState}
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

    O plano deve conter:
    1. História do Avatar: Uma narrativa detalhada sobre a jornada do cliente ideal.
    2. Estratégia de Redes Sociais: Como se posicionar no Instagram/YouTube.
    3. Explicação do Modelo: Por que usar o modelo "${data.launchModel}".
    4. SNA (Sistema de Notificação de Audiência): Estratégia de grupos de WhatsApp e Telegram.
    5. Mapa de Entregáveis (Insider): Lista de tudo que precisa ser feito.
    6. Estrutura de Fases (Apenas nomes e descrições curtas):
       - PPL (Pré-Pré-Lançamento)
       - PL (Pré-Lançamento): CPL 1, CPL 2, CPL 3
       - L (Lançamento): Abertura do carrinho e fechamento.

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
  const estimatedWordCount = Math.round(durationMinutes * ESTIMATED_WORDS_PER_MINUTE);
  const prompt = `
    Você é copywriter sênior da Fórmula de Lançamento.
    Escreva UM ÚNICO ROTEIRO LONGO para a fase "${phase.name}" do produto "${data.productName}".

    Objetivo: produzir o texto completo que será lido em uma live (tom de conversa guiada, ritmo natural, transições claras).
    Não crie listas de entregáveis, emails, anúncios ou posts isolados. Gera um único texto contínuo.

    Contexto:
    - Público: ${data.targetAudience}
    - Avatar: ${data.avatarName}
    - Promessa: ${data.mainBenefit}
    - Modelo de CPL 1: ${launchModelLabel(data.launchModel)}
    - Dores prioritárias: ${data.avatarPainPoints}
    - Objeções declaradas: ${data.avatarObjections}
    - Estado desejado: ${data.avatarDesiredState}
    - Demonstração do CPL3: ${data.cplThreeSolution}
    - Oferta: ${data.price} (âncora ${data.anchorPrice || 'não informada'}), bônus ${data.bonuses}, garantia ${data.guarantee}, pagamento ${data.paymentMethods}, escassez ${data.scarcity}

    Diretrizes personalizadas do estrategista para esta fase:
    - Pontos essenciais: ${guidance?.keyPoints || 'não informado'}
    - Estrutura / gatilhos: ${guidance?.framework || 'não informado'}

    Descrição oficial da fase: ${phase.description}

    Tempo orientado:
    - Produza um roteiro que preencha cerca de ${durationMinutes} minutos de apresentação ao vivo.
    - Utilize esse tempo para conduzir a audiência com fluidez, considerando um ritmo aproximado de ${ESTIMATED_WORDS_PER_MINUTE} palavras por minuto (aprox. ${estimatedWordCount} palavras no total).

    Formato do resultado:
    - Texto único, sem tópicos ou marcadores.
    - Inclua aberturas, storytelling, quebras de padrão, prova, oferta e CTA seguindo a estrutura indicada.
    - Utilize subtítulos curtos SOMENTE se a própria estrutura exigir (ex.: "Bloco 1 - Quebra de padrão"), caso contrário mantenha parágrafos.
    - Linguagem em português brasileiro, voz consultiva e energia de live.
    - Sempre que citar diretamente os "Pontos essenciais" ou a "Estrutura / gatilhos" fornecidos, envolva esse trecho com <span style="color:#2563eb;font-weight:600">…</span> para destacá-lo em azul.
    - Após concluir o roteiro, adicione um bloco intitulado "## Gatilhos utilizados" contendo uma lista dos gatilhos realmente aplicados. Cada gatilho deve estar dentro de <span style="color:#7c3aed;font-weight:600">Nome do gatilho</span> seguido de uma breve explicação.
    - Distribua o conteúdo para ocupar os ${durationMinutes} minutos solicitados, evitando acelerar demais o ritmo ou encurtar blocos importantes.
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() ?? '';
}

export async function generateGuidedFieldCopy(
  field: GuidedFieldKey,
  data: LaunchData,
  guidance?: GuidanceEntry
): Promise<string> {
  const descriptor = getFieldPrompt(field);
  const context = getLaunchDataSnapshot(data);
  const prompt = `
    Você é uma estrategista sênior da Fórmula de Lançamento.
    Com base nos dados do briefing abaixo, reescreva o campo "${field}".

    Objetivo do campo: ${descriptor}

    Pontos importantes informados:
    ${guidance?.keyPoints || 'Não fornecido'}

    Estrutura, gatilhos ou frameworks desejados:
    ${guidance?.framework || 'Não fornecido'}

    Dados do diagnóstico:
    ${JSON.stringify(context, null, 2)}

    Gere um texto único, direto e pronto para ser usado no campo alvo. Use tom consultivo e evite repetições.
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
  const prompt = `
    Voce e especialista em Formula de Lancamento.
    Crie um checklist operacional para a fase "${phase.name}".

    Contexto:
    - Produto: ${data.productName}
    - Nicho: ${data.niche}
    - Publico: ${data.targetAudience}
    - Data oficial de lancamento: ${data.launchDate || 'nao informada'}
    - Modelo: ${launchModelLabel(data.launchModel)}
    - Oferta: preco ${data.price}, bonus ${data.bonuses}, garantia ${data.guarantee}
    - Dor principal: ${data.mainProblem}
    - Beneficio principal: ${data.mainBenefit}
    - Objeções: ${data.avatarObjections}

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
      4) dueOffsetDays (inteiro relativo ao marco da fase, ex: -2, 0, +1).
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
    tasks?: Array<{ id: string; title: string; details: string; dueOffsetDays?: number }>;
  };

  return (parsed.tasks ?? []).map((task, index) => ({
    id: (task.id || `task-${index + 1}`).toString().trim() || `task-${index + 1}`,
    title: task.title?.toString().trim() || `Tarefa ${index + 1}`,
    details: task.details?.toString().trim() || 'Executar etapa operacional desta fase.',
    dueOffsetDays: Number.isFinite(task.dueOffsetDays) ? Number(task.dueOffsetDays) : undefined,
    done: false,
  }));
}
