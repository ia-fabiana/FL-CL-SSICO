import React, { useEffect, useState } from 'react';
import { GuidanceEntry, GuidanceMap, LaunchData } from '../types';
import { GuidedFieldKey, guidanceKeyForField } from '../guidance';
import { Rocket, Target, Tag, Users, AlertCircle, Sparkles, Calendar, DollarSign, Check } from 'lucide-react';

const EMPTY_FORM: LaunchData = {
  avatarName: '',
  productName: '',
  niche: '',
  targetAudience: '',
  mainProblem: '',
  mainBenefit: '',
  avatarStory: '',
  avatarPainPoints: '',
  avatarObjections: '',
  avatarDesiredState: '',
  cplThreeSolution: '',
  price: '',
  anchorPrice: '',
  guarantee: '',
  bonuses: '',
  paymentMethods: '',
  scarcity: '',
  launchDate: '',
  offerDetails: '',
  launchModel: 'opportunity',
};

const buildFormData = (payload?: LaunchData | null): LaunchData => ({
  ...EMPTY_FORM,
  ...payload,
});

const FORM_SECTION_IDS = [
  'section-launch-date',
  'section-product-info',
  'section-expert-info',
  'section-avatar-info',
  'section-offer-info',
];

interface GuidancePanelProps {
  label: string;
  entry?: GuidanceEntry;
  saving?: boolean;
  processing?: boolean;
  onChange: (field: keyof GuidanceEntry, value: string) => void;
  onSave: () => void;
  onProcess: () => void;
}

