import { GoogleGenAI, Type } from "@google/genai";
import { GuidedFieldKey, getFieldPrompt, getLaunchDataSnapshot } from "../guidance";
import { GuidanceEntry, LaunchData, LaunchPlan, LaunchPhase } from "../types";
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
  guidance?: GuidanceEntry
): Promise<NonNullable<LaunchPhase['scripts']>> {
  const prompt = `
    Atue como um especialista em Fórmula de Lançamento (Erico Rocha).
    Gere os ROTEIROS e CRIATIVOS detalhados para a fase "${phase.name}" do lançamento do produto "${data.productName}".
    
    Contexto do Produto:
    Público: ${data.targetAudience}
    Avatar (apelido interno): ${data.avatarName}
    Promessa: ${data.mainBenefit}
    Modelo: ${launchModelLabel(data.launchModel)}
    Dores prioritárias: ${data.avatarPainPoints}
    Objeções declaradas: ${data.avatarObjections}
    Visão de futuro desejada: ${data.avatarDesiredState}
    Diretriz para o CPL 3 / solução âncora: ${data.cplThreeSolution}
    
    OFERTA DETALHADA:
    Preço: ${data.price}
    Âncora: ${data.anchorPrice || 'Não informado'}
    Bônus: ${data.bonuses}
    Garantia: ${data.guarantee}
    Pagamento: ${data.paymentMethods}
    Escassez: ${data.scarcity}

    Descrição da Fase: ${phase.description}

    Instruções personalizadas do estrategista:
    Pontos importantes: ${guidance?.keyPoints || 'Não informado'}
    Estrutura/Gatilhos: ${guidance?.framework || 'Não informado'}

    Para esta fase específica, gere:
    - Roteiros de vídeos (incluindo roteiro para HeyGen/Avatar IA se aplicável).
    - Modelos de emails persuasivos.
    - Sugestões de criativos (anúncios) com ideias visuais.
    - Posts para redes sociais.

    Use gatilhos mentais apropriados para esta fase.
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
          scripts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['video', 'email', 'ad', 'social', 'heygen'] }
              },
              required: ['title', 'content', 'type']
            }
          }
        },
        required: ['scripts']
      }
    }
  });

  const result = JSON.parse(response.text || '{"scripts": []}');
  return result.scripts;
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
