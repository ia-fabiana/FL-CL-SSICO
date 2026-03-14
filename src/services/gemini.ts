import { GoogleGenAI, Type } from "@google/genai";
import { LaunchData, LaunchPlan, LaunchPhase } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateLaunchOverview(data: LaunchData): Promise<LaunchPlan> {
  const prompt = `
    Atue como um especialista em Fórmula de Lançamento (Erico Rocha). 
    Crie uma VISÃO GERAL e ESTRUTURA de Lançamento Clássico para o seguinte produto:
    
    Produto: ${data.productName}
    Nicho: ${data.niche}
    Público-Alvo: ${data.targetAudience}
    Problema Principal: ${data.mainProblem}
    Benefício Principal: ${data.mainBenefit}
    
    DETALHES DA OFERTA:
    Preço de Venda: ${data.price}
    Preço de Âncora: ${data.anchorPrice || 'Não informado'}
    Bônus: ${data.bonuses}
    Garantia: ${data.guarantee}
    Formas de Pagamento: ${data.paymentMethods}
    Escassez/Urgência: ${data.scarcity}
    Outros Detalhes: ${data.offerDetails}
    
    Data de Início: ${data.launchDate}
    Modelo de CPL 1: ${data.launchModel === 'opportunity' ? 'A Oportunidade' : 'Jeito Certo vs Jeito Errado'}

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

  const response = await ai.models.generateContent({
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

export async function generatePhaseDetails(data: LaunchData, phase: LaunchPhase): Promise<NonNullable<LaunchPhase['scripts']>> {
  const prompt = `
    Atue como um especialista em Fórmula de Lançamento (Erico Rocha).
    Gere os ROTEIROS e CRIATIVOS detalhados para a fase "${phase.name}" do lançamento do produto "${data.productName}".
    
    Contexto do Produto:
    Público: ${data.targetAudience}
    Promessa: ${data.mainBenefit}
    Modelo: ${data.launchModel}
    
    OFERTA DETALHADA:
    Preço: ${data.price}
    Âncora: ${data.anchorPrice || 'Não informado'}
    Bônus: ${data.bonuses}
    Garantia: ${data.guarantee}
    Pagamento: ${data.paymentMethods}
    Escassez: ${data.scarcity}

    Descrição da Fase: ${phase.description}

    Para esta fase específica, gere:
    - Roteiros de vídeos (incluindo roteiro para HeyGen/Avatar IA se aplicável).
    - Modelos de emails persuasivos.
    - Sugestões de criativos (anúncios) com ideias visuais.
    - Posts para redes sociais.

    Use gatilhos mentais apropriados para esta fase.
    Retorne a resposta estritamente no formato JSON solicitado.
  `;

  const response = await ai.models.generateContent({
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
