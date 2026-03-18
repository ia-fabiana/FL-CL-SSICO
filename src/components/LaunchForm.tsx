import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { GuidanceEntry, GuidanceMap, LaunchData } from '../types';
import { GuidedFieldKey, guidanceKeyForField } from '../guidance';
import { Rocket, Target, Tag, Users, AlertCircle, Sparkles, Calendar, DollarSign, Check } from 'lucide-react';

const EMPTY_FORM: LaunchData = {
  generalTriggers: '',
  launchType: 'classic',
  avatarName: '',
  expertInstagramHandle: '',
  expertInstagramUrl: '',
  expertFacebookUrl: '',
  expertYoutubeUrl: '',
  expertLinkInBio: '',
  expertPhotoReferenceUrl: '',
  expertLookGuide: '',
  expertLookReferenceUrl: '',
  expertEnvironmentGuide: '',
  expertEnvironmentReferenceUrl: '',
  expertArtDirection: '',
  productName: '',
  niche: '',
  targetAudience: '',
  mainProblem: '',
  mainBenefit: '',
  avatarStory: '',
  avatarAge: '',
  avatarGender: '',
  avatarSalary: '',
  avatarProfession: '',
  avatarReligion: '',
  avatarPoliticalOrientation: '',
  avatarOtherDetails: '',
  avatarSummary: '',
  avatarPains: '',
  avatarDesires: '',
  avatarObjections: '',
  avatarRomaMyth: '',
  avatarFear: '',
  avatarLimitingBeliefs: '',
  avatarQuote: '',
  avatarOpportunitiesShortcuts: '',
  avatarResearchABC: '',
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
  'section-roma-info',
  'section-general-triggers',
  'section-expert-info',
  'section-avatar-info',
  'section-offer-info',
];

interface GuidancePanelProps {
  label: string;
  entry?: GuidanceEntry;
  saving?: boolean;
  processing?: boolean;
  processedPreview?: string;
  showOutputTools?: boolean;
  onDownloadDoc?: () => void;
  onDownloadPdf?: () => void;
  onCopyOutput?: () => void;
  onChange: (field: keyof GuidanceEntry, value: string) => void;
  onSave: () => void;
  onProcess: () => void;
}

