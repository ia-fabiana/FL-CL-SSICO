import { ChecklistBlock, ChecklistBlockId, ChecklistData, ChecklistFields } from './types';

const BLOCK_DEFINITIONS: Array<{
  id: ChecklistBlockId;
  title: string;
  description: string;
}> = [
  { id: 'B0', title: 'Roma (Método DSA)', description: 'Destino claro, simples e atrativo validado' },
  { id: 'B1', title: 'Mapa de Gatilhos', description: 'Gatilhos aplicados com integridade em cada fase' },
  { id: 'B2', title: 'Linha do Tempo', description: 'Cronograma D-XX até D+14 aprovado' },
  { id: 'B3', title: 'CLI - Construção de Lista de Inscritos', description: 'Landing, automações e metas de CPL prontos' },
  { id: 'B4', title: 'AL - Aquecimento de Inscritos', description: 'Calendário 21 dias + blocos PEC/REP/Conteúdo' },
  { id: 'B5', title: 'Pré-Lançamento', description: 'CPL1-3, blog e notificações configurados' },
  { id: 'B6', title: 'Efeito Tsunami', description: 'Scripts e sequências T-72h a T-10min' },
  { id: 'B7', title: 'Carrinho + Efeito W', description: 'Plano D1-D5 e backup técnico' },
  { id: 'B8', title: 'Trial SaaS D0-D7', description: 'Onboarding e métricas de ativação' },
  { id: 'B9', title: 'Checklists Finais', description: 'Lead, CPLs, Tsunami, Carrinho e Pós' },
];

const FIELD_DEFAULTS: ChecklistFields = {
  romaFinal: '',
  avatar: '',
  precoAtual: '',
  precoFuturo: '',
  bonus: '',
  tecnicaPEC: '',
  metodoREP: '',
  conteudoCampeao: '',
  eventoEfeitoW: '',
  eventosAtivacaoTrial: '',
  canaisOficiais: '',
};

export const CHECKLIST_FIELD_METADATA: Array<{
  key: keyof ChecklistFields;
  label: string;
  placeholder: string;
}> = [
  { key: 'romaFinal', label: 'Roma final aprovada', placeholder: 'Ex: 90 dias de posts que vendem em 7 dias' },
  { key: 'avatar', label: 'Avatar/Nicho', placeholder: 'Ex: Social media para clínicas estéticas' },
  { key: 'precoAtual', label: 'Preço atual', placeholder: 'Ex: R$197/mês' },
  { key: 'precoFuturo', label: 'Preço após aumento', placeholder: 'Ex: R$247/mês' },
  { key: 'bonus', label: 'Bônus/condição especial', placeholder: 'Ex: Mentoria 30min + kit templates' },
  { key: 'tecnicaPEC', label: 'Técnica PEC', placeholder: 'Descrever Promessa • Evidência • Convite' },
  { key: 'metodoREP', label: 'Método REP', placeholder: 'Definir Roteiro • Execução • Prova' },
  { key: 'conteudoCampeao', label: 'Regra Conteúdo Campeão', placeholder: 'Critérios para post campeão' },
  { key: 'eventoEfeitoW', label: 'Evento do Efeito W', placeholder: 'Live demo, bônus surpresa, etc.' },
  { key: 'eventosAtivacaoTrial', label: 'Eventos de ativação trial', placeholder: 'Checklist de ações D0-D7' },
  { key: 'canaisOficiais', label: 'Canais oficiais de comunicação', placeholder: 'Email, WhatsApp, Telegram...' },
];

export function createInitialChecklist(): ChecklistData {
  const blocks: ChecklistBlock[] = BLOCK_DEFINITIONS.map(block => ({
    ...block,
    status: 'pending',
  }));

  return {
    blocks,
    fields: { ...FIELD_DEFAULTS },
  };
}

export function mergeChecklist(base?: ChecklistData | null): ChecklistData {
  if (!base) {
    return createInitialChecklist();
  }

  return {
    blocks: BLOCK_DEFINITIONS.map(definition => {
      const existing = base.blocks.find(block => block.id === definition.id);
      return existing ? { ...definition, ...existing } : { ...definition, status: 'pending' };
    }),
    fields: { ...FIELD_DEFAULTS, ...base.fields },
  };
}
