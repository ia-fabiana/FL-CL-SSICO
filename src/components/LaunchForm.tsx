import React, { useState } from 'react';
import { LaunchData } from '../types';
import { Rocket, Target, Tag, Users, AlertCircle, Sparkles, Calendar, DollarSign, Check } from 'lucide-react';

interface Props {
  onSubmit: (data: LaunchData) => void;
  isLoading: boolean;
}

export default function LaunchForm({ onSubmit, isLoading }: Props) {
  const [formData, setFormData] = useState<LaunchData>({
    productName: '',
    niche: '',
    targetAudience: '',
    mainProblem: '',
    mainBenefit: '',
    price: '',
    anchorPrice: '',
    guarantee: '',
    bonuses: '',
    paymentMethods: '',
    scarcity: '',
    launchDate: '',
    offerDetails: '',
    launchModel: 'opportunity',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <Rocket size={20} className="text-indigo-600" /> Informações do Produto
        </h3>
        
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
              <option value="opportunity">A Oportunidade (Foco em algo novo/exclusivo)</option>
              <option value="right_wrong">Jeito Certo vs Jeito Errado (Foco em erro comum e solução)</option>
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

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <DollarSign size={20} className="text-emerald-600" /> Oferta Irresistível
        </h3>
        
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
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Gerando Estratégia...
          </>
        ) : (
          <>
            <Rocket size={20} />
            Gerar Estrutura de Lançamento
          </>
        )}
      </button>
    </form>
  );
}
