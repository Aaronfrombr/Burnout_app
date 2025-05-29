import { useState, useEffect } from "react";
import { EmotionTrackChatbot } from "./ChatBot";
import {
  MessageSquare,
  BarChart2,
  Brain,
  Users,
  ArrowRight,
  Send,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "./useAuth";
import Head from "next/head";

export default function HomePage() {
  const { isLogged, userName } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá! Como posso ajudar você hoje?" },
  ]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, " ");
    }

    window.scrollTo(0, 0);

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    setWindowWidth(window.innerWidth);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSendMessage = () => {
    if (chatInput.trim() === "") return;

    setMessages([...messages, { role: "user", content: chatInput }]);
    setChatInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Obrigado pela sua mensagem! Em um sistema completo, aqui seria integrada a resposta da IA baseada no processamento de emoções.",
        },
      ]);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
    const shouldRemember =
      localStorage.getItem("shouldRememberEmail") === "true";
    if (!shouldRemember) {
      localStorage.removeItem("rememberedEmail");
    }

    window.location.href = "/";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <Head>
        <title>EmotionTrack | Home</title>
        <link rel="icon" href="/image/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 sm:p-4 md:p-6 lg:p-8">
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        ></link>
        
        {/* Navbar */}
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

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <a
                href="/dashboard"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Dashboard
              </a>
              <a
                href="#funcionalidades"
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
              <a
                href="/workwithus"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Trabalhe Conosco
              </a>
            </div>

            <div className="hidden md:flex items-center gap-4">
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
                    <button className="px-4 py-2 flex items-center gap-2 bg-white text-indigo-600 border border-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-all duration-300 hover:shadow-sm">
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
                    <button className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-md">
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

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white shadow-lg">
              <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <a
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </a>
                <a
                  href="#funcionalidades"
                  className="text-gray-700 hover:text-indigo-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Funcionalidades
                </a>
                <a
                  href="/contact"
                  className="text-gray-700 hover:text-indigo-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contato
                </a>
                <a
                  href="/workwithus"
                  className="text-gray-700 hover:text-indigo-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trabalhe Conosco
                </a>

                {isLogged ? (
                  <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">👋</span>
                      <span className="text-gray-700 font-medium">
                        Olá,{" "}
                        <span className="text-indigo-600">
                          {userName || "Usuário"}
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 flex items-center justify-center gap-1 text-gray-600 hover:text-white font-medium rounded-lg hover:bg-red-500 transition-colors duration-300"
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
                  <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                    <a href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-all duration-300 hover:shadow-sm">
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
                    <a
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <button className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-md">
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
          )}
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12 mb-12 md:mb-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Entenda suas emoções de forma inteligente
            </h1>
            <p id="sobrenos" className="text-base sm:text-lg text-gray-600 mb-8">
              Acompanhe sua saúde emocional em tempo real com análise
              comportamental baseada em inteligência artificial avançada. Receba
              insights e recomendações personalizadas para melhorar seu
              bem-estar.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {isLogged ? (
                <a href="/dashboard">
                  <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center">
                    Começar agora <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </a>
              ) : (
                <a href="/login">
                  <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center">
                    Começar agora <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </a>
              )}

              <a href="/contact">
                <button className="px-6 py-3 border border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors">
                  Saiba mais
                </button>
              </a>
            </div>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="relative bg-white rounded-xl shadow-xl p-6 md:p-8">
              <div className="absolute -top-3 -left-3 bg-indigo-600 rounded-full p-2">
                <Brain className="text-white h-6 w-6" />
              </div>
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <BarChart2 className="text-indigo-600 h-32 w-full" />
                <div className="flex justify-between mt-2">
                  <span className="text-xs sm:text-sm text-gray-500">Felicidade</span>
                  <span className="text-xs sm:text-sm text-gray-500">Ansiedade</span>
                  <span className="text-xs sm:text-sm text-gray-500">Estresse</span>
                  <span className="text-xs sm:text-sm text-gray-500">Calma</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
                <div className="bg-indigo-100 rounded-lg p-4 flex-1 flex items-center">
                  <MessageSquare className="text-indigo-600 h-8 w-8 mr-3" />
                  <div>
                    <h3 className="font-medium">Chat IA</h3>
                    <p className="text-sm text-gray-500">Tire suas dúvidas</p>
                  </div>
                </div>
                <div className="bg-indigo-100 rounded-lg p-4 flex-1 flex items-center">
                  <Users className="text-indigo-600 h-8 w-8 mr-3" />
                  <div>
                    <h3 className="font-medium">Especialistas</h3>
                    <p className="text-sm text-gray-500">
                      Suporte profissional
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2
              id="funcionalidades"
              className="text-2xl sm:text-3xl font-bold text-center mb-12"
            >
              Funcionalidades principais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart2 className="text-indigo-600 h-6 w-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3">
                  Análise em tempo real
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Monitore suas emoções em tempo real através de um dashboard
                  intuitivo e compreensível.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Brain className="text-indigo-600 h-6 w-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3">IA Avançada</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Algoritmos de inteligência artificial que analisam padrões
                  comportamentais e oferecem insights valiosos.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="text-indigo-600 h-6 w-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3">
                  Suporte Profissional
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Conecte-se com psicólogos especializados que analisam seus
                  relatórios e oferecem orientação.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chatbot Demo Section */}
        <div className="container mx-auto px-4 py-16">
          <h2 id="chatbot" className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Experimente nosso Chatbot
          </h2>
          <EmotionTrackChatbot />
          <p className="text-center mt-10 text-gray-600 text-sm sm:text-base">
            Este é apenas um exemplo. No produto final, o chatbot utilizará
            análise avançada de emoções e inteligência artificial para fornecer
            respostas personalizadas.
          </p>
        </div>

        {isLogged ? (
          <div></div>
        ) : (
          <div className="bg-indigo-600 py-16">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                Pronto para entender melhor suas emoções?
              </h2>
              <p className="text-indigo-100 max-w-2xl mx-auto mb-8 text-sm sm:text-base">
                Registre-se agora para começar a monitorar sua saúde emocional e
                obter insights valiosos baseados em análise comportamental
                avançada.
              </p>
              <a href="/register">
                <button className="px-6 sm:px-8 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors">
                  Criar uma conta
                </button>
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
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
                <p className="mt-4 max-w-md text-sm sm:text-base">
                  Análise comportamental de emoções com inteligência artificial
                  para melhorar seu bem-estar emocional e mental.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Navegação</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="hover:text-white text-sm sm:text-base">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#sobrenos" className="hover:text-white text-sm sm:text-base">
                        Sobre Nós
                      </a>
                    </li>
                    <li>
                      <a href="#funcionalidades" className="hover:text-white text-sm sm:text-base">
                        Funcionalidades
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className="hover:text-white text-sm sm:text-base">
                        Contato
                      </a>
                    </li>
                    <li>
                      <a href="/workwithus" className="hover:text-white text-sm sm:text-base">
                        Trabalhe Conosco
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recursos</h3>
                  <ul className="space-y-2">
                    {isLogged ? (
                      <>
                        <li>
                          <a href="/dashboard" className="hover:text-white text-sm sm:text-base">
                            Dashboard
                          </a>
                        </li>
                        <li>
                          <a href="/report" className="hover:text-white text-sm sm:text-base">
                            Relatórios
                          </a>
                        </li>
                        <li>
                          <a href="#chatbot" className="hover:text-white text-sm sm:text-base">
                            Chatbot
                          </a>
                        </li>
                        <li>
                          <a href="/contact" className="hover:text-white text-sm sm:text-base">
                            Suporte
                          </a>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <a href="#chatbot" className="hover:text-white text-sm sm:text-base">
                            Chatbot
                          </a>
                        </li>
                        <li>
                          <a href="/contact" className="hover:text-white text-sm sm:text-base">
                            Suporte
                          </a>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Legal</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="hover:text-white text-sm sm:text-base">
                        Termos de Uso
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white text-sm sm:text-base">
                        Privacidade
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white text-sm sm:text-base">
                        Cookies
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm sm:text-base">
              <p>
                &copy; {new Date().getFullYear()} EmotionTrack. Todos os
                direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}