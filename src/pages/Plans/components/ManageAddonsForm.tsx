import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
} from "react";
import { useAuthStore } from "../../../store/authStore";
import { subscriptionService } from "../../../services/subscription/subscription.service";
import { usePlanStore } from "../../../store/planStore";

type Props = {
  organization: any;
  addOns: any;
  memberAddOn: any;
  boardAddOn: any;
  triggerAddOn: any;
  formatPrice: any;
  onSubmit: any;
  onResetForm?: () => void;
};

export const ManageAddonsForm = forwardRef(function ManageAddonsForm(
  {
    organization,
    addOns,
    memberAddOn,
    boardAddOn,
    triggerAddOn,
    formatPrice,
    onSubmit,
    onResetForm,
  }: Props,
  ref: ForwardedRef<{ resetForm: () => void }>
) {
  const [form, setForm] = useState({
    extra_boards: 0,
    extra_team_members: 0,
    extra_triggers: 0,
  });

  // Função para zerar o formulário
  const resetForm = () => {
    setForm({
      extra_boards: 0,
      extra_team_members: 0,
      extra_triggers: 0,
    });
    if (onResetForm) onResetForm();
  };
  useImperativeHandle(ref, () => ({ resetForm }));

  // Controle de seleção de card
  const [selectedCard, setSelectedCard] = useState<"addons" | "oneTime">(
    "addons"
  );

  const valorAtual = (() => {
    if (!organization || !addOns) return 0;
    const basePrice = organization?.plan?.price || 0;
    const boardAddOnPrice =
      addOns.find((p) => p.name.includes("Board"))?.price || 0;
    const memberAddOnPrice =
      addOns.find((p) => p.name.includes("Membro"))?.price || 0;
    const triggerAddOnPrice =
      addOns.find((p) => p.name.includes("Disparo"))?.price || 0;
    const extraBoardsCost = (organization.extra_boards || 0) * boardAddOnPrice;
    const extraMembersCost =
      (organization.extra_team_members || 0) * memberAddOnPrice;
    const extraTriggersCost =
      (organization.extra_triggers || 0) * triggerAddOnPrice;
    return basePrice + extraBoardsCost + extraMembersCost + extraTriggersCost;
  })();
  const valorNovo =
    (memberAddOn?.price || 0) * form.extra_team_members +
    (boardAddOn?.price || 0) * form.extra_boards +
    (triggerAddOn?.price || 0) * form.extra_triggers +
    (organization?.plan?.price || 0);

  // Corrigir lógica do botão: liberar se qualquer campo > 0
  const recursosAlterados =
    form.extra_boards > 0 ||
    form.extra_team_members > 0 ||
    form.extra_triggers > 0;

  // Disparo único
  const [oneTimeTriggers, setOneTimeTriggers] = useState(0);
  const oneTimePlans = usePlanStore((state) => state.oneTime);
  const oneTimeTriggerPlan = oneTimePlans[0];
  const valorDisparoUnico = (oneTimeTriggerPlan?.price || 0) * oneTimeTriggers;
  const canBuyOneTime = oneTimeTriggers > 0;

  const token = useAuthStore((state) => state.token);
  const [loadingOneTime, setLoadingOneTime] = useState(false);

  const valorNovosRecursos =
    (memberAddOn?.price || 0) *
      (form.extra_team_members > 0 ? form.extra_team_members : 0) +
    (boardAddOn?.price || 0) * (form.extra_boards > 0 ? form.extra_boards : 0) +
    (triggerAddOn?.price || 0) *
      (form.extra_triggers > 0 ? form.extra_triggers : 0);

  // Valor total atual (plano + extras já existentes)
  const valorTotalAtual =
    (organization?.plan?.price || 0) +
    (memberAddOn?.price || 0) * (organization?.extra_team_members || 0) +
    (boardAddOn?.price || 0) * (organization?.extra_boards || 0) +
    (triggerAddOn?.price || 0) * (organization?.extra_triggers || 0);

  // Novo valor total após compra
  const valorTotalNovo =
    (organization?.plan?.price || 0) +
    (memberAddOn?.price || 0) *
      ((organization?.extra_team_members || 0) +
        (form.extra_team_members > 0 ? form.extra_team_members : 0)) +
    (boardAddOn?.price || 0) *
      ((organization?.extra_boards || 0) +
        (form.extra_boards > 0 ? form.extra_boards : 0)) +
    (triggerAddOn?.price || 0) *
      ((organization?.extra_triggers || 0) +
        (form.extra_triggers > 0 ? form.extra_triggers : 0));

  // Resumo do card selecionado
  const resumoCardSelecionado =
    selectedCard === "addons" ? (
      <>
        <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
          Recursos adicionais
        </h3>
        <div className="flex flex-col items-start mb-2">
          {recursosAlterados ? (
            <>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatPrice(valorNovosRecursos)}
                <span className="text-base font-normal text-gray-500 mb-1">
                  /mês
                </span>
              </span>
              <div className="flex flex-col mt-2">
                <span className="text-xs text-gray-500 line-through decoration-dashed">
                  {formatPrice(valorTotalAtual)}
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {formatPrice(valorTotalNovo)}
                </span>
              </div>
            </>
          ) : (
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {formatPrice(0)}
              <span className="text-base font-normal text-gray-500 mb-1">
                /mês
              </span>
            </span>
          )}
        </div>
        <ul className="text-base text-gray-700 dark:text-gray-300 space-y-1 font-medium">
          <li>
            <span className="text-black dark:text-white font-bold">
              {organization?.extra_team_members || 0}
            </span>
            {form.extra_team_members > 0 && (
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                {" + "}
                {form.extra_team_members}
              </span>
            )}{" "}
            <span className="text-gray-500 font-normal">membros</span>
          </li>
          <li>
            <span className="text-black dark:text-white font-bold">
              {organization?.extra_boards || 0}
            </span>
            {form.extra_boards > 0 && (
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                {" + "}
                {form.extra_boards}
              </span>
            )}{" "}
            <span className="text-gray-500 font-normal">kanbans</span>
          </li>
          <li>
            <span className="text-black dark:text-white font-bold">
              {organization?.extra_triggers || 0}
            </span>
            {form.extra_triggers > 0 && (
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                {" + "}
                {form.extra_triggers}
              </span>
            )}{" "}
            <span className="text-gray-500 font-normal">disparos</span>
          </li>
          {form.extra_boards === 0 &&
            form.extra_team_members === 0 &&
            form.extra_triggers === 0 &&
            (organization?.extra_boards || 0) === 0 &&
            (organization?.extra_team_members || 0) === 0 &&
            (organization?.extra_triggers || 0) === 0 && (
              <li className="text-gray-400">
                Nenhum recurso adicional selecionado.
              </li>
            )}
        </ul>
      </>
    ) : (
      <>
        <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
          Comprar disparo único
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {oneTimeTriggerPlan && oneTimeTriggerPlan.price > 0
              ? formatPrice(valorDisparoUnico)
              : formatPrice(0)}
          </span>
          <span className="text-base font-normal text-gray-500 mb-0">
            total
          </span>
        </div>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>
            {oneTimeTriggers > 0
              ? `+${oneTimeTriggers} disparos únicos`
              : "Nenhum disparo selecionado."}
          </li>
        </ul>
      </>
    );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex flex-col gap-6 w-full lg:w-2/3">
        <div
          className={`flex-1 cursor-pointer transition-all duration-150 ${
            selectedCard === "addons"
              ? "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-dark-900 bg-white dark:bg-dark-800"
              : "opacity-60 bg-white dark:bg-dark-800 border border-purple-200"
          } rounded-lg p-6`}
          onClick={() => setSelectedCard("addons")}
        >
          <h3 className="text-2xl font-bold mb-2 text-purple-700 dark:text-purple-300">
            Recursos adicionais
          </h3>
          <p className="text-base text-gray-500 mb-4">
            Adicione mais recursos ao seu plano atual conforme a necessidade do
            seu negócio.
          </p>
          <form className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Kanbans adicionais
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.extra_boards}
                  onFocus={() => setSelectedCard("addons")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extra_boards: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded border"
                />
                {boardAddOn && (
                  <span className="text-xs text-gray-500">
                    R$ {boardAddOn.price.toFixed(2)} cada
                  </span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Membros adicionais
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.extra_team_members}
                  onFocus={() => setSelectedCard("addons")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extra_team_members: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded border"
                />
                {memberAddOn && (
                  <span className="text-xs text-gray-500">
                    R$ {memberAddOn.price.toFixed(2)} cada
                  </span>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Disparos adicionais
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.extra_triggers}
                  onFocus={() => setSelectedCard("addons")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extra_triggers: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded border"
                />
                {triggerAddOn && (
                  <span className="text-xs text-gray-500">
                    R$ {triggerAddOn.price.toFixed(2)} cada
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
        {/* Card de disparo único */}
        <div
          className={`flex-1 cursor-pointer transition-all duration-150 ${
            selectedCard === "oneTime"
              ? "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-dark-900 bg-white dark:bg-dark-800"
              : "opacity-60 bg-white dark:bg-dark-800 border border-purple-200"
          } rounded-lg p-6`}
          onClick={() => setSelectedCard("oneTime")}
        >
          <h3 className="text-2xl font-bold mb-2 text-purple-700 dark:text-purple-300">
            Comprar disparo único
          </h3>
          <p className="text-base text-gray-500 mb-4">
            Compre disparos avulsos para usar quando precisar. Eles não são
            recorrentes e expiram após o uso.
          </p>
          <form className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Quantidade de disparos únicos
                </label>
                <input
                  type="number"
                  min={0}
                  value={oneTimeTriggers}
                  onFocus={() => setSelectedCard("oneTime")}
                  onChange={(e) => setOneTimeTriggers(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border"
                />
                {oneTimeTriggerPlan && (
                  <span className="text-xs text-gray-500">
                    R$ {oneTimeTriggerPlan?.price?.toFixed(2)} cada
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* Coluna da direita - Confirmação e pagamento */}
      <div className="w-full lg:w-1/3">
        <div className="sticky top-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirmar compra
            </h3>
            <div className="mb-4">{resumoCardSelecionado}</div>
            {selectedCard === "addons" ? (
              <button
                onClick={() => onSubmit(form)}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!recursosAlterados}
              >
                Seguir para pagamento
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!organization || !token || !oneTimeTriggers) return;
                  setLoadingOneTime(true);
                  try {
                    const res =
                      await subscriptionService.purchaseOneTimeTriggers(
                        token,
                        organization.id,
                        {
                          quantity: oneTimeTriggers,
                        }
                      );
                    // Chama o onSubmit passando o link para abrir a modal de pagamento
                    onSubmit &&
                      onSubmit({ oneTimePaymentUrl: res.checkout_url });
                  } catch (err) {
                    alert(
                      "Erro ao gerar link de pagamento para disparo único."
                    );
                  } finally {
                    setLoadingOneTime(false);
                  }
                }}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canBuyOneTime || loadingOneTime}
              >
                {loadingOneTime ? "Gerando link..." : "Comprar disparo único"}
              </button>
            )}
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
  );
});
