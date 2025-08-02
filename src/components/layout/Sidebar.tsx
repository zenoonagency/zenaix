import React, { useState, useRef, useEffect } from "react";
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
  Send,
  Webhook,
  Crown,
  Link,
} from "lucide-react";
import { TagList } from "../tags/TagList";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { ProfileModal } from "../../components/ProfileModal";
import { ProtectedLink } from "../ProtectedLink";
import { OrganizationRequiredModal } from "../OrganizationRequiredModal";
import { useOrganizationAccess } from "../../hooks/useOrganizationAccess";

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

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ChatModal({ isOpen, onClose }: ChatModalProps) {
  useEffect(() => {
    if (isOpen) {
      function typeWriter(element: HTMLElement, text: string, delay = 50) {
        let i = 0;
        function type() {
          if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, delay);
          }
        }
        type();
      }

      function sendMessage() {
        const chatInput = document.getElementById(
          "chat-input"
        ) as HTMLInputElement;
        const chatMessages = document.getElementById("chat-messages");

        if (chatInput && chatMessages && chatInput.value.trim() !== "") {
          const message = chatInput.value;
          const userMessageWrapper = document.createElement("div");
          userMessageWrapper.classList.add("user-message-wrapper");
          const userMessage = document.createElement("div");
          userMessage.classList.add("user-message");
          userMessage.innerHTML = message;
          userMessageWrapper.appendChild(userMessage);
          chatMessages.appendChild(userMessageWrapper);
          chatInput.value = "";
          chatMessages.scrollTop = chatMessages.scrollHeight;

          const typingIndicator = document.createElement("div");
          typingIndicator.classList.add("typing-indicator");
          typingIndicator.innerHTML =
            'IA está digitando<span class="dot-flashing"></span><span class="dot-flashing"></span><span class="dot-flashing"></span>';
          chatMessages.appendChild(typingIndicator);
          chatMessages.scrollTop = chatMessages.scrollHeight;

          fetch(
            "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/c0bf5d3e-e3a4-4d66-aec6-6edcc9c6a666/chat",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: message,
              }),
            }
          )
            .then((response) => response.json())
            .then((data) => {
              const agentResponse = data.output || "Resposta não encontrada";
              const typingDelay = Math.min(
                Math.max(agentResponse.length * 50, 500),
                3000
              );

              setTimeout(() => {
                typingIndicator.remove();

                const aiWrapper = document.createElement("div");
                aiWrapper.classList.add("ai-response-wrapper");

                const aiImage = document.createElement("img");
                aiImage.src =
                  "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT-SMALL.png";
                aiImage.alt = "IA";
                aiImage.classList.add("ai-profile-pic");

                const aiResponse = document.createElement("div");
                aiResponse.classList.add("ai-response");
                aiWrapper.appendChild(aiImage);
                aiWrapper.appendChild(aiResponse);

                chatMessages.appendChild(aiWrapper);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                typeWriter(aiResponse, agentResponse, 30);
              }, typingDelay);
            })
            .catch((error) => {
              console.error("Erro ao enviar mensagem:", error);
              typingIndicator.remove();
              chatMessages.innerHTML +=
                "<p><strong>Erro:</strong> Não foi possível obter uma resposta.</p>";
            });
        }
      }

      const chatMessages = document.getElementById("chat-messages");
      if (chatMessages) {
        chatMessages.innerHTML = "";
      }

      const chatInput = document.getElementById("chat-input");
      const sendBtn = document.getElementById("send-btn");

      // Remover event listeners antigos se existirem
      const newChatInput = chatInput?.cloneNode(true);
      const newSendBtn = sendBtn?.cloneNode(true);

      if (chatInput && chatInput.parentNode && newChatInput) {
        chatInput.parentNode.replaceChild(newChatInput, chatInput);
      }

      if (sendBtn && sendBtn.parentNode && newSendBtn) {
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
      }

      const updatedChatInput = document.getElementById("chat-input");
      const updatedSendBtn = document.getElementById("send-btn");
      const updatedChatMessages = document.getElementById("chat-messages");

      if (updatedChatInput && updatedSendBtn && updatedChatMessages) {
        updatedChatInput.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            sendMessage();
          }
        });

        updatedSendBtn.addEventListener("click", sendMessage);

        const aiWrapper = document.createElement("div");
        aiWrapper.classList.add("ai-response-wrapper");

        const aiImage = document.createElement("img");
        aiImage.src =
          "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT-SMALL.png";
        aiImage.alt = "IA";
        aiImage.classList.add("ai-profile-pic");

        const aiResponse = document.createElement("div");
        aiResponse.classList.add("ai-response");
        aiResponse.innerText = "Olá, converse comigo";

        aiWrapper.appendChild(aiImage);
        aiWrapper.appendChild(aiResponse);

        updatedChatMessages.appendChild(aiWrapper);
        updatedChatMessages.scrollTop = updatedChatMessages.scrollHeight;

        // Focar o input automaticamente
        updatedChatInput.focus();
      }
    }

    // Cleanup function quando o componente é desmontado ou isOpen muda
    return () => {
      const chatInput = document.getElementById("chat-input");
      const sendBtn = document.getElementById("send-btn");

      if (chatInput) {
        const newChatInput = chatInput.cloneNode(true);
        if (chatInput.parentNode) {
          chatInput.parentNode.replaceChild(newChatInput, chatInput);
        }
      }

      if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        if (sendBtn.parentNode) {
          sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-container">
      <div className="rounded-lg pt-16 shadow-lg w-full max-w-2xl h-[700px] relative bg-white text-black glass-effect">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
        >
          Fechar
        </button>
        <div id="chat-container" className="mt-20">
          <div id="chat-box">
            <div id="chat-messages"></div>
            <div id="input-container">
              <input
                type="text"
                id="chat-input"
                placeholder="Concerse com a IA"
              />
              <div className="input-actions">
                <button id="send-btn">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

          #chat-messages {
            height: 500px;
            overflow-y: scroll;
            background-color: transparent;
            padding: 10px;
            margin-bottom: 10px;
            color: #343a40;
            animation: slideIn 0.5s ease-in-out;
            scrollbar-width: thin;
            scrollbar-color: rgba(121, 121, 121, 0.5) transparent;
          }

          #chat-messages::-webkit-scrollbar {
            width: 8px;
          }

          #chat-messages::-webkit-scrollbar-track {
            background: transparent;
          }

          #chat-messages::-webkit-scrollbar-thumb {
            background: rgba(121, 121, 121, 0.5);
            border-radius: 4px;
          }

          #chat-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(121, 121, 121, 0.7);
          }

          #chat-messages::-webkit-scrollbar-button {
            width: 0;
            height: 0;
            display: none;
          }

          .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          #chat-container {
            width: 600px;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #343a40;
            font-family: 'Roboto', sans-serif;
            position: relative;
            z-index: 1;
            overflow: hidden;
            animation: fadeIn 0.5s ease-in-out;
          }

          #chat-box {
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          #chat-messages .user-message-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
          }

          #chat-messages .user-message {
            background-color: #7f00ff;
            color: white;
            padding: 10px;
            border-radius: 5px;
            max-width: 70%;
            word-wrap: break-word;
            overflow-wrap: break-word;
            position: relative;
            animation: slideInRight 0.3s ease-in-out;
          }

          #chat-messages .ai-response-wrapper {
            display: flex;
            align-items: flex-start;
            margin: 10px 0;
          }

          .ai-profile-pic {
            width: 30px;
            height: 30px;
            margin-top: 10px;
            margin-right: 10px;
            animation: fadeIn 0.3s ease-in-out;
          }

          .ai-response {
            background-color: #f0e6ff;
            border-radius: 5px;
            padding: 15px;
            color: #343a40;
            flex: 1;
            font-family: 'Roboto', sans-serif;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            animation: slideInLeft 0.3s ease-in-out;
          }

          .ai-response strong {
            color: #343a40;
          }

          #input-container {
            display: flex;
            align-items: center;
            background-color: #fff;
            border: 1px solid #dee2e6;
            padding: 5px 10px;
            position: relative;
            margin: 0 5px;
            border-radius: 10px;
            animation: slideInUp 0.5s ease-in-out;
          }

          #chat-input {
            flex: 1;
            padding: 10px;
            border: none;
            background-color: transparent;
            color: #343a40;
            font-family: 'Roboto', sans-serif;
            outline: none;
          }

          .input-actions {
            display: flex;
            align-items: center;
          }

          #send-btn {
            background-color: #7f00ff;
            color: white;
            border: none;
            padding: 10px;
            margin-left: 10px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease;
            width: 40px;
            height: 40px;
          }

          #send-btn i, #send-btn svg {
            font-size: 20px;
          }

          #send-btn:hover {
            background-color: #6700dc;
          }

          .typing-indicator {
            margin: 10px 0;
            font-style: italic;
            color: #6c757d;
            animation: fadeIn 0.3s ease-in-out;
          }

          .dot-flashing {
            display: inline-block;
            width: 8px;
            height: 8px;
            margin-left: 2px;
            border-radius: 50%;
            background-color: #6c757d;
            animation: dotFlashing 1s infinite;
          }

          .copy-btn:hover {
            background-color: #5a00b3;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideIn {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideInRight {
            from {
              transform: translateX(20px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideInLeft {
            from {
              transform: translateX(-20px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideInUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes dotFlashing {
            0% { background-color: #6c757d; }
            50% { background-color: #ccc; }
            100% { background-color: #6c757d; }
          }
        `}
      </style>
    </div>
  );
}

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
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const planName = organization?.plan?.name || "Plano Básico";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((state) => state.logout);

  const logoUrl =
    theme === "dark"
      ? collapsed
        ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT-SMALL.png"
        : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png"
      : collapsed
      ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK-SMALL.png"
      : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK.png";

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
                onClick={() => setIsChatModalOpen(true)}
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
                  src="https://zenaix.com.br/wp-content/uploads/2025/03/pergunte-a-IA.webp"
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
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
      <ProfileMenuModal
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onLogout={() => {
          logout();
          navigate("/login");
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
