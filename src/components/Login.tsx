import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import Head from "next/head";
import { login } from "../models/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");
  const router = useRouter();

  // Background images para o carrossel
  const backgroundColors = [
    "from-purple-200 to-purple-500",
    "from-blue-200 to-blue-500",
    "from-pink-200 to-pink-500",
  ];

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    }
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const shouldRemember =
      localStorage.getItem("shouldRememberEmail") === "true";

    if (rememberedEmail && shouldRemember) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Efeito de digitação do título
  useEffect(() => {
    const fullTitle = "EmotionTrack";
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullTitle.length) {
        setTitle(fullTitle.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, []);

  // Efeito de carrossel das imagens de fundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundColors.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      // Inicia o fluxo de autenticação do Google
      const authEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
      const scope = encodeURIComponent("profile email");
      const responseType = "code";
      
      const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&access_type=offline&prompt=consent`;
      
      // Redireciona para a página de autenticação do Google
      window.location.href = authUrl;
    } catch (error) {
      console.error("Google login error:", error);
      setModalType("error");
      setModalMessage("Erro ao iniciar autenticação com Google");
      setShowModal(true);
    }
  };

  // Simulação de login
  const handleLogin = async () => {
    // Validação básica (mantida igual)
    let isValid = true;

    if (!email) {
      setEmailError("Email é obrigatório");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Por favor, insira um email válido");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Senha é obrigatória");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const response = await login(email, password);

      if (response.success) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("shouldRememberEmail", "true");
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("shouldRememberEmail");
        }
        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }
        if (response.user) {
          localStorage.setItem("userData", JSON.stringify(response.user));
        }
        setModalType("success");
        setModalMessage("Login realizado com sucesso! Redirecionando...");
        setShowModal(true);

        // Redireciona após 2 segundos
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setModalType("error");
        setModalMessage(response.message || "Credenciais inválidas");
        setShowModal(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      setModalType("error");
      setModalMessage("Erro ao conectar com o servidor");
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Head>
        <title>EmotionTrack | Login </title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      <div className="flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        ></link>
        {/* Background image carousel - lado esquerdo */}
        <div
          className={`relative hidden md:flex md:w-1/2 lg:w-3/5 h-screen bg-gradient-to-br transition-all duration-1000 ${backgroundColors[currentBgIndex]}`}
          style={{ backgroundColor: backgroundColors[currentBgIndex] }}
        >
          {backgroundColors.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentBgIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center h-full w-full"
                style={{
                  backgroundImage: `url(${img})`,
                }}
              ></div>

              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 to-indigo-700/50" />
            </div>
          ))}

          {/* Branding overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
            <div className="max-w-lg text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
              </div>

              <h1 className="mb-4 text-5xl font-bold tracking-tight">
                EmotionTrack
              </h1>
              <p className="mb-8 text-xl font-light leading-relaxed">
                Monitore e compreenda suas emoções para uma vida mais
                equilibrada e consciente
              </p>

              <div className="mt-16 flex justify-center space-x-3">
                {backgroundColors.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBgIndex(idx)}
                    className={`h-2 w-12 rounded-full transition-all ${
                      idx === currentBgIndex
                        ? "bg-white"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
                  <h3 className="font-semibold">Acompanhamento</h3>
                  <p className="text-sm opacity-80">
                    Rastreie seu humor diariamente
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
                  <h3 className="font-semibold">Visualização</h3>
                  <p className="text-sm opacity-80">
                    Gráficos e padrões emocionais
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
                  <h3 className="font-semibold">Bem-estar</h3>
                  <p className="text-sm opacity-80">Insights para equilíbrio</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login form - lado direito */}
        <div className="flex w-full items-center justify-center px-4 md:w-1/2 lg:w-2/5">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  {title}
                  <span className="ml-1 inline-block animate-pulse text-indigo-600">
                    |
                  </span>
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Faça login para continuar sua jornada emocional
                </p>
              </div>

              <div className="mt-8 space-y-6">
                <div className="space-y-5">
                  {/* Campo de Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEmail(value);

                          // Validação em tempo real (opcional)
                          if (
                            value &&
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                          ) {
                            setEmailError("Por favor, insira um email válido");
                          } else {
                            setEmailError("");
                          }
                        }}
                        onBlur={(e) => {
                          // Validação quando o campo perde o foco
                          if (!e.target.value) {
                            setEmailError("Email é obrigatório");
                          } else if (
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)
                          ) {
                            setEmailError("Por favor, insira um email válido");
                          } else {
                            setEmailError("");
                          }
                        }}
                        className={`block w-full rounded-lg border px-10 py-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-30 ${
                          emailError
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-30"
                            : "border-gray-300"
                        }`}
                        placeholder="seu-email@exemplo.com"
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Campo de Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`block w-full rounded-lg border px-10 py-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-30 ${
                          passwordError
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-30"
                            : "border-gray-300"
                        }`}
                        placeholder="Digite sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {passwordError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Opções adicionais */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Lembrar de mim
                    </label>
                  </div>

                  <div>
                    <a href="/forgotpassword">
                      <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                        Esqueceu sua senha?
                      </button>
                    </a>
                  </div>
                </div>

                {/* Botão de Login */}
                <div>
                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="group relative flex w-full justify-center rounded-lg py-3 px-4 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <svg
                        className="h-5 w-5 animate-spin text-white"
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
                    ) : (
                      "Entrar"
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Não tem uma conta?{" "}
                    <a href="/register">
                      <button className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                        Criar uma conta
                      </button>
                    </a>
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">
                      ou continue com
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3"> {/* Grid-cols-3 para outros botões como linkedin ou github */}
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center rounded-lg border border-gray-300 bg-white py-2 px-4 text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer com informações adicionais */}
            <div className="mt-8 text-center text-xs text-gray-500">
              <p>© 2025 EmotionTrack. Todos os direitos reservados.</p>
              <div className="mt-2 flex justify-center space-x-4">
                <button className="hover:text-gray-700 transition-colors">
                  Termos
                </button>
                <button className="hover:text-gray-700 transition-colors">
                  Privacidade
                </button>
                <button className="hover:text-gray-700 transition-colors">
                  Suporte
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de feedback */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100 relative ${
                modalType === "success"
                  ? "border-l-8 border-green-500"
                  : "border-l-8 border-red-500"
              }`}
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={closeModal}
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div
                  className={`rounded-full p-3 mb-4 ${
                    modalType === "success"
                      ? "text-green-500 bg-green-100"
                      : "text-red-500 bg-red-100"
                  }`}
                >
                  {modalType === "success" ? (
                    <CheckCircle size={40} />
                  ) : (
                    <AlertCircle size={40} />
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2">
                  {modalType === "success" ? "Sucesso!" : "Erro!"}
                </h3>

                <p className="text-gray-600 mb-6">{modalMessage}</p>

                <button
                  className={`w-full py-3 rounded-lg font-medium text-white transition-all ${
                    modalType === "success"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  }`}
                  onClick={closeModal}
                >
                  {modalType === "success" ? "Continuar" : "Tentar novamente"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LoginPage;
