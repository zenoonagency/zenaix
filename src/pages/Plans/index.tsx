import React, { useState } from 'react';
import { PlanCard } from './components/PlanCard';
import { CalendarDays, Calendar, QrCode, Copy, ExternalLink } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { toast } from 'react-toastify';

interface Plan {
  id: string;
  backendId: string;
  title: string;
  description: string;
  pricePerUser: number;
  pricePerYear: number;
  additionalLicensePrice: number;
  baseUsers: number;
  features: string[];
  gradient: string;
  isPopular?: boolean;
}

export function Plans() {
  const [selectedPlan, setSelectedPlan] = useState('essential');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

  const plans: Plan[] = [
    {
      id: 'essential',
      backendId: 'plan_essential_2024',
      title: 'Essential',
      description: 'Perfeito para pequenas empresas e profissionais autônomos',
      pricePerUser: 297,
      pricePerYear: 3207.6, // 10% de desconto
      additionalLicensePrice: 97,
      baseUsers: 1,
      features: [
        'Até 100 contatos',
        'Disparo em massa padrão',
        'Suporte 24/7 por whatsapp',
        'Controle financeiro e contratual',
        'CRM avançado',
        'Até 3 Kanbans',
        'Até 3 Disparos por mês'
      ],
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'premium',
      backendId: 'plan_premium_ai_2024',
      title: 'Premium AI',
      description: 'Ideal para empresas em crescimento que precisam de mais recursos',
      pricePerUser: 397,
      pricePerYear: 4287.6, // 10% de desconto
      additionalLicensePrice: 147,
      baseUsers: 1,
      isPopular: true,
      features: [
        'Tudo do Essential',
        'Até 1.000 contatos',
        'Disparo com inteligência artificial',
        'ChatGPT integrado',
        'Multiplos usuários',
        'Até 5 Kanbans',
        'Até 5 Disparos por mês'
      ],
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      id: 'enterprise',
      backendId: 'plan_enterprise_ai_2024',
      title: 'Enterprise AI',
      description: 'Para empresas que necessitam de recursos personalizados',
      pricePerUser: 697,
      pricePerYear: 7527.6, // 10% de desconto
      additionalLicensePrice: 197,
      baseUsers: 1,
      features: [
        'Tudo do Premium AI',
        'Até 10.000 contatos',
        'Suporte 24/7 por whatsapp',
        'ChatGPT integrado',
        'Multiplos usuários',
        'Até 10 Kanbans',
        'Até disparos ilimitados'
      ],
      gradient: 'from-orange-500 to-pink-500'
    }
  ];

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handlePayment = () => {
    const stripeLinks = {
      essential: {
        monthly: 'https://buy.stripe.com/aEU9Cq2sJ2Qm51uaEE',
        yearly: 'https://buy.stripe.com/dR67ui3wN1Mi51ufZ1'
      },
      premium: {
        monthly: 'https://buy.stripe.com/aEUcOCd7n3UqalOcMN',
        yearly: 'https://buy.stripe.com/dR67uigjzez48dG8wA'
      },
      enterprise: {
        monthly: 'https://buy.stripe.com/dR67uid7n1MifG828a',
        yearly: 'https://buy.stripe.com/4gweWKgjz76CgKc4gl'
      }
    };

    const link = stripeLinks[selectedPlan as keyof typeof stripeLinks][billingPeriod];
    setPaymentLink(link);
    setShowPaymentModal(true);
  };

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-dark-700">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Gerenciamento de Planos
        </h1>
      </div>
      
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Seletor de Período */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-1 inline-flex shadow-sm">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <CalendarDays size={16} />
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Calendar size={16} />
                Anual
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  -10%
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Coluna da esquerda - Planos */}
            <div className="w-full lg:w-2/3 space-y-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  title={plan.title}
                  description={plan.description}
                  price={billingPeriod === 'monthly' ? plan.pricePerUser : plan.pricePerYear}
                  billingPeriod={billingPeriod}
                  features={plan.features}
                  isPopular={plan.isPopular}
                  gradient={plan.gradient}
                  baseUsers={plan.baseUsers}
                  isSelected={selectedPlan === plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                />
              ))}
            </div>

            {/* Coluna da direita - Licenças */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-4">
                <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Resumo do plano
                  </h3>

                  {/* Seleção de Licenças - Substituído por texto informativo */}
                  <div className="border-t border-gray-200 dark:border-dark-700 pt-4 mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
                      Licenças
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      1 licença incluída
                      <br />
                      Opção de licenças adicionais dentro do checkout
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 dark:border-dark-700 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Total {billingPeriod === 'monthly' ? 'mensal' : 'anual'}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatPrice(billingPeriod === 'monthly' ? selectedPlanData?.pricePerUser || 0 : selectedPlanData?.pricePerYear || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Botão */}
                  <button
                    onClick={handlePayment}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Seguir para pagamento
                  </button>

                  {/* Container dos Termos */}
                  <div className="bg-white dark:bg-dark-800 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Visualize nossos termos
                    </h4>
                    <div className="space-y-2">
                      <a 
                        href="#" 
                        className="block text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos de uso
                      </a>
                      <a 
                        href="#" 
                        className="block text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos de segurança
                      </a>
                      <a 
                        href="#" 
                        className="block text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos gerais
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pagamento Seguro"
      >
        <div className="w-full max-w-lg mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPlanData?.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Período: {billingPeriod === 'monthly' ? 'Mensal' : 'Anual'}
                </p>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(billingPeriod === 'monthly' ? selectedPlanData?.pricePerUser || 0 : selectedPlanData?.pricePerYear || 0)}
              </p>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Escolha como deseja prosseguir com o pagamento:
              </p>
            </div>

            {/* Botões de ação */}
            <div className="space-y-4">
              <button
                onClick={() => window.open(paymentLink, '_blank')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <ExternalLink size={20} />
                Abrir página de pagamento
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(paymentLink);
                  toast.success('Link copiado para a área de transferência!');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                <Copy size={20} />
                Copiar link de pagamento
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você será redirecionado para nossa página segura de pagamento no Stripe
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
} 