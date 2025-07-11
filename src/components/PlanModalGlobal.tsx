import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Modal } from "./Modal";
import { useLocation } from "react-router-dom";

const PLAN_MODAL_SESSION_KEY = "plan-modal-shown";

function hasActivePlan(organization) {
  // Considera plano ativo se:
  // - organization.planId existe E subscriptionStatus é 'active' (case-insensitive)
  if (
    organization?.planId &&
    String(organization?.subscriptionStatus).toLowerCase() === "active"
  )
    return true;
  return false;
}

export function PlanModalGlobal() {
  const { isAuthenticated, user, organization, fetchAndSyncUser } =
    useAuthStore();
  const [show, setShow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const alreadyShown =
      sessionStorage.getItem(PLAN_MODAL_SESSION_KEY) === "true";
    if (isAuthenticated && !alreadyShown) {
      fetchAndSyncUser().then(() => {
        if (user && !user.organizationId && !hasActivePlan(organization)) {
          setShow(true);
        } else {
          setShow(false);
        }
      });
    } else {
      setShow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Não mostrar a modal se já estiver na tela de planos
  if (location.pathname === "/dashboard/plans") return null;

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem(PLAN_MODAL_SESSION_KEY, "true");
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Assine um Plano para Usar os Recursos"
    >
      <div className="space-y-4">
        <p>
          Para acessar todos os recursos da plataforma, é necessário assinar um
          plano.
        </p>
        <p>
          Clique no botão abaixo para conhecer nossos planos e escolher o melhor
          para você.
        </p>
        <button
          className="w-full mt-2 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
          onClick={() => {
            handleClose();
            window.location.href = "/dashboard/plans";
          }}
        >
          Conheça nossos planos
        </button>
      </div>
    </Modal>
  );
}