function GuidancePanel({
  label,
  entry,
  saving,
  processing,
  processedPreview,
  showOutputTools,
  onDownloadDoc,
  onDownloadPdf,
  onCopyOutput,
  onChange,
  onSave,
  onProcess,
}: GuidancePanelProps) {
  const [showPreview, setShowPreview] = useState(true);
  const hasOutput = Boolean(processedPreview?.trim());

  return (
    <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 p-5 shadow-[0_10px_35px_rgba(99,102,241,0.12)] space-y-4">
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
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500/80">
        Markdown aceito: # titulo, ## secao, -, 1., &gt;
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

      {showOutputTools && (
        <div className="rounded-2xl border border-indigo-200 bg-white p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
            Mesmo texto gerado no campo "História da Expert"
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(v => !v)}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-700 hover:bg-indigo-100"
            >
              {showPreview ? 'Ocultar visualização' : 'Visualizar resultado'}
            </button>

            <button
              type="button"
              onClick={onCopyOutput}
              disabled={!hasOutput}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Copiar texto
            </button>

            <button
              type="button"
              onClick={onDownloadDoc}
              disabled={!hasOutput}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              Download Word
            </button>

            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={!hasOutput}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              Download PDF
            </button>
          </div>

          {showPreview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-80 overflow-auto">
              {hasOutput ? (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-base font-black text-slate-900">{children}</h1>,
                    h2: ({ children }) => <h2 className="mt-3 text-sm font-black text-slate-900">{children}</h2>,
                    h3: ({ children }) => <h3 className="mt-2 text-xs font-black text-slate-900">{children}</h3>,
                    p: ({ children }) => <p className="mt-2 text-sm leading-relaxed text-slate-700">{children}</p>,
                    li: ({ children }) => <li className="text-sm text-slate-700">{children}</li>,
                    strong: ({ children }) => (
                      <span className="rounded-md bg-pink-100 px-1.5 py-0.5 font-black text-pink-700">{children}</span>
                    ),
                    code: ({ children }) => (
                      <span className="rounded-md bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-700">{children}</span>
                    ),
                  }}
                >
                  {processedPreview || ''}
                </ReactMarkdown>
              ) : (
                <p className="text-xs text-slate-500">Ainda não há conteúdo processado para visualizar.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  onSubmit: (data: LaunchData) => Promise<void> | void;
  onDownloadSection?: (sectionId: string) => void;
  onSaveMainBenefit?: (mainBenefit: string) => Promise<void> | void;
  onUploadExpertPhoto?: (file: File) => Promise<string>;
  onUploadExpertLookImage?: (file: File) => Promise<string>;
  onUploadExpertEnvironmentImage?: (file: File) => Promise<string>;
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
  onDownloadSection,
  onSaveMainBenefit,
  onUploadExpertPhoto,
  onUploadExpertLookImage,
  onUploadExpertEnvironmentImage,
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
  const [isSavingRoma, setIsSavingRoma] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLookImage, setIsUploadingLookImage] = useState(false);
  const [isUploadingEnvironmentImage, setIsUploadingEnvironmentImage] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isSectionActive = (sectionId: string) => !activeSection || activeSection === sectionId;
  const hasVisibleSection = FORM_SECTION_IDS.some(isSectionActive);

  const baseFieldClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';
  const textareaTallClass = `${baseFieldClass} min-h-[170px] leading-relaxed`;
  const textareaMediumClass = `${baseFieldClass} min-h-[130px] leading-relaxed`;

  const downloadAsWord = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const markdownToPlainText = (content: string): string =>
    content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/^[-*+]\s+/gm, '- ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const downloadAsPdf = (fileName: string, content: string) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const text = markdownToPlainText(content);
    const lines = pdf.splitTextToSize(text, 520);
    let y = 48;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    for (const line of lines) {
      if (y > 790) {
        pdf.addPage();
        y = 48;
      }
      pdf.text(line, 40, y);
      y += 16;
    }

    pdf.save(fileName);
  };

  const renderGuidance = (field: GuidedFieldKey, label: string) => {
    const key = guidanceKeyForField(field);
    const isAvatarStory = field === 'avatarStory';
    const previewValue = isAvatarStory ? formData.avatarStory : '';

    return (
      <GuidancePanel
        label={label}
        entry={guidance[key]}
        saving={guidanceSaving[key]}
        processing={guidanceProcessing[key]}
        processedPreview={previewValue}
        showOutputTools={isAvatarStory}
        onCopyOutput={() => {
          if (!previewValue.trim()) return;
          navigator.clipboard.writeText(previewValue).catch(console.error);
        }}
        onDownloadDoc={() => {
          if (!previewValue.trim()) return;
          downloadAsWord('historia-da-expert.doc', previewValue);
        }}
        onDownloadPdf={() => {
          if (!previewValue.trim()) return;
          downloadAsPdf('historia-da-expert.pdf', previewValue);
        }}
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
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar seus dados. Tente novamente.');
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

  const handleSaveRoma = async () => {
    if (!onSaveMainBenefit) {
      return;
    }

    setSaveError(null);
    setIsSavingRoma(true);
    try {
      await Promise.race([
        Promise.resolve(onSaveMainBenefit(formData.mainBenefit)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
    } catch (error) {
      console.error('Erro ao salvar ROMA', error);
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar a ROMA agora. Tente novamente.');
    } finally {
      setIsSavingRoma(false);
    }
  };

  const handleUploadExpertPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!onUploadExpertPhoto) {
      setSaveError('Upload de foto não está habilitado neste ambiente.');
      event.target.value = '';
      return;
    }

    setSaveError(null);
    setIsUploadingPhoto(true);
    try {
      const uploadedUrl = await onUploadExpertPhoto(file);
      setFormData(prev => ({ ...prev, expertPhotoReferenceUrl: uploadedUrl }));
    } catch (error) {
      console.error('Erro ao enviar foto da expert', error);
      setSaveError(error instanceof Error ? error.message : 'Não foi possível enviar a foto da expert.');
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const handleUploadExpertLookImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!onUploadExpertLookImage) {
      setSaveError('Upload de referência de roupa não está habilitado neste ambiente.');
      event.target.value = '';
      return;
    }

    setSaveError(null);
    setIsUploadingLookImage(true);
    try {
      const uploadedUrl = await onUploadExpertLookImage(file);
      setFormData(prev => ({ ...prev, expertLookReferenceUrl: uploadedUrl }));
    } catch (error) {
      console.error('Erro ao enviar referência de roupa', error);
      setSaveError(error instanceof Error ? error.message : 'Não foi possível enviar a referência de roupa.');
    } finally {
      setIsUploadingLookImage(false);
      event.target.value = '';
    }
  };

  const handleUploadExpertEnvironmentImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!onUploadExpertEnvironmentImage) {
      setSaveError('Upload de referência de ambiente não está habilitado neste ambiente.');
      event.target.value = '';
      return;
    }

    setSaveError(null);
    setIsUploadingEnvironmentImage(true);
    try {
      const uploadedUrl = await onUploadExpertEnvironmentImage(file);
      setFormData(prev => ({ ...prev, expertEnvironmentReferenceUrl: uploadedUrl }));
    } catch (error) {
      console.error('Erro ao enviar referência de ambiente', error);
      setSaveError(error instanceof Error ? error.message : 'Não foi possível enviar a referência de ambiente.');
    } finally {
      setIsUploadingEnvironmentImage(false);
      event.target.value = '';
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 rounded-3xl border-2 border-slate-200 bg-white/95 p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
    >
      <div className="space-y-6">
        <div
          id="section-launch-date"
          className={`rounded-3xl border-2 border-indigo-300 bg-indigo-50/35 p-8 shadow-[0_8px_30px_rgba(79,70,229,0.12)] space-y-8 ${!isSectionActive('section-launch-date') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" /> Data oficial do lançamento
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Anchor date · D0</p>
              <button type="button" onClick={() => onDownloadSection?.('section-launch-date')} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700">Download categoria</button>
            </div>
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
                <Check size={16} className="text-indigo-500" /> Tipo de Lançamento
              </label>
              <select
                name="launchType"
                value={formData.launchType}
                onChange={handleChange}
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              >
                <option value="classic">Lançamento Clássico</option>
                <option value="seed">Lançamento Semente</option>
              </select>
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
          className={`rounded-3xl border-2 border-cyan-300 bg-cyan-50/35 p-8 shadow-[0_8px_30px_rgba(6,182,212,0.12)] space-y-8 ${!isSectionActive('section-product-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Rocket size={20} className="text-indigo-600" /> Mapa do Produto
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Contexto macro</p>
              <button type="button" onClick={() => onDownloadSection?.('section-product-info')} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700">Download categoria</button>
            </div>
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

          </div>
        </div>

        <div
          id="section-roma-info"
          className={`rounded-3xl border-2 border-amber-300 bg-amber-50/35 p-8 shadow-[0_8px_30px_rgba(245,158,11,0.15)] space-y-8 ${!isSectionActive('section-roma-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" /> Informações de ROMA
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Promessa oficial</p>
              <button type="button" onClick={() => onDownloadSection?.('section-roma-info')} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700">Download categoria</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Promessa Principal (ROMA)
              </label>
              <textarea
                required
                name="mainBenefit"
                value={formData.mainBenefit}
                onChange={handleChange}
                rows={3}
                placeholder="Qual o grande benefício final que sua solução entrega?"
                className={textareaTallClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveRoma}
                  disabled={isSubmitting || isSavingRoma || !formData.mainBenefit.trim()}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-amber-700 hover:border-amber-400 hover:bg-amber-50 disabled:opacity-60"
                >
                  {isSavingRoma ? 'Salvando...' : 'Salvar ROMA'}
                </button>
                <span className="text-[11px] font-semibold text-slate-500">
                  Salva imediatamente junto com o diagnóstico.
                </span>
              </div>
            </div>
            {renderGuidance('mainBenefit', 'Promessa Principal')}
          </div>
        </div>

        <div
          id="section-general-triggers"
          className={`rounded-3xl border-2 border-slate-300 bg-slate-50/60 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.08)] space-y-8 ${!isSectionActive('section-general-triggers') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-slate-600" /> Gatilhos Mentais
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Base para todo o lançamento</p>
              <button type="button" onClick={() => onDownloadSection?.('section-general-triggers')} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700">Download categoria</button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Sparkles size={16} className="text-slate-500" /> Gatilhos e explicações
            </label>
            <textarea
              name="generalTriggers"
              value={formData.generalTriggers}
              onChange={handleChange}
              rows={8}
              placeholder="Liste os gatilhos e as explicações que devem aparecer em todas as fases..."
              className={textareaTallClass}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
            />
          </div>
        </div>

        <div
          id="section-expert-info"
          className={`rounded-3xl border-2 border-fuchsia-300 bg-fuchsia-50/30 p-8 shadow-[0_8px_30px_rgba(217,70,239,0.12)] space-y-8 ${!isSectionActive('section-expert-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-fuchsia-500" /> Informações da Expert · História
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Narrativa raiz</p>
              <button type="button" onClick={() => onDownloadSection?.('section-expert-info')} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700">Download categoria</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" /> Nome da Expert
                </label>
              <input
                required
                name="avatarName"
                value={formData.avatarName}
                onChange={handleChange}
                placeholder="Ex: Fabiana, gestora há mais de 20 anos no setor da beleza"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Instagram (@)</label>
                <input
                  name="expertInstagramHandle"
                  value={formData.expertInstagramHandle}
                  onChange={handleChange}
                  placeholder="Ex: @iafabianaoficial"
                  className={baseFieldClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Instagram (URL)</label>
                <input
                  name="expertInstagramUrl"
                  value={formData.expertInstagramUrl}
                  onChange={handleChange}
                  placeholder="Ex: https://www.instagram.com/iafabianaoficial/"
                  className={baseFieldClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Facebook (URL)</label>
                <input
                  name="expertFacebookUrl"
                  value={formData.expertFacebookUrl}
                  onChange={handleChange}
                  placeholder="Ex: https://www.facebook.com/suapagina"
                  className={baseFieldClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">YouTube (URL)</label>
                <input
                  name="expertYoutubeUrl"
                  value={formData.expertYoutubeUrl}
                  onChange={handleChange}
                  placeholder="Ex: https://www.youtube.com/@seucanal"
                  className={baseFieldClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Link principal da bio</label>
                <input
                  name="expertLinkInBio"
                  value={formData.expertLinkInBio}
                  onChange={handleChange}
                  placeholder="Ex: https://seulink.com"
                  className={baseFieldClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Foto de referência da Expert (URL)</label>
                <input
                  name="expertPhotoReferenceUrl"
                  value={formData.expertPhotoReferenceUrl}
                  onChange={handleChange}
                  placeholder="Ex: https://.../foto-da-expert.jpg"
                  className={baseFieldClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-fuchsia-700 hover:bg-fuchsia-100 cursor-pointer">
                    {isUploadingPhoto ? 'Enviando foto...' : 'Subir foto da expert'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadExpertPhoto}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Se enviar arquivo, a URL será preenchida automaticamente.
                  </span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Guia de roupa/visual da Expert</label>
                <textarea
                  name="expertLookGuide"
                  value={formData.expertLookGuide}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ex: blazer bege, camisa branca, acessórios discretos, imagem premium e elegante."
                  className={textareaMediumClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    name="expertLookReferenceUrl"
                    value={formData.expertLookReferenceUrl}
                    onChange={handleChange}
                    placeholder="URL de imagem de referência da roupa (opcional)"
                    className={baseFieldClass}
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-enable-grammarly="false"
                  />
                  <label className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-fuchsia-700 hover:bg-fuchsia-100 cursor-pointer self-center text-center">
                    {isUploadingLookImage ? 'Enviando roupa...' : 'Subir ref. roupa'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadExpertLookImage}
                      className="hidden"
                      disabled={isUploadingLookImage}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">Você pode preencher por texto, por imagem de referência, ou os dois.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Guia de ambiente/cenário</label>
                <textarea
                  name="expertEnvironmentGuide"
                  value={formData.expertEnvironmentGuide}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ex: ambiente de salão sofisticado, iluminação suave, fundo clean e organizado."
                  className={textareaMediumClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    name="expertEnvironmentReferenceUrl"
                    value={formData.expertEnvironmentReferenceUrl}
                    onChange={handleChange}
                    placeholder="URL de imagem de referência do ambiente (opcional)"
                    className={baseFieldClass}
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-enable-grammarly="false"
                  />
                  <label className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-fuchsia-700 hover:bg-fuchsia-100 cursor-pointer self-center text-center">
                    {isUploadingEnvironmentImage ? 'Enviando ambiente...' : 'Subir ref. ambiente'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadExpertEnvironmentImage}
                      className="hidden"
                      disabled={isUploadingEnvironmentImage}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">Você pode preencher por texto, por imagem de referência, ou os dois.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Direção artística da imagem</label>
                <textarea
                  name="expertArtDirection"
                  value={formData.expertArtDirection}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ex: meio corpo, luz natural lateral, expressão confiante e acolhedora, paleta rosé e dourado."
                  className={textareaMediumClass}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Sparkles size={16} className="text-fuchsia-500" /> História da Expert (realidade atual)
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

              {renderGuidance('avatarStory', 'História da Expert')}
            </div>
          </div>
        </div>

        <div
          id="section-avatar-info"
          className={`rounded-3xl border-2 border-rose-300 bg-rose-50/30 p-8 shadow-[0_8px_30px_rgba(244,63,94,0.12)] space-y-8 ${!isSectionActive('section-avatar-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" /> Informações do Avatar
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Base de conhecimento</p>
              <button type="button" onClick={() => onDownloadSection?.('section-avatar-info')} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700">Download categoria</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Idade</label>
              <input
                name="avatarAge"
                value={formData.avatarAge}
                onChange={handleChange}
                placeholder="Ex: 35 a 54 anos"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Sexo</label>
              <input
                name="avatarGender"
                value={formData.avatarGender}
                onChange={handleChange}
                placeholder="Ex: Mulher"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Salário</label>
              <input
                name="avatarSalary"
                value={formData.avatarSalary}
                onChange={handleChange}
                placeholder="Ex: R$ 8 mil a R$ 25 mil por mês"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Profissão</label>
              <input
                name="avatarProfession"
                value={formData.avatarProfession}
                onChange={handleChange}
                placeholder="Ex: Dona de negócio da beleza"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Religião</label>
              <input
                name="avatarReligion"
                value={formData.avatarReligion}
                onChange={handleChange}
                placeholder="Ex: Cristã"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Orientação Política</label>
              <input
                name="avatarPoliticalOrientation"
                value={formData.avatarPoliticalOrientation}
                onChange={handleChange}
                placeholder="Ex: Conservadora / moderada"
                className={baseFieldClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Outras
              </label>
              <textarea
                name="avatarOtherDetails"
                value={formData.avatarOtherDetails}
                onChange={handleChange}
                rows={3}
                placeholder="Exemplo: tem entre 1 a 2 filhos"
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> Resuma seu Avatar em até 4 linhas
              </label>
              <textarea
                name="avatarSummary"
                value={formData.avatarSummary}
                onChange={handleChange}
                rows={4}
                placeholder="Exemplo: Mulher, dona de negócio da beleza, 35 a 54 anos, tem de 1 a 2 filhos, cristã, nunca usou IA ou só usou o básico. Tem muita dificuldade em divulgar seu negócio da beleza pelas redes sociais e atrair novas clientes."
                className={textareaTallClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            {renderGuidance('avatarSummary', 'Resumo do Avatar')}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">1. Dores</label>
              <textarea
                name="avatarPains"
                value={formData.avatarPains}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">2. Desejos</label>
              <textarea
                name="avatarDesires"
                value={formData.avatarDesires}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">3. Objeções</label>
              <textarea
                name="avatarObjections"
                value={formData.avatarObjections}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">4. Mito Sobre ROMA</label>
              <textarea
                name="avatarRomaMyth"
                value={formData.avatarRomaMyth}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">5. Medo</label>
              <textarea
                name="avatarFear"
                value={formData.avatarFear}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">6. Crenças limitantes</label>
              <textarea
                name="avatarLimitingBeliefs"
                value={formData.avatarLimitingBeliefs}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">7. "Abre Aspas"</label>
              <textarea
                name="avatarQuote"
                value={formData.avatarQuote}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">8. Oportunidades e Atalhos</label>
              <textarea
                name="avatarOpportunitiesShortcuts"
                value={formData.avatarOpportunitiesShortcuts}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">9. Pesquisa ABC</label>
              <textarea
                name="avatarResearchABC"
                value={formData.avatarResearchABC}
                onChange={handleChange}
                rows={3}
                className={textareaMediumClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>
          </div>
        </div>

        <div
          id="section-offer-info"
          className={`rounded-3xl border-2 border-emerald-300 bg-emerald-50/30 p-8 shadow-[0_8px_30px_rgba(16,185,129,0.12)] space-y-8 ${!isSectionActive('section-offer-info') ? 'hidden' : ''}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" /> Oferta & CPLs
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Promessa + roteiro</p>
              <button type="button" onClick={() => onDownloadSection?.('section-offer-info')} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700">Download categoria</button>
            </div>
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
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
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
