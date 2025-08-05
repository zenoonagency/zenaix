import React, { useState } from "react";
import { Link, LinkProps } from "react-router-dom";
import { useOrganizationAccess } from "../hooks/useOrganizationAccess";
import { OrganizationRequiredModal } from "./OrganizationRequiredModal";

interface ProtectedLinkProps extends Omit<LinkProps, "to"> {
  to: string;
  children: React.ReactNode;
  className?: string;
  forceProtection?: boolean; // Para forçar proteção mesmo em rotas permitidas
}

export function ProtectedLink({
  to,
  children,
  className,
  forceProtection = false,
  ...props
}: ProtectedLinkProps) {
  const { checkAccess } = useOrganizationAccess();
  const [showModal, setShowModal] = useState(false);

  const hasAccess = forceProtection ? false : checkAccess(to);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };

  return (
    <>
      <Link to={to} className={className} onClick={handleClick} {...props}>
        {children}
      </Link>

      <OrganizationRequiredModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
