import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { Modal } from "./Modal";
import { useLocation, useNavigate } from "react-router-dom";

const PLAN_MODAL_SESSION_KEY = "plan-modal-shown";

export function PlanModalGlobal() {
  const { isAuthenticated, user, organization } = useAuthStore();
  const [show, setShow] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const alreadyShown =
      sessionStorage.getItem(PLAN_MODAL_SESSION_KEY) === "true";

    const hasPlanActive = organization.subscription_status === "ACTIVE";

    const shouldShowModal = isAuthenticated && !alreadyShown && !hasPlanActive;

    setShow(shouldShowModal);
  }, [isAuthenticated, user, organization]);

  if (location.pathname.includes("/dashboard/plans")) {
    return null;
  }

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem(PLAN_MODAL_SESSION_KEY, "true");
  };

  const goToPlans = () => {
    handleClose();
    navigate("/dashboard/plans");
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Assine um Plano para Usar os Recursos"
    >
      <div className="space-y-4">
        <p>
          Para aceder a todos os recursos da plataforma, é necessário assinar um
          plano.
        </p>
        <p>
          Clique no botão abaixo para conhecer os nossos planos e escolher o
          melhor para si.
        </p>
        <button
          className="w-full mt-2 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
          onClick={goToPlans}
        >
          Conhecer os nossos planos
        </button>
      </div>
    </Modal>
  );
}
