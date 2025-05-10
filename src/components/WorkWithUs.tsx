import { useState, useEffect } from "react";
import {
  Brain,
  Briefcase,
  Code,
  Heart,
  Users,
  ChevronDown,
  Search,
  Send,
  CheckCircle,
  X,
  Check,
  AlertCircle,
  Mail,
} from "lucide-react";
import Head from "next/head";
import { useAuth } from "./useAuth";
import emailjs from "@emailjs/browser";

type FormDataType = {
  nome: string;
  email: string;
  telefone: string;
  curriculo: File | null;
  experiencia: string;
  motivacao: string;
  linkedin: string;
  concordaTermos: boolean;
};

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "error" | null;
  message: string;
}

// Componente NotificationModal implementado diretamente
const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  status,
  message,
}) => {
  // Fecha o modal após 5 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay com backdrop blur */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal container com cores sólidas para evitar transparência */}
      <div
        className={`
          transform transition-all duration-500 ease-out
          ${status === "success" ? "bg-emerald-50" : "bg-rose-50"}
          p-6 rounded-xl shadow-xl w-full max-w-md relative z-10
          border-l-4 ${
            status === "success" ? "border-emerald-500" : "border-rose-500"
          }
        `}
        style={{
          backgroundColor:
            status === "success" ? "rgb(236, 253, 245)" : "rgb(255, 241, 242)",
        }}
      >
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center">
          {/* Ícone animado */}
          <div
            className={`
              flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center
              ${
                status === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-rose-100 text-rose-600"
              }
            `}
          >
            {status === "success" ? (
              <Check className="animate-bounce" size={32} />
            ) : (
              <AlertCircle className="animate-pulse" size={32} />
            )}
          </div>

          {/* Texto da notificação */}
          <div className="ml-5">
            <h3
              className={`
                text-lg font-bold
                ${status === "success" ? "text-emerald-800" : "text-rose-800"}
              `}
            >
              {status === "success" ? "Mensagem Enviada!" : "Erro no Envio"}
            </h3>
            <p
              className={`
                mt-2 text-sm
                ${status === "success" ? "text-emerald-600" : "text-rose-600"}
              `}
            >
              {message ||
                (status === "success"
                  ? "Sua mensagem foi enviada com sucesso. Entraremos em contato em breve!"
                  : "Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.")}
            </p>
          </div>
        </div>

        {/* Botão de ação */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className={`
                w-full py-2 px-4 rounded-lg font-medium text-black hover:bg-emerald-700
                ${
                  status === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-emerald-600"
                }
                transition-colors
              `}
          >
            {status === "success" ? "Ótimo!" : "Tentar novamente"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function WorkWithUsPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLogged, userName } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("psicologos");
  const [showForm, setShowForm] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [accordion, setAccordion] = useState({
    item1: false,
    item2: false,
    item3: false,
  });

  // Inicializa o EmailJS - Corrigido: método de inicialização correto
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    }
  }, []);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome completo é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    }

    if (!formData.curriculo) {
      newErrors.curriculo = "Currículo é obrigatório";
    } else if (formData.curriculo.type !== "application/pdf") {
      newErrors.curriculo = "Apenas arquivos PDF são aceitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.experiencia.trim()) {
      newErrors.experiencia = "Experiência profissional é obrigatória";
    } else if (formData.experiencia.trim().length < 50) {
      newErrors.experiencia =
        "Descreva sua experiência com mais detalhes (mínimo 50 caracteres)";
    }

    if (!formData.motivacao.trim()) {
      newErrors.motivacao = "Carta de motivação é obrigatória";
    } else if (formData.motivacao.trim().length < 100) {
      newErrors.motivacao =
        "Sua carta de motivação deve ter pelo menos 100 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendEmail = async () => {
    if (
      !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    ) {
      throw new Error("EmailJS configuration is missing");
    }

    return emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      {
        from_name: formData.nome,
        from_email: formData.email,
        message: `Candidatura para ${currentRole}\n\nExperiência: ${formData.experiencia}\nMotivação: ${formData.motivacao}\nTelefone: ${formData.telefone}\nLinkedIn: ${formData.linkedin}`,
        curriculo: formData.curriculo ? formData.curriculo.name : "Não enviado",
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
    window.location.href = "/";
  };

  // Form state
  const [formData, setFormData] = useState<FormDataType>({
    nome: "",
    email: "",
    telefone: "",
    curriculo: null,
    experiencia: "",
    motivacao: "",
    linkedin: "",
    concordaTermos: false,
  });

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  type AccordionKey = "item1" | "item2" | "item3";

  const toggleAccordion = (item: AccordionKey) => {
    setAccordion({
      ...accordion,
      [item]: !accordion[item],
    });
  };

  const handleApply = (role: any) => {
    setCurrentRole(role);
    setShowForm(true);
    setFormStep(1);
    setFormSubmitted(false);
    // Scroll to form
    setTimeout(() => {
      document
        .getElementById("application-form")!
        .scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleInputChange = (e: any) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const nextStep = () => {
    let isValid = false;

    if (formStep === 1) {
      isValid = validateStep1();
    } else if (formStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      setFormStep(formStep + 1);
      setErrors({}); // Limpa os erros ao avançar
    }
  };

  const prevStep = () => {
    setFormStep(formStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendEmail();
      setSubmitStatus("success");
      setFormSubmitted(true);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        curriculo: null,
        experiencia: "",
        motivacao: "",
        linkedin: "",
        concordaTermos: false,
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error sending email:", error);
      setSubmitStatus("error");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setFormStep(1);
    setFormSubmitted(false);
  };

  const psicologoVagas = [
    {
      title: "Psicólogo Clínico Especialista em Emoções",
      description:
        "Buscamos um psicólogo especializado em avaliação e tratamento de questões emocionais para integrar nossa equipe multidisciplinar.",
      requirements: [
        "Graduação em Psicologia com registro ativo no CRP",
        "Especialização em Terapia Cognitivo-Comportamental",
        "Experiência mínima de 3 anos em atendimento clínico",
        "Conhecimento em tecnologias aplicadas à saúde mental",
      ],
      benefits: [
        "Trabalho remoto com horários flexíveis",
        "Remuneração competitiva baseada em experiência",
        "Participação em projetos de pesquisa inovadores",
        "Treinamento em inteligência artificial aplicada à psicologia",
      ],
    },
    {
      title: "Psicólogo de Pesquisa em IA e Comportamento",
      description:
        "Estamos buscando um psicólogo pesquisador para colaborar no desenvolvimento de algoritmos de análise comportamental baseados em IA.",
      requirements: [
        "Doutorado ou Mestrado em Psicologia ou áreas correlatas",
        "Experiência em pesquisa comportamental e análise de dados",
        "Conhecimento de metodologias de pesquisa quantitativa",
        "Interesse em inteligência artificial e tecnologia",
      ],
      benefits: [
        "Participação em publicações científicas",
        "Ambiente colaborativo com engenheiros de IA",
        "Plano de carreira em empresa de inovação",
        "Acesso a tecnologias de ponta em análise comportamental",
      ],
    },
  ];

  const techVagas = [
    {
      title: "Tech Lead em IA e Machine Learning",
      description:
        "Procuramos um líder técnico para supervisionar o desenvolvimento de sistemas de IA para análise comportamental e emocional.",
      requirements: [
        "Graduação em Ciência da Computação, Engenharia ou áreas relacionadas",
        "Experiência de 5+ anos com desenvolvimento de ML/IA",
        "Experiência prática com NLP e processamento de dados comportamentais",
        "Liderança de equipes técnicas em projetos complexos",
      ],
      benefits: [
        "Salário altamente competitivo",
        "Stock options e bônus por performance",
        "Participação direta em decisões estratégicas",
        "Ambiente de inovação constante",
      ],
    },
    {
      title: "Desenvolvedor Full Stack Senior",
      description:
        "Buscamos um desenvolvedor full stack experiente para implementar e melhorar nossas soluções de análise comportamental baseadas em web.",
      requirements: [
        "Proficiência em React, Next.js e desenvolvimento front-end moderno",
        "Experiência em back-end com Node.js, Python ou tecnologias similares",
        "Conhecimento de segurança de dados e privacidade",
        "Experiência com integração de sistemas de IA em aplicações web",
      ],
      benefits: [
        "Trabalho remoto com flexibilidade de horário",
        "Equipamentos de última geração",
        "Orçamento para educação e certificações",
        "Plano de saúde abrangente",
      ],
    },
    {
      title: "Engenheiro de Dados para IA Comportamental",
      description:
        "Precisamos de um engenheiro de dados para estruturar, limpar e preparar dados para nossos algoritmos de análise comportamental.",
      requirements: [
        "Experiência com pipelines de dados e ETL",
        "Proficiência em Python e frameworks de processamento de dados",
        "Conhecimento de SQL e bancos de dados NoSQL",
        "Familiaridade com processamento de dados comportamentais",
      ],
      benefits: [
        "Trabalho remoto com horários flexíveis",
        "Aprendizado contínuo e conferências",
        "Ambiente colaborativo com psicólogos e especialistas em comportamento",
        "Projetos de impacto social",
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>EmotionTrack | Trabalhe Conosco</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      <link
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        rel="stylesheet"
      ></link>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
        <nav
          className={`sticky top-0 z-50 w-full ${
            isScrolled ? "bg-white shadow-md" : "bg-transparent"
          } transition-all duration-300`}
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <a href="/">
                <div className="flex items-center">
                  <Brain className="text-indigo-600 h-8 w-8" />
                  <span className="ml-2 text-xl font-bold text-gray-800">
                    EmotionTrack
                  </span>
                </div>
              </a>
            </div>

            <div className="hidden md:flex space-x-8">
              <a
                href="/"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Home
              </a>
              <a
                href="/#funcionalidades"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Funcionalidades
              </a>
              <a
                href="/contact"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Contato
              </a>
              <a href="/workwithus" className="text-indigo-600 font-medium">
                Trabalhe Conosco
              </a>
            </div>

            <div className="flex items-center gap-4">
              {isLogged ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2 hidden md:inline">
                      👋
                    </span>
                    <span className="text-gray-700 font-medium">
                      Olá,{" "}
                      <span className="text-indigo-600">
                        {userName || "Usuário"}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 flex items-center gap-1 text-gray-600 hover:text-white font-medium rounded-lg hover:bg-red-500 transition-colors duration-300"
                    aria-label="Logout"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <a href="/login">
                    <button
                      className="px-4 py-2 flex items-center gap-2 bg-white text-indigo-600 border border-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-all duration-300 hover:shadow-sm"
                      aria-label="Login"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      Entrar
                    </button>
                  </a>
                  <a href="/register">
                    <button
                      className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-md"
                      aria-label="Register"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Cadastrar-se
                    </button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Faça parte da revolução em saúde emocional
            </h1>
            <p className="text-lg text-gray-600 mb-12">
              Na EmotionTrack, estamos construindo o futuro da análise
              comportamental e suporte emocional. Junte-se a nossa equipe de
              especialistas comprometidos em melhorar a vida das pessoas através
              da tecnologia e da ciência.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-6">
              <button
                onClick={() => setActiveTab("psicologos")}
                className={`px-8 py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                  activeTab === "psicologos"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "bg-white border border-indigo-300 text-indigo-600 hover:shadow-md"
                }`}
              >
                <Heart className="h-6 w-6" />
                <span className="font-medium text-lg">Psicólogos</span>
              </button>

              <button
                onClick={() => setActiveTab("tech")}
                className={`px-8 py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                  activeTab === "tech"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "bg-white border border-indigo-300 text-indigo-600 hover:shadow-md"
                }`}
              >
                <Code className="h-6 w-6" />
                <span className="font-medium text-lg">Tecnologia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Culture Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Nossa Cultura
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <Brain className="text-indigo-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Inovação constante
                  </h3>
                  <p className="text-gray-600">
                    Buscamos sempre as tecnologias mais avançadas e as melhores
                    práticas para criar soluções que realmente façam diferença
                    na vida das pessoas.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <Users className="text-indigo-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Ambiente colaborativo
                  </h3>
                  <p className="text-gray-600">
                    Promovemos um ambiente de trabalho onde psicólogos e
                    tecnólogos colaboram diariamente, combinando conhecimentos
                    para criar produtos excepcionais.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <Heart className="text-indigo-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Impacto social</h3>
                  <p className="text-gray-600">
                    Tudo o que fazemos tem como objetivo melhorar a saúde mental
                    e emocional das pessoas, contribuindo para uma sociedade
                    mais saudável e equilibrada.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <Briefcase className="text-indigo-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Crescimento profissional
                  </h3>
                  <p className="text-gray-600">
                    Investimos no desenvolvimento de nossa equipe, oferecendo
                    treinamentos, participação em eventos e um plano de carreira
                    estruturado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Openings */}
        <div id="vagas" className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Vagas Abertas
          </h2>

          {activeTab === "psicologos" && (
            <div className="max-w-4xl mx-auto">
              {psicologoVagas.map((vaga, index) => (
                <div
                  key={index}
                  className="mb-8 bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-2">
                          <Heart className="h-5 w-5 text-indigo-600 mr-2" />
                          <h3 className="text-xl font-semibold">
                            {vaga.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-4">{vaga.description}</p>
                      </div>
                      <button
                        onClick={() => handleApply(vaga.title)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Candidatar-se
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">
                          Requisitos:
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600">
                          {vaga.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          Benefícios:
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600">
                          {vaga.benefits.map((ben, idx) => (
                            <li key={idx}>{ben}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "tech" && (
            <div className="max-w-4xl mx-auto">
              {techVagas.map((vaga, index) => (
                <div
                  key={index}
                  className="mb-8 bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-2">
                          <Code className="h-5 w-5 text-indigo-600 mr-2" />
                          <h3 className="text-xl font-semibold">
                            {vaga.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-4">{vaga.description}</p>
                      </div>
                      <button
                        onClick={() => handleApply(vaga.title)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Candidatar-se
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">
                          Requisitos:
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600">
                          {vaga.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          Benefícios:
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600">
                          {vaga.benefits.map((ben, idx) => (
                            <li key={idx}>{ben}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Application Form */}
        {showForm && (
          <div id="application-form" className="bg-white py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">
                    Candidatura: {currentRole}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {formSubmitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">
                      Candidatura Enviada!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Obrigado pelo seu interesse em fazer parte da equipe
                      EmotionTrack. Analisaremos seu perfil e entraremos em
                      contato em breve.
                    </p>
                    <button
                      onClick={closeForm}
                      className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Voltar às vagas
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                              formStep >= 1
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200"
                            }`}
                          >
                            1
                          </div>
                          <span className="font-medium">
                            Informações Básicas
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                              formStep >= 2
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200"
                            }`}
                          >
                            2
                          </div>
                          <span className="font-medium">Experiência</span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                              formStep >= 3
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200"
                            }`}
                          >
                            3
                          </div>
                          <span className="font-medium">Finalizar</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-1 rounded-full">
                        <div
                          className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(formStep / 3) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {formStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label
                              htmlFor="nome"
                              className="block text-gray-700 mb-1 font-medium"
                            >
                              Nome Completo *
                            </label>
                            <input
                              type="text"
                              id="nome"
                              name="nome"
                              value={formData.nome}
                              onChange={handleInputChange}
                              required
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.nome
                                  ? "border-red-500 focus:ring-red-500"
                                  : "focus:ring-indigo-500"
                              }`}
                              placeholder="Seu nome completo"
                            />
                            {errors.nome && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.nome}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-gray-700 mb-1 font-medium"
                            >
                              E-mail *
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.email
                                  ? "border-red-500 focus:ring-red-500"
                                  : "focus:ring-indigo-500"
                              }`}
                              placeholder="seu.email@exemplo.com"
                            />
                            {errors.email && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="telefone"
                            className="block text-gray-700 mb-1 font-medium"
                          >
                            Telefone *
                          </label>
                          <input
                            type="tel"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleInputChange}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              errors.telefone
                                ? "border-red-500 focus:ring-red-500"
                                : "focus:ring-indigo-500"
                            }`}
                            placeholder="(00) 00000-0000"
                          />
                          {errors.telefone && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.telefone}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="curriculo"
                            className="block text-gray-700 mb-1 font-medium"
                          >
                            Currículo (PDF) *
                          </label>
                          <input
                            type="file"
                            id="curriculo"
                            name="curriculo"
                            onChange={handleInputChange}
                            accept=".pdf"
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              errors.curriculo
                                ? "border-red-500 focus:ring-red-500"
                                : "focus:ring-indigo-500"
                            }`}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Apenas arquivos PDF. Máximo 5 MB.
                          </p>
                          {errors.curriculo && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.curriculo}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-6">
                        <div className="w-full">
                          <label
                            htmlFor="experiencia"
                            className="block text-gray-700 mb-1 font-medium text-sm sm:text-base"
                          >
                            Experiência Profissional *
                          </label>
                          <textarea
                            id="experiencia"
                            name="experiencia"
                            value={formData.experiencia}
                            onChange={handleInputChange}
                            required
                            rows={4}
                            className={`w-full px-3 py-2 sm:px-4 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              errors.experiencia
                                ? "border-red-500 focus:ring-red-500"
                                : "focus:ring-indigo-500"
                            }`}
                            placeholder="Descreva sua experiência relevante para esta vaga..."
                          ></textarea>
                          {errors.experiencia && (
                            <p className="mt-1 text-xs sm:text-sm text-red-600">
                              {errors.experiencia}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {formData.experiencia.length}/50 caracteres mínimos
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="motivacao"
                            className="block text-gray-700 mb-1 font-medium"
                          >
                            Carta de Motivação *
                          </label>
                          <textarea
                            id="motivacao"
                            name="motivacao"
                            value={formData.motivacao}
                            onChange={handleInputChange}
                            required
                            rows={4}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              errors.motivacao
                                ? "border-red-500 focus:ring-red-500"
                                : "focus:ring-indigo-500"
                            }`}
                            placeholder="Por que você quer trabalhar na EmotionTrack e o que te motiva nesta vaga?"
                          ></textarea>
                          {errors.motivacao && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.motivacao}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label
                              htmlFor="linkedin"
                              className="block text-gray-700 mb-1 font-medium"
                            >
                              LinkedIn
                            </label>
                            <input
                              type="url"
                              id="linkedin"
                              name="linkedin"
                              value={formData.linkedin}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="https://linkedin.com/in/seu-perfil"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formStep === 3 && (
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h3 className="text-lg font-medium mb-4">
                            Revisão da sua Candidatura
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-500">Nome:</p>
                              <p className="font-medium">{formData.nome}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">E-mail:</p>
                              <p className="font-medium">{formData.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Telefone:</p>
                              <p className="font-medium">{formData.telefone}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Currículo:</p>
                              <p className="font-medium">
                                {formData.curriculo
                                  ? formData.curriculo.name
                                  : "Nenhum arquivo selecionado"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h4 className="font-medium mb-2">
                              Experiência Profissional:
                            </h4>
                            <p className="text-gray-600 bg-white p-3 rounded border">
                              {formData.experiencia}
                            </p>
                          </div>

                          <div className="mt-4">
                            <h4 className="font-medium mb-2">
                              Carta de Motivação:
                            </h4>
                            <p className="text-gray-600 bg-white p-3 rounded border">
                              {formData.motivacao}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="concordaTermos"
                            name="concordaTermos"
                            checked={formData.concordaTermos}
                            onChange={handleInputChange}
                            required
                            className="mt-1 mr-2"
                          />
                          <label
                            htmlFor="concordaTermos"
                            className="text-gray-600"
                          >
                            Confirmo que todas as informações fornecidas são
                            verdadeiras e concordo com os termos de privacidade
                            e processo seletivo da EmotionTrack. *
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex justify-between">
                      {formStep > 1 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="px-6 py-2 border border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          Voltar
                        </button>
                      )}

                      {formStep < 3 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors ml-auto"
                        >
                          Próximo
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors ml-auto flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <span>Enviar Candidatura</span>
                              <Send className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-indigo-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Perguntas Frequentes
            </h2>

            <div className="max-w-3xl mx-auto">
              <div className="mb-4">
                <button
                  className="w-full flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                  onClick={() => toggleAccordion("item1")}
                >
                  <span className="font-medium text-lg">
                    Como é o processo seletivo?
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-300 ${
                      accordion.item1 ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {accordion.item1 && (
                  <div className="p-4 bg-white border-t">
                    <p className="text-gray-600">
                      Nosso processo seletivo consiste em 4 etapas principais:
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-2 text-gray-600">
                      <li>
                        Análise de currículo e documentação: avaliamos sua
                        formação e experiência.
                      </li>
                      <li>
                        Entrevista com RH: para conhecer melhor seu perfil
                        comportamental e suas expectativas.
                      </li>
                      <li>
                        Teste técnico/prático: específico para cada área
                        (avaliação psicológica ou desafio técnico).
                      </li>
                      <li>
                        Entrevista com liderança: conversa final com o gestor da
                        área para alinhamento de expectativas.
                      </li>
                    </ol>
                    <p className="mt-3 text-gray-600">
                      Todo o processo dura em média 3 semanas, e mantemos os
                      candidatos informados em cada etapa.
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <button
                  className="w-full flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                  onClick={() => toggleAccordion("item2")}
                >
                  <span className="font-medium text-lg">
                    Quais benefícios a EmotionTrack oferece?
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-300 ${
                      accordion.item2 ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {accordion.item2 && (
                  <div className="p-4 bg-white border-t">
                    <p className="text-gray-600 mb-3">
                      Na EmotionTrack, oferecemos um pacote de benefícios
                      competitivo que inclui:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Flexibilidade de horário e trabalho remoto</li>
                      <li>Plano de saúde e odontológico abrangentes</li>
                      <li>Vale-refeição/alimentação</li>
                      <li>Seguro de vida</li>
                      <li>Budget anual para desenvolvimento profissional</li>
                      <li>Participação nos lucros</li>
                      <li>Licença maternidade/paternidade estendida</li>
                      <li>Auxílio para equipamentos de home office</li>
                      <li>Plataforma de bem-estar e saúde mental</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <button
                  className="w-full flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                  onClick={() => toggleAccordion("item3")}
                >
                  <span className="font-medium text-lg">
                    Modalidade de trabalho: presencial ou remoto?
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-300 ${
                      accordion.item3 ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {accordion.item3 && (
                  <div className="p-4 bg-white border-t">
                    <p className="text-gray-600">
                      A EmotionTrack adota um modelo de trabalho híbrido, com
                      foco no remoto. Nossa filosofia é priorizar a autonomia e
                      os resultados, não o local onde o trabalho é realizado.
                    </p>
                    <p className="mt-3 text-gray-600">
                      Para a maioria das posições, oferecemos trabalho 100%
                      remoto, com encontros presenciais trimestrais na sede em
                      São Paulo para alinhamentos e integrações.
                    </p>
                    <p className="mt-3 text-gray-600">
                      Algumas funções específicas podem exigir presença mais
                      frequente no escritório, mas isso será informado
                      claramente na descrição da vaga.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ainda está em dúvida?
            </h2>

            <div className="max-w-2xl mx-auto">
              <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                Se você não encontrou uma vaga que corresponda ao seu perfil,
                mas acredita que pode contribuir para nossa missão, envie-nos
                seu currículo. Estamos sempre em busca de talentos!
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 inline-block">
                <div className="flex flex-col items-center space-y-4">
                  <div className="space-y-2">
                    <p className="text-white font-medium">
                      Envie seu currículo para:
                    </p>
                    <div className="space-y-1">
                      <a
                        href="mailto:dsglucass@gmail.com"
                        className="text-indigo-100 hover:text-white transition-colors block"
                      >
                        dsglucass@gmail.com
                      </a>
                      <a
                        href="mailto:aaron.msilva56@gmail.com"
                        className="text-indigo-100 hover:text-white transition-colors block"
                      >
                        aaron.msilva56@gmail.com
                      </a>
                    </div>
                  </div>

                  <button
                    className="mt-4 px-6 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-all"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        "dsglucass@gmail.com, aaron.msilva56@gmail.com"
                      )
                    }
                  >
                    Copiar e-mails
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="bg-gray-800 text-gray-300 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-8 md:mb-0">
                <div className="flex items-center">
                  <Brain className="text-indigo-400 h-6 w-6" />
                  <span className="ml-2 text-xl font-bold text-white">
                    EmotionTrack
                  </span>
                </div>
                <p className="mt-4 max-w-md">
                  Análise comportamental de emoções com inteligência artificial
                  para melhorar seu bem-estar emocional e mental.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Navegação</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="/" className="hover:text-white">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="/#sobrenos" className="hover:text-white">
                        Sobre Nós
                      </a>
                    </li>
                    <li>
                      <a href="/#funcionalidades" className="hover:text-white">
                        Funcionalidades
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className="hover:text-white">
                        Contato
                      </a>
                    </li>
                    <li>
                      <a href="/workwithus" className="hover:text-white">
                        Trabalhe Conosco
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recursos</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="/#chatbot" className="hover:text-white">
                        Chatbot
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className="hover:text-white">
                        Suporte
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Legal</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="hover:text-white">
                        Termos de Uso
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white">
                        Privacidade
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white">
                        Cookies
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-12 pt-8 text-center">
              <p>
                &copy; {new Date().getFullYear()} EmotionTrack. Todos os
                direitos reservados.
              </p>
            </div>
          </div>
        </footer>
        <NotificationModal
          isOpen={showModal}
          onClose={handleCloseModal}
          status={submitStatus}
          message={
            submitStatus === "success"
              ? "Sua candidatura foi enviada com sucesso! Entraremos em contato em breve."
              : "Ocorreu um erro ao enviar sua candidatura. Por favor, tente novamente mais tarde."
          }
        />
      </div>
    </>
  );
}
