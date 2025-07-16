import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/authStore";
import { subscriptionService } from "../services/subscription/subscription.service";
import { formatCurrency } from "../utils/formatters";

export function ManageResourcesForm({
  plan,
  organization,
  addOns,
  valorAtual,
  onClose,
  fetchAndSyncUser,
}) {
  const [kanbans, setKanbans] = useState(organization?.extra_boards || 0);
  const [members, setMembers] = useState(organization?.extra_team_members || 0);
  const [triggers, setTriggers] = useState(organization?.extra_triggers || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState([]);
  const { token } = useAuthStore();

  // Valores mínimos (não pode ser menor que o plano)
  const minKanbans = 0;
  const minMembers = 0;
  const minTriggers = 0;

  // Valores atuais
  const currentKanbans = organization?.extra_boards || 0;
  const currentMembers = organization?.extra_team_members || 0;
  const currentTriggers = organization?.extra_triggers || 0;

  // Detecta se está aumentando ou diminuindo
  const isAdding =
    kanbans > currentKanbans ||
    members > currentMembers ||
    triggers > currentTriggers;
  const isRemoving =
    kanbans < currentKanbans ||
    members < currentMembers ||
    triggers < currentTriggers;

  // Texto do botão
  let confirmText = "Confirmar";
  let confirmClass = "bg-[#7f00ff] hover:bg-purple-800 text-white";
  if (isRemoving && !isAdding) {
    confirmText = "Remover Recursos";
    confirmClass =
      "border-2 border-[#7f00ff] text-[#7f00ff] bg-white hover:bg-purple-50";
  } else if (isAdding && !isRemoving) {
    confirmText = "Comprar Recursos";
    confirmClass = "bg-[#7f00ff] hover:bg-purple-800 text-white";
  } else if (isAdding && isRemoving) {
    confirmText = "Atualizar Recursos";
    confirmClass = "bg-[#7f00ff] hover:bg-purple-800 text-white";
  }

  // Mensagem de confirmação
  let confirmMessage = ["Confirma a atualização dos recursos adicionais?"];
  if (isAdding && !isRemoving)
    confirmMessage = ["Você confirma a compra dos novos recursos adicionais?"];
  if (isRemoving && !isAdding)
    confirmMessage = [
      "Você tem certeza que deseja remover seus recursos adicionais?",
      "O valor proporcional pelo tempo não utilizado neste mês será adicionado como um crédito na sua próxima fatura.",
      "O seu limite de recursos será ajustado imediatamente.",
    ];
  if (isAdding && isRemoving)
    confirmMessage = ["Você confirma a atualização dos recursos adicionais?"];
  // Cálculo do valor final (com os novos valores)
  const basePrice = plan?.price || 0;
  const boardAddOnPrice =
    addOns?.find?.((p) => p.name?.includes("Board"))?.price || 0;
  const memberAddOnPrice =
    addOns?.find?.((p) => p.name?.includes("Membro"))?.price || 0;
  const triggerAddOnPrice =
    addOns?.find?.((p) => p.name?.includes("Disparo"))?.price || 0;
  const extraBoardsCost = (kanbans || 0) * boardAddOnPrice;
  const extraMembersCost = (members || 0) * memberAddOnPrice;
  const extraTriggersCost = (triggers || 0) * triggerAddOnPrice;
  const finalValue =
    basePrice + extraBoardsCost + extraMembersCost + extraTriggersCost;

  // Função para atualizar recursos
  const handleSubmit = async () => {
    if (!token || !organization?.id) return;
    setIsSubmitting(true);
    try {
      // Adicionar recursos
      if (kanbans > currentKanbans) {
        await subscriptionService.addSlots(token, organization.id, {
          slot_type: "board",
          quantity: kanbans - currentKanbans,
        });
      }
      if (members > currentMembers) {
        await subscriptionService.addSlots(token, organization.id, {
          slot_type: "member",
          quantity: members - currentMembers,
        });
      }
      if (triggers > currentTriggers) {
        await subscriptionService.addSlots(token, organization.id, {
          slot_type: "trigger",
          quantity: triggers - currentTriggers,
        });
      }
      // Remover recursos
      if (kanbans < currentKanbans) {
        await subscriptionService.removeSlots(token, organization.id, {
          slot_type: "board",
          quantity_to_remove: currentKanbans - kanbans,
        });
      }
      if (members < currentMembers) {
        await subscriptionService.removeSlots(token, organization.id, {
          slot_type: "member",
          quantity_to_remove: currentMembers - members,
        });
      }
      if (triggers < currentTriggers) {
        await subscriptionService.removeSlots(token, organization.id, {
          slot_type: "trigger",
          quantity_to_remove: currentTriggers - triggers,
        });
      }
      toast.success("Recursos atualizados com sucesso!");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar recursos.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Configuração dos recursos para renderização dinâmica
  const recursos = [
    {
      key: "kanbans",
      label: "Kanbans adicionais",
      descricao: "Tenha mais quadros Kanban para organizar seu negócio!",
      value: kanbans,
      setValue: setKanbans,
      min: minKanbans,
      current: currentKanbans,
      planValue: plan?.max_boards,
    },
    {
      key: "members",
      label: "Membros adicionais",
      descricao: "Adicione mais membros à sua equipe e colabore melhor!",
      value: members,
      setValue: setMembers,
      min: minMembers,
      current: currentMembers,
      planValue: plan?.max_team_members,
    },
    {
      key: "triggers",
      label: "Disparos adicionais",
      descricao: "Aumente o número de disparos e alcance mais clientes!",
      value: triggers,
      setValue: setTriggers,
      min: minTriggers,
      current: currentTriggers,
      planValue: plan?.max_triggers,
    },
  ];

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setConfirmation(confirmMessage);
      }}
    >
      <div className="flex flex-col gap-8">
        {recursos.map((recurso) => (
          <label key={recurso.key} className="flex flex-col gap-1">
            <span className="font-medium">{recurso.label}</span>
            <div className="text-xs text-purple-700 mb-3 font-semibold">
              {recurso.descricao}
            </div>
            <div className="flex items-center justify-between ">
              <div className="flex  items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    recurso.setValue(Math.max(recurso.value - 1, recurso.min))
                  }
                  disabled={recurso.value <= recurso.min}
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  -
                </button>
                <span className="w-8 text-center">{recurso.value}</span>
                <button
                  type="button"
                  onClick={() => recurso.setValue(recurso.value + 1)}
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 ml-2">
                Plano: {recurso.planValue} | Adicionais atuais:{" "}
                {recurso.current} {" | "}
                <span className="text-xs text-blue-700 text-center mt-1">
                  Adicionais atualizados: <b>{recurso.value}</b>
                </span>
              </p>
            </div>
          </label>
        ))}
      </div>
      {/* Valor final */}
      <div className="border-t border-b border-gray-200 py-6 my-6 text-center flex flex-col items-center gap-2">
        <span className="text-base text-gray-700 dark:text-gray-200">
          Valor final da assinatura:
        </span>
        <div className="flex items-center gap-1 justify-center mt-1">
          {valorAtual !== finalValue ? (
            <span className="text-xl font-semibold text-gray-400 line-through decoration-dashed">
              {formatCurrency(valorAtual)}
            </span>
          ) : null}
          <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {formatCurrency(finalValue)}
          </span>
          <span className="text-base font-medium text-gray-500">/mês</span>
        </div>
      </div>
      <div className="flex justify-between gap-6 mt-8 mb-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (!isAdding && !isRemoving)}
          className={`px-6 py-3 rounded-lg transition-colors flex items-center font-semibold ${confirmClass}`}
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
          {confirmText}
        </button>
      </div>
      {confirmation.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg flex flex-col gap-2">
          <span>
            {confirmation.map((message) => (
              <p>{message}</p>
            ))}
          </span>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setConfirmation([])}
            >
              Voltar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
