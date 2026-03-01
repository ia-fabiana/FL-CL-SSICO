import React, { useEffect, useState } from 'react';
import { LaunchData } from '../types';
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

interface Props {
  onSubmit: (data: LaunchData) => Promise<void> | void;
  isLoading: boolean;
  initialData?: LaunchData | null;
  onAvatarStoryDraft?: (value: string) => void;
}

export default function LaunchForm({ onSubmit, isLoading, initialData, onAvatarStoryDraft }: Props) {
  const [formData, setFormData] = useState<LaunchData>(buildFormData(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const nextData = buildFormData(initialData);
    setFormData(nextData);
    onAvatarStoryDraft?.(nextData.avatarStory || '');
  }, [initialData]);

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
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Rocket size={20} className="text-indigo-600" /> Mapa do Produto
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Contexto macro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" /> Modelo do CPL 1 (Âncora do Lançamento)
              </label>
              <select
                name="launchModel"
                value={formData.launchModel}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
              >
                 <option value="opportunity">Oportunidade / Oportunidade Amplificada</option>
                 <option value="right_wrong">Jeito Errado vs Jeito Certo</option>
              </select>
            </div>

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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-fuchsia-500" /> Diagnóstico do Avatar
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Narrativa + dores</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" /> Oferta & CPLs
            </h3>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Promessa + roteiro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Escassez e Urgência
              </label>
              <input
                required
                name="scarcity"
                value={formData.scarcity}
                onChange={handleChange}
                placeholder="Ex: Apenas 100 vagas ou até sexta-feira"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {saveError && (
        <p className="text-sm text-red-600 text-center">{saveError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
      >
        {(isLoading || isSubmitting) ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
