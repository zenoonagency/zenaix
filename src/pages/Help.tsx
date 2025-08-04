import React, { useState } from "react";
import {
  ChevronLeft,
  Lightbulb,
  Book,
  Video,
  Coffee,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Star,
  MessageSquare,
  UserPlus,
  Users,
  LineChart,
  MessageCircle,
  Smile,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";
import { ContactModal, ContactData } from "../components/ContactModal";
import { useContactHook, ContactFormData } from "../hooks/useContactHook";
import { FeedbackMessage } from "../components/FeedbackMessage";
import { useToast } from "../hooks/useToast";

// Tipo para os dados do tutorial em vídeo
interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  category: "basics" | "advanced" | "messaging";
  icon?: React.ReactNode;
}

// Dados dos vídeos de tutoriais (substituir com vídeos reais depois)
const tutorialVideos: TutorialVideo[] = [
  {
    id: "intro",
    title: "Introdução ao sistema Zenaix",
    description:
      "Conheça as principais funcionalidades e recursos do sistema Zenaix",
    youtubeId: "dQw4w9WgXcQ", // Substituir por ID real
    duration: "3:25",
    category: "basics",
    icon: <Info className="w-5 h-5" />,
  },
  {
    id: "messaging",
    title: "Como usar o disparo em massa",
    description:
      "Aprenda a configurar e enviar mensagens em massa pelo WhatsApp",
    youtubeId: "9bZkp7q19f0", // Substituir por ID real
    duration: "5:40",
    category: "messaging",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    id: "contacts",
    title: "Gerenciamento de contatos e importação",
    description:
      "Como importar, organizar e gerenciar seus contatos no sistema",
    youtubeId: "jNQXAC9IVRw", // Substituir por ID real
    duration: "4:12",
    category: "basics",
    icon: <UserPlus className="w-5 h-5" />,
  },
  {
    id: "funnel",
    title: "Configurando seu funil de vendas",
    description:
      "Passo a passo para configurar e personalizar seu funil de vendas",
    youtubeId: "J---aiyznGQ", // Substituir por ID real
    duration: "7:30",
    category: "advanced",
    icon: <LineChart className="w-5 h-5" />,
  },
  {
    id: "ai-assistant",
    title: "Usando o assistente de IA",
    description:
      "Como aproveitar ao máximo o assistente de inteligência artificial",
    youtubeId: "QH2-TGUlwu4", // Substituir por ID real
    duration: "6:15",
    category: "advanced",
    icon: <Star className="w-5 h-5" />,
  },
  {
    id: "team",
    title: "Gerenciando sua equipe",
    description: "Como adicionar, remover e gerenciar membros da sua equipe",
    youtubeId: "oHg5SJYRHA0", // Substituir por ID real
    duration: "4:45",
    category: "basics",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "templates",
    title: "Criando templates para mensagens",
    description: "Como criar templates personalizados para suas mensagens",
    youtubeId: "oavMtUWDBTM", // Substituir por ID real
    duration: "5:20",
    category: "messaging",
    icon: <MessageSquare className="w-5 h-5" />,
  },
];

