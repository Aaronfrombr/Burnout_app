import { useState, useEffect } from "react";
import Head from "next/head";
import {
  Mail,
  Phone,
  MapPin,
  BrainCircuit,
  Users,
  HeartPulse,
  Send,
  Brain,
} from "lucide-react";
import { useAuth } from "./useAuth";
import emailjs from "@emailjs/browser";
import { Check, AlertCircle, X } from 'lucide-react';

// Interface para o componente NotificationModal
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "error" | null;
  message: string;
}

// Componente NotificationModal implementado diretamente
const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, status, message }) => {
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
      <div className={`
        transform transition-all duration-500 ease-out
        ${status === 'success' ? 'bg-emerald-50' : 'bg-rose-50'}
        p-6 rounded-xl shadow-xl w-full max-w-md relative z-10
        border-l-4 ${status === 'success' ? 'border-emerald-500' : 'border-rose-500'}
      `}
      style={{
        backgroundColor: status === 'success' ? 'rgb(236, 253, 245)' : 'rgb(255, 241, 242)'
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
          <div className={`
            flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center
            ${status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}
          `}>
            {status === 'success' ? (
              <Check className="animate-bounce" size={32} />
            ) : (
              <AlertCircle className="animate-pulse" size={32} />
            )}
          </div>
          
          {/* Texto da notificação */}
          <div className="ml-5">
            <h3 className={`
              text-lg font-bold
              ${status === 'success' ? 'text-emerald-800' : 'text-rose-800'}
            `}>
              {status === 'success' ? 'Mensagem Enviada!' : 'Erro no Envio'}
            </h3>
            <p className={`
              mt-2 text-sm
              ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}
            `}>
              {message || (status === 'success' 
                ? 'Sua mensagem foi enviada com sucesso. Entraremos em contato em breve!' 
                : 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.')}
            </p>
          </div>
        </div>
        
        {/* Botão de ação */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className={`
              w-full py-2 px-4 rounded-lg font-medium text-black hover:bg-emerald-700
              ${status === 'success' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-rose-600 hover:bg-emerald-600'}
              transition-colors
            `}
          >
            {status === 'success' ? 'Ótimo!' : 'Tentar novamente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AboutContact() {
  const [showModal, setShowModal] = useState(false);
  const { isLogged, userName } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );

  // Inicializa o EmailJS - Corrigido: método de inicialização correto
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
    window.location.href = "/";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendEmail();
      setSubmitStatus("success");
      setFormData({ name: "", email: "", message: "" });
      setShowModal(true);
    } catch (error) {
      console.error("Error sending email:", error);
      setSubmitStatus("error");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const sendEmail = async () => {
    if (
      !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    ) {
      throw new Error("EmailJS configuration is missing");
    }

    // Corrigido: sintaxe correta para o envio de email
    return emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
      }
    );
  };

  return (
    <>
      <Head>
        <title>EmotionTrack | Sobre Nós & Contato</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>

      <link
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        rel="stylesheet"
      />

      <nav
        className={`sticky top-0 z-50 w-full ${
          isScrolled ? "bg-white shadow-md" : "bg-transparent"
        } transition-all duration-300`}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="text-indigo-600 h-8 w-8" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              EmotionTrack
            </span>
          </div>

          <div className="hidden md:flex space-x-8">
            <a
              href="/"
              className="text-gray-700 hover:text-indigo-600 font-medium"
            >
              Home
            </a>
            <a
              href="/dashboard"
              className="text-gray-700 hover:text-indigo-600 font-medium"
            >
              Dashboard
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

      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Transformando <span className="text-indigo-600">emoções</span>{" "}
                em <span className="text-purple-600">resultados</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10">
                Na EmotionTrack, acreditamos que entender as emoções no ambiente
                de trabalho é a chave para equipes mais produtivas, saudáveis e
                inovadoras.
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="https://atenaeditora.com.br/catalogo/dowload-post/80199"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Saiba mais
                </a>
                <a
                  href="#contact"
                  className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                >
                  Fale conosco
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Por que analisar emoções no trabalho?
              </h2>
              <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-10 mb-20">
              <div className="bg-indigo-50 p-8 rounded-xl hover:shadow-lg transition">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit className="text-indigo-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Inteligência Emocional
                </h3>
                <p className="text-gray-600">
                  Times com maior QE (Quociente Emocional) tomam melhores
                  decisões e resolvem conflitos de forma mais eficaz.
                </p>
              </div>

              <div className="bg-purple-50 p-8 rounded-xl hover:shadow-lg transition">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Users className="text-purple-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Engajamento</h3>
                <p className="text-gray-600">
                  Funcionários emocionalmente satisfeitos são 3x mais engajados
                  e 40% mais produtivos.
                </p>
              </div>

              <div className="bg-rose-50 p-8 rounded-xl hover:shadow-lg transition">
                <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                  <HeartPulse className="text-rose-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Bem-estar</h3>
                <p className="text-gray-600">
                  Monitoramento emocional reduz estresse e burnout, diminuindo
                  absenteísmo em até 27%.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-10 text-white">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold mb-6">Nossa Tecnologia</h3>
                <p className="mb-8 text-indigo-100">
                  Utilizando inteligência artificial e análise de dados em tempo
                  real, a EmotionTrack identifica padrões emocionais que
                  impactam a performance da sua equipe. Nossos algoritmos
                  detectam sinais sutis de satisfação, frustração ou
                  desmotivação antes que se tornem problemas críticos.
                </p>
                <div className="flex flex-wrap gap-4">
                  <span className="px-4 py-2 bg-white/10 rounded-full">
                    Machine Learning
                  </span>
                  <span className="px-4 py-2 bg-white/10 rounded-full">
                    Análise em Tempo Real
                  </span>
                  <span className="px-4 py-2 bg-white/10 rounded-full">
                    Privacidade Garantida
                  </span>
                  <span className="px-4 py-2 bg-white/10 rounded-full">
                    Dashboard Interativo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  87%
                </div>
                <p className="text-gray-600">Redução em conflitos</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  2.5x
                </div>
                <p className="text-gray-600">Mais inovação</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-rose-600 mb-2">63%</div>
                <p className="text-gray-600">Menos turnover</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  91%
                </div>
                <p className="text-gray-600">Satisfação no trabalho</p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Fale conosco
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Tem dúvidas sobre como a análise emocional pode transformar
                  seu ambiente de trabalho? Entre em contato!
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Seu nome
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Mensagem
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex justify-center items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-70"
                      aria-label="Enviar mensagem"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
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
                          <Send className="mr-2" size={18} />
                          Enviar mensagem
                        </>
                      )}
                    </button>
                  </form>
                  
                  {/* Componente modal de notificação */}
                  <NotificationModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    status={submitStatus}
                    message={
                      submitStatus === "success"
                        ? "Sua mensagem foi enviada com sucesso! Entraremos em contato em breve."
                        : "Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente mais tarde."
                    }
                  />
                  
                  {/* Estilos adicionais para garantir que o modal não seja transparente */}
                  <style jsx global>{`
                    .fixed.inset-0.flex.items-center.justify-center.z-50 > div:last-child {
                      background-color: rgba(236, 253, 245, 1) !important; /* Para success */
                      background-color: rgba(255, 241, 242, 1) !important; /* Para error */
                      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    }
                  `}</style>
                </div>

                <div className="md:w-1/2 bg-gray-50 rounded-2xl p-10">
                  <h3 className="text-xl font-semibold mb-6">
                    Nossas informações
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <Mail className="text-indigo-600" size={20} />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">Email</h4>
                        <p className="text-gray-600">dsglucass@gmail.com</p>
                        <p className="text-gray-600">
                          aaron.msilva56@gmail.com
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <Phone className="text-indigo-600" size={20} />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">Telefone</h4>
                        <p className="text-gray-600">+55 (67) 99999-9999</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <MapPin className="text-indigo-600" size={20} />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">Endereço</h4>
                        <p className="text-gray-600">
                          Av. Ivinhema, 9999 - Bela Vista
                          <br />
                          Nova Andradina - MS, 79750-000
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Horário de atendimento
                    </h4>
                    <div className="space-y-2 text-gray-600">
                      <p>Segunda a sexta: 9h às 18h</p>
                      <p>Sábado: 9h às 14h</p>
                      <p>Domingo: Fechado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}