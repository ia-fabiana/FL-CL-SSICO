import { LeadCapturePrepDay, LeadCapturePrepTask } from './types';

const createTask = (
  id: string,
  title: string,
  options: Partial<LeadCapturePrepTask> = {}
): LeadCapturePrepTask => ({
  id,
  title,
  done: false,
  contentMode: 'text',
  ...options,
});

export const LEAD_CAPTURE_PREP_WEEK = {
  title: 'Preparação para iniciar a captação de leads',
  rangeLabel: '16 a 22/03',
  focus: 'Organize tráfego, criativos e conteúdos de aquecimento antes da abertura da captação.',
  reminder:
    'Mantenha pelo menos 4 reels por semana alinhados à ROMA e aos temas do avatar para chegar na captação com consistência.',
};

export const DEFAULT_LEAD_CAPTURE_PREP_DAYS: LeadCapturePrepDay[] = [
  {
    id: 'lead-prep-2026-03-17',
    date: '2026-03-17',
    label: '17/03 - Terça-feira',
    blocks: [
      {
        id: 'lead-prep-class-trafego',
        title: 'Aula do dia',
        tasks: [
          createTask('lead-prep-watch-trafego', 'Assistir à aula de Configurações Iniciais de Tráfego', {
            promptHint:
              'Entregue um resumo prático da aula, os pontos de configuração que precisam ficar prontos hoje e um checklist final de validação.',
          }),
        ],
      },
      {
        id: 'lead-prep-trafego-setup',
        title: 'Configurações iniciais de tráfego',
        description: 'Monte a base técnica antes de criar campanhas na Meta.',
        tasks: [
          createTask('lead-prep-facebook-page', 'Criar uma página profissional vinculada ao perfil pessoal', {
            promptHint:
              'Explique a configuração mínima da página, informações que não podem faltar e um checklist de revisão final.',
          }),
          createTask('lead-prep-fanpage-instagram', 'Ligar a Fanpage ao perfil do Instagram do projeto', {
            promptHint:
              'Entregue o passo a passo de conexão, as permissões necessárias e como validar se o vínculo ficou correto.',
          }),
          createTask('lead-prep-bm-meta', 'Criar a BM (Gerenciador de Negócios) na Meta', {
            promptHint:
              'Monte um passo a passo simples para criar a BM, organizar os acessos e evitar erros de permissão.',
          }),
          createTask('lead-prep-ad-account', 'Criar a Conta de Anúncios', {
            promptHint:
              'Descreva a sequência para criar a conta, configurar moeda/fuso e confirmar que ela está pronta para uso.',
          }),
        ],
      },
    ],
  },
  {
    id: 'lead-prep-2026-03-18',
    date: '2026-03-18',
    label: '18/03 - Quarta-feira',
    blocks: [
      {
        id: 'lead-prep-class-criativos',
        title: 'Aula do dia',
        tasks: [
          createTask('lead-prep-watch-criativos', 'Assistir à aula de Criativos', {
            promptHint:
              'Monte um resumo com os principais aprendizados da aula e transforme isso em um plano de execução para hoje.',
          }),
        ],
      },
      {
        id: 'lead-prep-criativos',
        title: 'Criativos',
        description: 'Estruture o primeiro lote de criativos que será usado na captação.',
        tasks: [
          createTask('lead-prep-ideas', 'Listar pelo menos 5 estilos de criativos', {
            promptHint:
              'Sugira formatos de criativo, gancho principal, objetivo de cada estilo e como conectar cada um com a promessa do produto.',
          }),
          createTask('lead-prep-avatar-fit', 'Adaptar os criativos para conectar com o avatar', {
            promptHint:
              'Entregue um guia para ajustar linguagem, dores, desejos e objeções do avatar em cada criativo.',
          }),
          createTask('lead-prep-mapa-criativos', 'Definir no Mapa de Criativos 2.0 o estilo de cada um dos 5 criativos', {
            promptHint:
              'Crie uma estrutura de preenchimento do mapa com colunas, decisões e critérios para cada criativo.',
          }),
          createTask('lead-prep-record-edit', 'Gravar e editar os 5 criativos estruturados nas etapas anteriores', {
            promptHint:
              'Monte um plano de gravação em lote, organização de takes, roteiro mínimo e checklist de edição.',
          }),
        ],
      },
    ],
  },
  {
    id: 'lead-prep-2026-03-19',
    date: '2026-03-19',
    label: '19/03 - Quinta-feira',
    blocks: [
      {
        id: 'lead-prep-class-campaign',
        title: 'Aula do dia',
        tasks: [
          createTask('lead-prep-watch-campaign', 'Assistir à aula de Criação de Campanha de Captação', {
            promptHint:
              'Entregue um resumo operacional da aula e destaque o que precisa ser configurado antes de subir a campanha.',
          }),
        ],
      },
      {
        id: 'lead-prep-campaign',
        title: 'Criação da campanha de captação',
        description: 'Transforme o planejamento em configuração de campanha pronta para subir.',
        tasks: [
          createTask('lead-prep-investment-plan', 'Definir o planejamento de investimento e registrar no Launch Drive', {
            promptHint:
              'Entregue um modelo de planejamento com objetivo, verba total, verba diária, período e checkpoints de acompanhamento.',
          }),
          createTask('lead-prep-daily-goals', 'Planejar meta diária de leads e orçamento diário usando a planilha de tráfego', {
            promptHint:
              'Monte uma conta simples para transformar meta total em meta diária e orçamento diário, com exemplo.',
          }),
          createTask('lead-prep-meta-campaign', 'Configurar a campanha de captação de leads na Meta', {
            promptHint:
              'Descreva campanha, conjunto e anúncio com foco em geração de leads, incluindo eventos e validações principais.',
          }),
          createTask('lead-prep-domain-check', 'Verificar o domínio do Facebook', {
            promptHint:
              'Crie um checklist rápido para validar domínio, pixel/eventos e possíveis travas antes da publicação.',
          }),
          createTask('lead-prep-audiences', 'Criar público de Envolvimento de 30, 60, 90, 180 e 365 dias', {
            promptHint:
              'Entregue um passo a passo para configurar esses públicos, nomear corretamente e usar depois no remarketing.',
          }),
          createTask('lead-prep-launch-campaign', 'Criar a campanha de captação', {
            promptHint:
              'Gere um plano final de subida com estrutura, nomenclatura e conferência de setup antes de publicar.',
          }),
          createTask(
            'lead-prep-adsets',
            'Criar conjuntos de anúncios de remarketing para página de inscrição, envolvimento, lookalikes e interesses',
            {
              promptHint:
                'Explique como separar esses conjuntos, quando usar cada público e quais exclusões/mínimos checar.',
            }
          ),
          createTask(
            'lead-prep-ads',
            'Subir de 3 a 4 anúncios iniciais com criativos, texto principal, título e CTA',
            {
              promptHint:
                'Entregue um checklist para montar os anúncios iniciais e revisar copy, criativo, título e CTA antes de ativar.',
            }
          ),
          createTask('lead-prep-schedule', 'Programar a campanha para começar no dia 26/03', {
            promptHint:
              'Descreva como revisar datas, horário de início e checagens finais antes da campanha entrar no ar.',
          }),
        ],
      },
    ],
  },
  {
    id: 'lead-prep-2026-03-20',
    date: '2026-03-20',
    label: '20/03 - Sexta-feira',
    blocks: [
      {
        id: 'lead-prep-class-aquecimento',
        title: 'Aula do dia',
        tasks: [
          createTask('lead-prep-watch-aquecimento', 'Assistir à aula de Planejamento de Conteúdo de Aquecimento', {
            promptHint:
              'Resuma a aula e transforme os pontos principais em um plano de publicação para o período de captação.',
          }),
        ],
      },
      {
        id: 'lead-prep-aquecimento',
        title: 'Planejamento de conteúdo de aquecimento',
        description: 'Organize os conteúdos que vão preparar a audiência durante a captação.',
        tasks: [
          createTask('lead-prep-10-temas', 'Definir 10 temas para os conteúdos de aquecimento', {
            promptHint:
              'Crie um mapa com 10 temas, objetivo de cada um, qual objeção quebra e em qual formato pode ser usado.',
          }),
          createTask('lead-prep-whatsapp-audios', 'Criar 10 áudios de WhatsApp para o período de captação', {
            promptHint:
              'Entregue uma sequência de 10 áudios com objetivo, tom e CTA para aquecimento da base.',
          }),
          createTask('lead-prep-reels', 'Criar a estrutura de 10 reels a partir dos temas definidos', {
            promptHint:
              'Monte uma estrutura prática para 10 reels, incluindo gancho, desenvolvimento, CTA e observações de gravação.',
          }),
          createTask('lead-prep-lives-lines', 'Definir as linhas editoriais do aquecimento', {
            notes: 'Considere aula de aquecimento, perguntas e respostas e entrevista.',
            promptHint:
              'Explique como combinar aula, perguntas e respostas e entrevista ao longo do aquecimento.',
          }),
          createTask('lead-prep-lives-structure', 'Criar a estrutura das 3 lives a partir dos temas definidos', {
            promptHint:
              'Entregue o esqueleto de 3 lives com abertura, pauta, prova, CTA e ideia de transição entre blocos.',
          }),
          createTask('lead-prep-stories', 'Definir os assuntos dos stories a partir dos temas definidos', {
            promptHint:
              'Monte um plano de stories com assunto, interação e objetivo para acompanhar o aquecimento.',
          }),
        ],
      },
    ],
  },
];