// Componente de acordo (sanfona) para um vídeo
function VideoAccordion({ video }: { video: TutorialVideo }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div
      className={`border ${
        isDark ? "border-dark-700" : "border-gray-200"
      } rounded-lg mb-3 overflow-hidden transition-all`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 text-left ${
          isDark
            ? isOpen
              ? "bg-dark-700"
              : "bg-dark-800 hover:bg-dark-750"
            : isOpen
            ? "bg-gray-100"
            : "bg-white hover:bg-gray-50"
        } transition-colors`}
      >
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              isDark ? "bg-[#7f00ff]/20" : "bg-[#7f00ff]/10"
            }`}
          >
            {video.icon || (
              <Video
                className={`${isDark ? "text-[#7f00ff]/80" : "text-[#7f00ff]"}`}
              />
            )}
          </div>
          <div>
            <h3
              className={`font-medium ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              {video.title}
            </h3>
            <p
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-600"
              } mt-0.5`}
            >
              <span className="inline-flex items-center">
                <Video className="w-3 h-3 mr-1" />
                {video.duration}
              </span>
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp
            className={`w-5 h-5 ${
              isDark ? "text-gray-400" : "text-gray-600"
            } transition-transform duration-300`}
          />
        ) : (
          <ChevronDown
            className={`w-5 h-5 ${
              isDark ? "text-gray-400" : "text-gray-600"
            } transition-transform duration-300`}
          />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-[600px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div
          className={`p-4 ${
            isDark
              ? "bg-dark-850 border-t border-dark-700"
              : "bg-white border-t border-gray-200"
          }`}
        >
          <p
            className={`mb-4 ${
              isDark ? "text-gray-300" : "text-gray-700"
            } text-sm`}
          >
            {video.description}
          </p>
          <div
            className="rounded-lg overflow-hidden shadow-md"
            style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            ></iframe>
          </div>
          <div className="mt-3 flex justify-end">
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-3 py-1.5 rounded-lg ${
                isDark
                  ? "bg-dark-700 hover:bg-dark-650 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              } text-sm transition-colors`}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Ver no YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de abas para categorias de vídeos
function VideoTabs({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const categories = [
    { id: "all", label: "Todos" },
    { id: "basics", label: "Básicos" },
    { id: "messaging", label: "Mensagens" },
    { id: "advanced", label: "Avançados" },
  ];

  return (
    <div className="mb-6">
      <div
        className={`flex border-b ${
          isDark ? "border-dark-700" : "border-gray-200"
        }`}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`py-2 px-4 font-medium text-sm border-b-2 -mb-px transition-colors ${
              activeCategory === category.id
                ? `border-[#7f00ff] ${
                    isDark ? "text-[#7f00ff]" : "text-[#7f00ff]"
                  }`
                : `border-transparent ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-600 hover:text-gray-800"
                  }`
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Help() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { showToast } = useToast();
  const { isLoading, sendContactForm } = useContactHook();

  // Estado para controlar qual seção está ativa
  const [activeSection, setActiveSection] = useState<
    "videos" | "service" | "feedback"
  >("videos");
  // Estado para controlar qual categoria de vídeo está ativa
  const [activeCategory, setActiveCategory] = useState("all");
  // Estado para o modal de contato
  const [showContactModal, setShowContactModal] = useState(false);
  // Estado para tipos de formulários
  const [contactType, setContactType] = useState<"service" | "feedback">(
    "service"
  );
  // Estado para as mensagens de feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Estados para os formulários
  const [serviceFormData, setServiceFormData] = useState({
    tipo: "service" as const,
    tipoServico: "",
    detalhes: "",
    prioridade: "Baixa",
  });

  const [feedbackFormData, setFeedbackFormData] = useState({
    tipo: "feedback" as const,
    tipoFeedback: "",
    mensagem: "",
    avaliacao: 0,
  });

  // Filtra vídeos com base na categoria selecionada
  const filteredVideos =
    activeCategory === "all"
      ? tutorialVideos
      : tutorialVideos.filter((video) => video.category === activeCategory);

  // Função para lidar com as mudanças no formulário de serviço
  const handleServiceFormChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setServiceFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função para lidar com as mudanças no formulário de feedback
  const handleFeedbackFormChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFeedbackFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função para definir a prioridade no formulário de serviço
  const handlePriorityChange = (prioridade: string) => {
    setServiceFormData((prev) => ({
      ...prev,
      prioridade,
    }));
  };

  // Função para definir a avaliação no formulário de feedback
  const handleRatingChange = (avaliacao: number) => {
    setFeedbackFormData((prev) => ({
      ...prev,
      avaliacao,
    }));
  };

  // Função para abrir o modal de contato ao enviar um formulário
  const handleSubmitServiceForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceFormData.tipoServico) {
      showToast("Por favor, selecione o tipo de serviço", "error");
      return;
    }

    if (!serviceFormData.detalhes.trim()) {
      showToast("Por favor, descreva os detalhes da sua solicitação", "error");
      return;
    }

    setContactType("service");
    setShowContactModal(true);
  };

  const handleSubmitFeedbackForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackFormData.tipoFeedback) {
      showToast("Por favor, selecione o tipo de feedback", "error");
      return;
    }

    if (!feedbackFormData.mensagem.trim()) {
      showToast("Por favor, escreva sua mensagem", "error");
      return;
    }

    setContactType("feedback");
    setShowContactModal(true);
  };

  // Função para processar o envio final com os dados de contato
  const handleContactSubmit = async (contactData: ContactData) => {
    const formData =
      contactType === "service" ? serviceFormData : feedbackFormData;

    try {
      const result = await sendContactForm(contactData, formData);

      if (result.success) {
        setFeedbackMessage({
          type: "success",
          message:
            contactType === "service"
              ? "Solicitação de serviço enviada com sucesso! Entraremos em contato em breve."
              : "Feedback enviado com sucesso! Agradecemos sua contribuição.",
        });

        // Resetar formulários
        if (contactType === "service") {
          setServiceFormData({
            tipo: "service",
            tipoServico: "",
            detalhes: "",
            prioridade: "Baixa",
          });
        } else {
          setFeedbackFormData({
            tipo: "feedback",
            tipoFeedback: "",
            mensagem: "",
            avaliacao: 0,
          });
        }

        setShowContactModal(false);
      } else {
        setFeedbackMessage({
          type: "error",
          message:
            "Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.",
        });
      }
    } catch (error) {
      setFeedbackMessage({
        type: "error",
        message:
          "Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.",
      });
    }
  };

  return (
    <div className={`min-h-screen p-6 bg-transparente`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className={`mr-4 p-2 rounded-full ${
              isDark
                ? "bg-gray-800 hover:bg-dark-700 text-gray-400"
                : "bg-white hover:bg-gray-100 text-gray-700"
            } transition-colors shadow-sm`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1
            className={`text-3xl font-bold ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Central de Ajuda
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card para vídeos tutoriais */}
          <div
            className={`rounded-xl p-6 cursor-pointer ${
              activeSection === "videos"
                ? isDark
                  ? "bg-[#7f00ff]/20 border-[#7f00ff]/30"
                  : "bg-[#7f00ff]/10 border-[#7f00ff]/20"
                : isDark
                ? "bg-dark-800 border-dark-700 hover:bg-dark-750"
                : "bg-white border-gray-200 hover:bg-gray-50"
            } border shadow-sm hover:shadow-md transition-all`}
            onClick={() => setActiveSection("videos")}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  activeSection === "videos"
                    ? isDark
                      ? "bg-[#7f00ff]/40"
                      : "bg-[#7f00ff]/20"
                    : isDark
                    ? "bg-[#7f00ff]/20"
                    : "bg-[#7f00ff]/10"
                }`}
              >
                <Video
                  className={`w-8 h-8 ${
                    activeSection === "videos"
                      ? "text-[#7f00ff]"
                      : "text-[#7f00ff]/80"
                  }`}
                />
              </div>
              <h2
                className={`text-xl font-semibold mb-3 ${
                  activeSection === "videos"
                    ? "text-[#7f00ff]"
                    : isDark
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Vídeos tutoriais
              </h2>
              <p
                className={`text-center ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Assista a vídeos explicativos sobre as funcionalidades do
                sistema.
              </p>
            </div>
          </div>

          {/* Card para serviço personalizado */}
          <div
            className={`rounded-xl p-6 cursor-pointer ${
              activeSection === "service"
                ? isDark
                  ? "bg-[#7f00ff]/20 border-[#7f00ff]/30"
                  : "bg-[#7f00ff]/10 border-[#7f00ff]/20"
                : isDark
                ? "bg-dark-800 border-dark-700 hover:bg-dark-750"
                : "bg-white border-gray-200 hover:bg-gray-50"
            } border shadow-sm hover:shadow-md transition-all`}
            onClick={() => setActiveSection("service")}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  activeSection === "service"
                    ? isDark
                      ? "bg-[#7f00ff]/40"
                      : "bg-[#7f00ff]/20"
                    : isDark
                    ? "bg-[#7f00ff]/20"
                    : "bg-[#7f00ff]/10"
                }`}
              >
                <MessageCircle
                  className={`w-8 h-8 ${
                    activeSection === "service"
                      ? "text-[#7f00ff]"
                      : "text-[#7f00ff]/80"
                  }`}
                />
              </div>
              <h2
                className={`text-xl font-semibold mb-3 ${
                  activeSection === "service"
                    ? "text-[#7f00ff]"
                    : isDark
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Serviço personalizado
              </h2>
              <p
                className={`text-center ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Solicite suporte técnico ou um serviço personalizado para seu
                negócio.
              </p>
            </div>
          </div>

          {/* Card para feedback */}
          <div
            className={`rounded-xl p-6 cursor-pointer ${
              activeSection === "feedback"
                ? isDark
                  ? "bg-[#7f00ff]/20 border-[#7f00ff]/30"
                  : "bg-[#7f00ff]/10 border-[#7f00ff]/20"
                : isDark
                ? "bg-dark-800 border-dark-700 hover:bg-dark-750"
                : "bg-white border-gray-200 hover:bg-gray-50"
            } border shadow-sm hover:shadow-md transition-all`}
            onClick={() => setActiveSection("feedback")}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  activeSection === "feedback"
                    ? isDark
                      ? "bg-[#7f00ff]/40"
                      : "bg-[#7f00ff]/20"
                    : isDark
                    ? "bg-[#7f00ff]/20"
                    : "bg-[#7f00ff]/10"
                }`}
              >
                <Smile
                  className={`w-8 h-8 ${
                    activeSection === "feedback"
                      ? "text-[#7f00ff]"
                      : "text-[#7f00ff]/80"
                  }`}
                />
              </div>
              <h2
                className={`text-xl font-semibold mb-3 ${
                  activeSection === "feedback"
                    ? "text-[#7f00ff]"
                    : isDark
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Feedback e sugestões
              </h2>
              <p
                className={`text-center ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Compartilhe sua opinião e sugira melhorias para o sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo da seção ativa */}
        <div
          className={`rounded-xl p-6 ${
            isDark ? "bg-dark-800 border-dark-700" : "bg-white border-gray-200"
          } border shadow-sm transition-shadow`}
        >
          {activeSection === "videos" && (
            <div>
              <h2
                className={`text-xl font-semibold mb-6 ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                Vídeos tutoriais
              </h2>

              <VideoTabs
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />

              <div>
                {filteredVideos.length > 0 ? (
                  filteredVideos.map((video) => (
                    <VideoAccordion key={video.id} video={video} />
                  ))
                ) : (
                  <div
                    className={`py-6 text-center ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <Video
                      className={`w-12 h-12 mx-auto mb-3 ${
                        isDark ? "text-gray-600" : "text-gray-400"
                      }`}
                    />
                    <p>Nenhum vídeo encontrado nesta categoria.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "service" && (
            <div>
              <h2
                className={`text-xl font-semibold mb-6 ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                Solicitar serviço personalizado
              </h2>

              {feedbackMessage && activeSection === "service" && (
                <FeedbackMessage
                  type={feedbackMessage.type}
                  message={feedbackMessage.message}
                  onClose={() => setFeedbackMessage(null)}
                />
              )}

              <form className="space-y-4" onSubmit={handleSubmitServiceForm}>
                <div>
                  <label
                    className={`block mb-2 text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Tipo de serviço
                  </label>
                  <select
                    name="tipoServico"
                    value={serviceFormData.tipoServico}
                    onChange={handleServiceFormChange}
                    className={`w-full p-3 rounded-lg ${
                      isDark
                        ? "bg-dark-700 border-dark-600 text-gray-300 focus:border-[#7f00ff]/70"
                        : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#7f00ff]"
                    } border outline-none focus:ring-2 focus:ring-[#7f00ff]/20 transition-all`}
                  >
                    <option value="">Selecione o tipo de serviço</option>
                    <option value="Criação de agente de IA">
                      Criação de agente de IA
                    </option>
                    <option value="Integração da IA com o Zenaix">
                      Integração da IA com o Zenaix
                    </option>
                    <option value="Treinamento de equipe">
                      Treinamento de equipe
                    </option>
                    <option value="Serviços de marketing">
                      Serviços de marketing
                    </option>
                    <option value="Criação de sistema">
                      Criação de sistema
                    </option>
                    <option value="Suporte técnico">Suporte técnico</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block mb-2 text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Detalhes da solicitação
                  </label>
                  <textarea
                    name="detalhes"
                    value={serviceFormData.detalhes}
                    onChange={handleServiceFormChange}
                    rows={5}
                    placeholder="Descreva com detalhes o que você precisa..."
                    className={`w-full p-3 rounded-lg ${
                      isDark
                        ? "bg-dark-700 border-dark-600 text-gray-300 focus:border-[#7f00ff]/70 placeholder-gray-500"
                        : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#7f00ff] placeholder-gray-400"
                    } border outline-none focus:ring-2 focus:ring-[#7f00ff]/20 transition-all`}
                  ></textarea>
                </div>

                <div>
                  <label
                    className={`block mb-2 text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Prioridade
                  </label>
                  <div className="flex gap-4">
                    {["Baixa", "Média", "Alta", "Urgente"].map((priority) => (
                      <label key={priority} className="flex items-center">
                        <input
                          type="radio"
                          name="priority"
                          checked={serviceFormData.prioridade === priority}
                          onChange={() => handlePriorityChange(priority)}
                          className="w-4 h-4 text-[#7f00ff] focus:ring-[#7f00ff]/60 mr-2"
                        />
                        <span
                          className={`${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {priority}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceFormData({
                        tipo: "service",
                        tipoServico: "",
                        detalhes: "",
                        prioridade: "Baixa",
                      });
                      setFeedbackMessage(null);
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-dark-700 hover:bg-dark-600 text-gray-300"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    } transition-colors`}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 bg-[#7f00ff] hover:bg-[#8a00ff] text-white rounded-lg transition-colors shadow-md flex items-center justify-center min-w-[120px]`}
                    disabled={isLoading}
                  >
                    {isLoading && contactType === "service" ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar solicitação"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "feedback" && (
            <div>
              <h2
                className={`text-xl font-semibold mb-6 ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                Feedback e sugestões
              </h2>

              {feedbackMessage && activeSection === "feedback" && (
                <FeedbackMessage
                  type={feedbackMessage.type}
                  message={feedbackMessage.message}
                  onClose={() => setFeedbackMessage(null)}
                />
              )}

              <form className="space-y-4" onSubmit={handleSubmitFeedbackForm}>
                <div>
                  <label
                    className={`block mb-2 text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Tipo de feedback
                  </label>
                  <select
                    name="tipoFeedback"
                    value={feedbackFormData.tipoFeedback}
                    onChange={handleFeedbackFormChange}
                    className={`w-full p-3 rounded-lg ${
                      isDark
                        ? "bg-dark-700 border-dark-600 text-gray-300 focus:border-[#7f00ff]/70"
                        : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#7f00ff]"
                    } border outline-none focus:ring-2 focus:ring-[#7f00ff]/20 transition-all`}
                  >
                    <option value="">Selecione o tipo de feedback</option>
                    <option value="Problema">Reportar um problema</option>
                    <option value="Nova funcionalidade">
                      Sugerir uma nova funcionalidade
                    </option>
                    <option value="Melhoria">Sugerir uma melhoria</option>
                    <option value="Elogio">Elogiar</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block mb-2 text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Sua mensagem
                  </label>
                  <textarea
                    name="mensagem"
                    value={feedbackFormData.mensagem}
                    onChange={handleFeedbackFormChange}
                    rows={5}
                    placeholder="Compartilhe suas ideias e opiniões..."
                    className={`w-full p-3 rounded-lg ${
                      isDark
                        ? "bg-dark-700 border-dark-600 text-gray-300 focus:border-[#7f00ff]/70 placeholder-gray-500"
                        : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#7f00ff] placeholder-gray-400"
                    } border outline-none focus:ring-2 focus:ring-[#7f00ff]/20 transition-all`}
                  ></textarea>
                </div>

                <div>
                  <label
                    className={`block mb-2 text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Avaliação geral
                  </label>
                  <div className="flex items-center gap-4">
                    <div className={`flex gap-1 text-2xl`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(star)}
                          className={`focus:outline-none transition-colors ${
                            star <= feedbackFormData.avaliacao
                              ? "text-yellow-400"
                              : isDark
                              ? "text-gray-600"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {feedbackFormData.avaliacao > 0
                        ? `${feedbackFormData.avaliacao} estrela${
                            feedbackFormData.avaliacao !== 1 ? "s" : ""
                          }`
                        : "Clique para avaliar"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackFormData({
                        tipo: "feedback",
                        tipoFeedback: "",
                        mensagem: "",
                        avaliacao: 0,
                      });
                      setFeedbackMessage(null);
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-dark-700 hover:bg-dark-600 text-gray-300"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    } transition-colors`}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 bg-[#7f00ff] hover:bg-[#8a00ff] text-white rounded-lg transition-colors shadow-md flex items-center justify-center min-w-[120px]`}
                    disabled={isLoading}
                  >
                    {isLoading && contactType === "feedback" ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar feedback"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal de contato */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSubmit={handleContactSubmit}
        title={
          contactType === "service"
            ? "Dados para contato"
            : "Seus dados de contato"
        }
        type={contactType}
        formData={
          contactType === "service" ? serviceFormData : feedbackFormData
        }
      />
    </div>
  );
}
