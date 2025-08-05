import React, { useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bot,
  Trello,
  DollarSign,
  FileText,
  Users,
  MessageSquare,
  MessageCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Tag,
  UserPlus,
  LayoutDashboard,
  CreditCard,
  Bookmark,
  Globe,
  User,
  Settings,
  LogOut,
  X,
  Webhook,
  Crown,
  Link,
  HelpCircle,
} from "lucide-react";
import { TagList } from "../tags/TagList";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { ProfileModal } from "../../components/ProfileModal";
import { ProtectedLink } from "../ProtectedLink";
import { OrganizationRequiredModal } from "../OrganizationRequiredModal";
import { useOrganizationAccess } from "../../hooks/useOrganizationAccess";
import { useChatStore } from "../../store/chatStore";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  exact?: boolean;
  isNew?: boolean;
  requiresOrganization?: boolean;
  requiresPermission?: string;
}

interface SidebarSectionProps {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}

const SidebarSection = ({
  title,
  collapsed,
  children,
}: SidebarSectionProps) => {
  return (
    <div className="mb-4">
      {!collapsed && (
        <h2 className="px-4 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

const NewTag = () => (
  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
    Novo
  </span>
);

const SidebarLink = ({
  to,
  icon,
  label,
  collapsed,
  exact = false,
  isNew = false,
  requiresOrganization = false,
  requiresPermission,
}: SidebarLinkProps) => {
  const location = useLocation();
  const { checkAccess } = useOrganizationAccess();
  const { hasPermission } = useAuthStore();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  const hasAccess = checkAccess(to);
  const hasRequiredPermission = requiresPermission
    ? hasPermission(requiresPermission)
    : true;

  const linkClassName = `flex items-center ${
    collapsed ? "justify-center py-4" : ""
  } px-4 py-3 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors duration-200 text-[18px] ${
    isActive
      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-4 border-primary-500 shadow-sm"
      : ""
  } ${!hasRequiredPermission ? "opacity-50 cursor-not-allowed" : ""}`;

  const linkContent = (
    <>
      <span className={collapsed ? "text-[22px]" : "mr-3"}>{icon}</span>
      {!collapsed && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
            <span>{label}</span>
            {isNew && <NewTag />}
          </div>
          {requiresOrganization && !hasAccess && (
            <div className="flex items-center ml-2 flex-shrink-0">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-amber-500 ml-1 font-bold">
                PRO
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (requiresOrganization && !hasAccess) {
    return (
      <ProtectedLink
        to={to}
        className={linkClassName}
        title={collapsed ? `${label} (Requer Plano)` : undefined}
      >
        {linkContent}
      </ProtectedLink>
    );
  }

  if (!hasRequiredPermission) {
    return (
      <div
        className={linkClassName}
        title={collapsed ? `${label} (Sem permissão)` : undefined}
      >
        {linkContent}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={linkClassName}
      title={collapsed ? label : undefined}
    >
      {linkContent}
    </NavLink>
  );
};

// Componente para o chat modal
import { useState as useModalState } from "react";

// Modal do menu do perfil do usuário
interface ProfileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  name: string;
  photo: string | null;
  plan: string;
  user: any;
}

function ProfileMenuModal({
  isOpen,
  onClose,
  onEditProfile,
  onLogout,
  name,
  photo,
  plan,
  organization,
  user,
}: ProfileMenuModalProps & { organization: any }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const totalDisparos =
    (organization?.extra_triggers || 0) +
    (organization?.one_time_triggers || 0);

  return (
    <>
      <div className="modal-container z-50" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-800 rounded-xl shadow-2xl z-[99999] w-80 overflow-hidden">
        {/* Cabeçalho do modal */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Menu do Usuário
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informações do usuário */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#7f00ff]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#7f00ff]/10 flex items-center justify-center">
                <User className="w-6 h-6 text-[#7f00ff]" />
              </div>
            )}
            <div className="ml-4">
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {name}
              </p>
              <p className="text-base font-medium text-purple-600 dark:text-purple-400">
                {plan}
              </p>
              <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">
                Disparos disponíveis: {totalDisparos}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de opções */}
        <div className="p-2">
          <button
            onClick={() => {
              onEditProfile();
              onClose();
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center"
          >
            <User className="w-5 h-5 mr-3 text-[#7f00ff]" />
            Editar Perfil
          </button>

          {/* Só mostra o botão de planos se o usuário for MASTER ou não tiver organizationId */}
          {(user.role === "MASTER" || !user?.organization_id) && (
            <button
              onClick={() => {
                navigate("/dashboard/plans");
                onClose();
              }}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center"
            >
              <CreditCard className="w-5 h-5 mr-3 text-[#7f00ff]" />
              Upgrade do plano
            </button>
          )}

          <button
            onClick={() => {
              navigate("/dashboard/settings");
              onClose();
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center"
          >
            <Settings className="w-5 h-5 mr-3 text-[#7f00ff]" />
            Configurações
          </button>

          <button
            onClick={() => {
              navigate("/dashboard/help");
              onClose();
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center"
          >
            <HelpCircle className="w-5 h-5 mr-3 text-[#7f00ff]" />
            Ajuda
          </button>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { checkAccess, hasOrganization } = useOrganizationAccess();
  const [showTags, setShowTags] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const { theme } = useThemeStore();

  const { user, organization } = useAuthStore((state) => ({
    user: state.user,
    organization: state.organization,
  }));
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { openChat } = useChatStore();

  const planName = organization?.plan?.name || "Plano Básico";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((state) => state.logout);

  const logoUrl =
    theme === "dark"
      ? collapsed
        ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT-SMALL.png"
        : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png"
      : collapsed
      ? "/assets/images/LOGO-DARK-SMALL.webp"
      : "/assets/images/LOGO-DARK.webp";

  return (
    <>
      <aside
        className={`
        ${
          collapsed
            ? "w-20 min-w-[5rem] rounded-[50px]"
            : "w-[360px] min-w-[360px]"
        }
        bg-white dark:bg-dark-80
        text-gray-800 dark:text-gray-100
        flex flex-col
        p-2
        ml-5
        mt-5
        shadow-lg
        overflow-hidden
        rounded-[20px]
        h-[calc(100%-2.5rem)]
        transition-all duration-300
        ${isProfileModalOpen ? "relative z-40" : ""}
      `}
      >
        <div
          className={`
          flex 
          ${
            collapsed
              ? "flex-col items-center mt-6"
              : "items-center justify-between"
          } 
          h-21
          border-b border-gray-100 dark:border-dark-700 
          px-4
        `}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className={`
              ${collapsed ? "h-10 w-auto" : "h-6 w-auto max-w-[180px]"} 
              mb-5 
              ${collapsed ? "" : "mt-4"}
              object-contain
              border-none
            `}
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              p-2
              rounded-lg 
              hover:bg-gray-100 dark:hover:bg-dark-700 
              text-gray-600 dark:text-gray-400 
              ${collapsed ? "mb-5" : ""}
              transition-colors
            `}
          >
            {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          </button>
        </div>

        <div className="flex flex-col flex-1 justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <nav className={`${collapsed ? "mt-2" : "mt-6"} flex-1`}>
            {/* Perfil e Pergunte à IA - Novos botões */}
            <div className={`${collapsed ? "space-y-3" : "space-y-1"} mb-4`}>
              {/* Botão de Perfil com Menu Modal */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(true)}
                  className={`
                    flex items-center 
                    ${collapsed ? "justify-center py-3" : "px-4 py-3"} 
                    w-full
                    text-gray-700 dark:text-gray-400 
                    bg-purple-50 dark:bg-purple-900/10
                    hover:bg-purple-100 dark:hover:bg-purple-900/20
                    transition-colors duration-200 text-[18px]
                    rounded-lg
                  `}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || "Usuário"}
                      className={`${
                        collapsed ? "w-10 h-10" : "w-9 h-9 mr-3"
                      } rounded-full object-cover border-2 border-[#7f00ff]`}
                    />
                  ) : (
                    <div
                      className={`${
                        collapsed ? "w-10 h-10" : "w-9 h-9 mr-3"
                      } rounded-full bg-[#7f00ff]/10 flex items-center justify-center`}
                    >
                      <User
                        className={`${
                          collapsed ? "w-5 h-5" : "w-5 h-5"
                        } text-[#7f00ff]`}
                      />
                    </div>
                  )}
                  {!collapsed && (
                    <div className="flex flex-col items-start">
                      <span className="text-base font-medium">
                        {user?.name || "Usuário"}
                      </span>
                      <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        {planName}
                      </span>
                    </div>
                  )}
                </button>
              </div>

              <button
                onClick={openChat}
                className={`
                  flex items-center 
                  ${collapsed ? "justify-center py-3" : "px-4 py-3"} 
                  w-full
                  text-gray-700 dark:text-gray-400 
                  bg-purple-50 dark:bg-purple-900/10
                  hover:bg-purple-100 dark:hover:bg-purple-900/20
                  transition-colors duration-200 text-[18px]
                  rounded-lg
                `}
              >
                <img
                  src="/assets/images/pergunte-a-IA.webp"
                  alt="IA"
                  className={`${collapsed ? "w-6 h-6" : "w-6 h-6 mr-3"}`}
                />
                {!collapsed && (
                  <span className="text-base font-medium">Pergunte à IA</span>
                )}
              </button>
            </div>

            {/* Geral */}
            <SidebarSection title="Geral" collapsed={collapsed}>
              <SidebarLink
                to="/dashboard"
                icon={<LayoutDashboard size={22} />}
                label="Dashboard"
                collapsed={collapsed}
                exact
              />
              {(user?.role === "MASTER" || !user?.organization_id) && (
                <SidebarLink
                  to="/dashboard/plans"
                  icon={<CreditCard size={22} />}
                  label="Assinaturas"
                  collapsed={collapsed}
                />
              )}
              <SidebarLink
                to="/dashboard/calendar"
                icon={<Calendar size={22} />}
                label="Calendário"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="calendar:read"
              />
            </SidebarSection>

            {/* Comunicação */}
            <SidebarSection title="Comunicação" collapsed={collapsed}>
              <SidebarLink
                to="/dashboard/conversations"
                icon={<MessageCircle size={22} />}
                label="Conversas"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="whatsapp:read"
              />
              <SidebarLink
                to="/dashboard/messaging"
                icon={<MessageSquare size={22} />}
                label="Disparo"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="dispatch:read"
              />
            </SidebarSection>

            {/* Gestão */}
            <SidebarSection title="Gestão" collapsed={collapsed}>
              <SidebarLink
                to="/dashboard/clients"
                icon={<Trello size={22} />}
                label="Gestão de funil"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="boards:read"
              />
              <SidebarLink
                to="/dashboard/team"
                icon={<Users size={22} />}
                label="Equipe"
                collapsed={collapsed}
                requiresOrganization={true}
              />
            </SidebarSection>

            {/* Financeiro */}
            <SidebarSection title="Financeiro" collapsed={collapsed}>
              <SidebarLink
                to="/dashboard/financial"
                icon={<DollarSign size={22} />}
                label="Financeiro"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="finance:read"
              />
              <SidebarLink
                to="/dashboard/contracts"
                icon={<FileText size={22} />}
                label="Contratos"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="contracts:read"
              />
            </SidebarSection>

            {/* Avançado */}
            <SidebarSection title="Avançado" collapsed={collapsed}>
              <SidebarLink
                to="/dashboard/embed-pages"
                icon={<Globe size={22} />}
                label="Páginas Embed"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="embed:read"
              />
              <SidebarLink
                to="/dashboard/connections"
                icon={<Link size={22} />}
                label="Conexões"
                collapsed={collapsed}
                requiresOrganization={true}
                requiresPermission="whatsapp:read"
              />
            </SidebarSection>
          </nav>

          <div className="mt-auto mb-6">
            {!collapsed && (
              <>
                <div className="px-4 mb-4">
                  <button
                    onClick={() => {
                      if (!hasOrganization) {
                        setShowOrgModal(true);
                        return;
                      }
                      setShowTags(!showTags);
                    }}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-[16px]"
                  >
                    <Bookmark size={22} className="mr-3" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      Marcadores
                    </span>
                    {!hasOrganization && (
                      <span className="flex items-center ml-2 flex-shrink-0">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] text-amber-500 ml-1 font-bold">
                          PRO
                        </span>
                      </span>
                    )}
                    <ChevronRight
                      size={22}
                      className={`ml-auto transform transition-transform ${
                        showTags ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {showTags && hasOrganization && (
                    <div className="mt-2 space-y-2">
                      <TagList
                        blockNewTag={!hasOrganization}
                        onBlockNewTag={() => setShowOrgModal(true)}
                      />
                    </div>
                  )}
                </div>
                <OrganizationRequiredModal
                  isOpen={showOrgModal}
                  onClose={() => setShowOrgModal(false)}
                />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Modais */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <ProfileMenuModal
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onLogout={() => {
          logout();
        }}
        name={user?.name || "Usuário"}
        photo={user?.avatar_url || null}
        plan={planName}
        organization={organization}
        user={user}
      />
    </>
  );
}
