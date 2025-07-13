import React, { useState } from "react";

export function ManageAddonsForm({
  organization,
  addOns,
  memberAddOn,
  boardAddOn,
  triggerAddOn,
  formatPrice,
  onSubmit,
}) {
  const [form, setForm] = useState({
    extraBoards: organization?.extraBoards || 0,
    extraTeamMembers: organization?.extraTeamMembers || 0,
    extraTriggers: organization?.extraTriggers || 0,
  });

  const valorAtual = (() => {
    if (!organization || !addOns) return 0;
    const basePrice = organization?.plan?.price || 0;
    const boardAddOnPrice =
      addOns.find((p) => p.name.includes("Board"))?.price || 0;
    const memberAddOnPrice =
      addOns.find((p) => p.name.includes("Membro"))?.price || 0;
    const triggerAddOnPrice =
      addOns.find((p) => p.name.includes("Disparo"))?.price || 0;
    const extraBoardsCost = (organization.extraBoards || 0) * boardAddOnPrice;
    const extraMembersCost =
      (organization.extraTeamMembers || 0) * memberAddOnPrice;
    const extraTriggersCost =
      (organization.extraTriggers || 0) * triggerAddOnPrice;
    return basePrice + extraBoardsCost + extraMembersCost + extraTriggersCost;
  })();
  const valorNovo =
    (memberAddOn?.price || 0) * form.extraTeamMembers +
    (boardAddOn?.price || 0) * form.extraBoards +
    (triggerAddOn?.price || 0) * form.extraTriggers +
    (organization?.plan?.price || 0);

  const recursosAlterados =
    form.extraBoards > (organization?.extraBoards || 0) ||
    form.extraTeamMembers > (organization?.extraTeamMembers || 0) ||
    form.extraTriggers > (organization?.extraTriggers || 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Coluna da esquerda - Resumo dos recursos */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white dark:bg-dark-800 rounded-lg p-6 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-dark-900">
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
                  min={organization?.extraBoards || 0}
                  value={form.extraBoards}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extraBoards: Number(e.target.value),
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
                  min={organization?.extraTeamMembers || 0}
                  value={form.extraTeamMembers}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extraTeamMembers: Number(e.target.value),
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
                  min={organization?.extraTriggers || 0}
                  value={form.extraTriggers}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extraTriggers: Number(e.target.value),
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
          <div className="flex items-center gap-4 mt-8 mb-4">
            {valorAtual !== valorNovo && (
              <span className="text-xl font-semibold text-gray-400 line-through decoration-dashed">
                {formatPrice(valorAtual)}
              </span>
            )}
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatPrice(valorNovo)}
            </span>
            <span className="text-base font-normal text-gray-500 mb-1">
              /mês
            </span>
          </div>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mt-4">
            {form.extraBoards > 0 && (
              <li>+{form.extraBoards} Kanbans adicionais</li>
            )}
            {form.extraTeamMembers > 0 && (
              <li>+{form.extraTeamMembers} membros adicionais</li>
            )}
            {form.extraTriggers > 0 && (
              <li>+{form.extraTriggers} disparos adicionais</li>
            )}
            {form.extraBoards === 0 &&
              form.extraTeamMembers === 0 &&
              form.extraTriggers === 0 && (
                <li className="text-gray-400">
                  Nenhum recurso adicional selecionado.
                </li>
              )}
          </ul>
        </div>
      </div>
      {/* Coluna da direita - Confirmação e pagamento */}
      <div className="w-full lg:w-1/3">
        <div className="sticky top-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resumo da compra
            </h3>
            <div className="border-t border-gray-200 dark:border-dark-700 pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Total mensal
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPrice(valorNovo)}
                </span>
              </div>
            </div>
            <button
              onClick={() => onSubmit(form)}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!recursosAlterados}
            >
              Seguir para pagamento
            </button>
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
}