function GuidancePanel({ label, entry, saving, processing, onChange, onSave, onProcess }: GuidancePanelProps) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 font-black text-xs uppercase tracking-[0.3em]">
          IA
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-indigo-400">Base de conhecimento</span>
          <p className="text-base font-black text-slate-900 leading-tight">{label}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">
        Estruture aqui os pontos que não podem faltar quando a IA escrever <span className="font-semibold text-slate-800">{label}</span>.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Pontos importantes</span>
          <textarea
            rows={3}
            value={entry?.keyPoints ?? ''}
            onChange={event => onChange('keyPoints', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Estrutura / Gatilhos</span>
          <textarea
            rows={3}
            value={entry?.framework ?? ''}
            onChange={event => onChange('framework', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.3em] text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar instruções'}
        </button>
        <button
          type="button"
          onClick={onProcess}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-[0.3em] text-white hover:bg-slate-800 disabled:opacity-60"
          disabled={processing}
        >
          {processing ? 'Processando...' : 'Processar'}
        </button>
      </div>
    </div>
  );
}

interface Props {
  onSubmit: (data: LaunchData) => Promise<void> | void;
  isLoading: boolean;
  initialData?: LaunchData | null;
  onAvatarStoryDraft?: (value: string) => void;
  activeSection: string;
  guidance: GuidanceMap;
  guidanceSaving: Record<string, boolean>;
  guidanceProcessing: Record<string, boolean>;
  onGuidanceChange: (key: string, field: keyof GuidanceEntry, value: string) => void;
  onSaveGuidance: (key: string) => void;
  onProcessGuidance: (key: string) => void;
}

export default function LaunchForm({
  onSubmit,
  isLoading,
  initialData,
  onAvatarStoryDraft,
  activeSection,
  guidance,
  guidanceSaving,
  guidanceProcessing,
  onGuidanceChange,
  onSaveGuidance,
  onProcessGuidance,
}: Props) {
  const [formData, setFormData] = useState<LaunchData>(buildFormData(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isSectionActive = (sectionId: string) => !activeSection || activeSection === sectionId;
  const hasVisibleSection = FORM_SECTION_IDS.some(isSectionActive);

  const baseFieldClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';
  const textareaTallClass = `${baseFieldClass} min-h-[170px] leading-relaxed`;
  const textareaMediumClass = `${baseFieldClass} min-h-[130px] leading-relaxed`;

  const renderGuidance = (field: GuidedFieldKey, label: string) => {
    const key = guidanceKeyForField(field);
    return (
      <GuidancePanel
        label={label}
        entry={guidance[key]}
        saving={guidanceSaving[key]}
        processing={guidanceProcessing[key]}
        onChange={(entryField, value) => onGuidanceChange(key, entryField, value)}
        onSave={() => onSaveGuidance(key)}
        onProcess={() => onProcessGuidance(key)}
      />
    );
  };

  useEffect(() => {
    const nextData = buildFormData(initialData);
    setFormData(nextData);
    onAvatarStoryDraft?.(nextData.avatarStory || '');
  }, [initialData, onAvatarStoryDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao enviar briefing', error);
      setSaveError('Não foi possível salvar seus dados. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'avatarStory') {
      onAvatarStoryDraft?.(value);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 bg-white p-10 rounded-3xl shadow-md border border-slate-100"
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
    >
      <div className="space-y-6">
        <div
          id="section-launch-date"
          className={`rounded-3xl border border-slate-200 p-8 space-y-8 ${!isSectionActive('section-launch-date') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" /> Data oficial do lançamento
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Anchor date · D0</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" /> Data do Lançamento
              </label>
              <input
                required
                type="date"
                name="launchDate"
                value={formData.launchDate}
                onChange={handleChange}
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" /> Modelo do CPL 1 (Âncora)
              </label>
              <select
                name="launchModel"
                value={formData.launchModel}
                onChange={handleChange}
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              >
                <option value="opportunity">Oportunidade / Oportunidade Amplificada</option>
                <option value="right_wrong">Jeito Errado vs Jeito Certo</option>
              </select>
            </div>
          </div>
        </div>

        <div
          id="section-product-info"
          className={`rounded-3xl border border-slate-200 p-8 space-y-8 ${!isSectionActive('section-product-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Rocket size={20} className="text-indigo-600" /> Mapa do Produto
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Contexto macro</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Rocket size={16} className="text-indigo-500" /> Nome do Produto
              </label>
              <input
                required
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="Ex: Método Venda Express"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Tag size={16} className="text-indigo-500" /> Nicho
              </label>
              <input
                required
                name="niche"
                value={formData.niche}
                onChange={handleChange}
                placeholder="Ex: Marketing Digital"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users size={16} className="text-indigo-500" /> Público-Alvo
              </label>
              <input
                required
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                placeholder="Ex: Mulheres de 25-40 anos"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <AlertCircle size={16} className="text-indigo-500" /> Problema Principal
                </label>
                <textarea
                  required
                  name="mainProblem"
                  value={formData.mainProblem}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Qual a dor principal que você resolve?"
                  className={textareaTallClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
              {renderGuidance('mainProblem', 'Problema Principal')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-500" /> Promessa Principal
                </label>
                <textarea
                  required
                  name="mainBenefit"
                  value={formData.mainBenefit}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Qual o grande benefício final?"
                  className={textareaTallClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
              {renderGuidance('mainBenefit', 'Promessa Principal')}
            </div>
          </div>
        </div>

        <div
          id="section-expert-info"
          className={`rounded-3xl border border-slate-200 p-8 space-y-8 ${!isSectionActive('section-expert-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-fuchsia-500" /> Informações da Expert · História
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Narrativa raiz</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users size={16} className="text-indigo-500" /> Nome interno do Avatar
              </label>
              <input
                required
                name="avatarName"
                value={formData.avatarName}
                onChange={handleChange}
                placeholder="Ex: Camila, a Social Media em trânsito"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Sparkles size={16} className="text-fuchsia-500" /> História do Avatar (realidade atual)
                </label>
                <textarea
                  required
                  name="avatarStory"
                  value={formData.avatarStory}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Quem é o avatar? Quais responsabilidades, conquistas e motivos que o levam a buscar sua solução?"
                  className={textareaTallClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
              {renderGuidance('avatarStory', 'História do Avatar')}
            </div>
          </div>
        </div>

        <div
          id="section-avatar-info"
          className={`rounded-3xl border border-slate-200 p-8 space-y-8 ${!isSectionActive('section-avatar-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" /> Diagnóstico do Avatar
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Dores + objeções</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" /> Dores e sintomas (liste 3-5)
                </label>
                <textarea
                  required
                  name="avatarPainPoints"
                  value={formData.avatarPainPoints}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Separe por quebras de linha: queda de leads, excesso de horas no operacional, falta de método..."
                  className={textareaTallClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
              {renderGuidance('avatarPainPoints', 'Dores e sintomas')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" /> Objeções/medos declarados
                </label>
                <textarea
                  required
                  name="avatarObjections"
                  value={formData.avatarObjections}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ex: 'Já tentei outro curso e não funcionou', 'Não tenho tempo', 'Meu público não paga caro'"
                  className={textareaTallClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
              {renderGuidance('avatarObjections', 'Objeções e medos')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Check size={16} className="text-emerald-500" /> Estado desejado / visão de futuro
                </label>
                <textarea
                  required
                  name="avatarDesiredState"
                  value={formData.avatarDesiredState}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Como será a vida do avatar após aplicar o método? O que muda em números, rotina e emoções?"
                  className={textareaMediumClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
              {renderGuidance('avatarDesiredState', 'Estado desejado')}
            </div>
          </div>
        </div>

        <div
          id="section-offer-info"
          className={`rounded-3xl border border-slate-200 p-8 space-y-8 ${!isSectionActive('section-offer-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" /> Oferta & CPLs
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Promessa + roteiro</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" /> Preço de Venda
              </label>
              <input
                required
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Ex: R$ 997,00"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Target size={16} className="text-slate-400" /> Preço de Âncora (Opcional)
              </label>
              <input
                name="anchorPrice"
                value={formData.anchorPrice}
                onChange={handleChange}
                placeholder="Ex: R$ 2.997,00"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500" /> Bônus Exclusivos
                </label>
                <textarea
                  required
                  name="bonuses"
                  value={formData.bonuses}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Liste os bônus que acompanham a oferta..."
                  className={textareaMediumClass}
                />
              </div>
              {renderGuidance('bonuses', 'Bônus e valor extra')}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> Garantia
              </label>
              <input
                required
                name="guarantee"
                value={formData.guarantee}
                onChange={handleChange}
                placeholder="Ex: 7 dias incondicional + 30 dias condicional"
                className={baseFieldClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" /> Formas de Pagamento
              </label>
              <input
                required
                name="paymentMethods"
                value={formData.paymentMethods}
                onChange={handleChange}
                placeholder="Ex: Cartão em 12x, PIX, Boleto"
                className={baseFieldClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Escassez e Urgência
              </label>
              <input
                required
                name="scarcity"
                value={formData.scarcity}
                onChange={handleChange}
                placeholder="Ex: Apenas 100 vagas ou até sexta-feira"
                className={baseFieldClass}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Target size={16} className="text-indigo-500" /> Outros Detalhes da Oferta
                </label>
                <textarea
                  required
                  name="offerDetails"
                  value={formData.offerDetails}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Algum detalhe extra importante?"
                  className={textareaMediumClass}
                />
              </div>
              {renderGuidance('offerDetails', 'Detalhes adicionais da oferta')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Rocket size={16} className="text-purple-500" /> Solução âncora do CPL 3
                </label>
                <textarea
                  required
                  name="cplThreeSolution"
                  value={formData.cplThreeSolution}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Qual demonstração, mecanismo único ou garantia será entregue no CPL 3 para destravar a decisão?"
                  className={textareaMediumClass}
                />
              </div>
              {renderGuidance('cplThreeSolution', 'Solução CPL 3')}
            </div>
          </div>
        </div>

        {!hasVisibleSection && (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Selecione uma das categorias do diagnóstico na navegação lateral para preencher os campos.
        </div>
        )}
      </div>

      {saveError && <p className="text-sm text-red-600 text-center">{saveError}</p>}

      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
      >
        {(isLoading || isSubmitting) ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Salvando diagnóstico...
          </>
        ) : (
          <>
            <Rocket size={20} />
            Salvar diagnóstico estratégico
          </>
        )}
      </button>
    </form>
  );
}
