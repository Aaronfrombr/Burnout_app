import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, X } from "lucide-react";
import Head from "next/head";
import emailjs from "@emailjs/browser";
import axios from "axios";

type ModalType = "success" | "error" | null;

interface ModalProps {
  type: ModalType;
  message: string;
  onClose: () => void;
}

const FeedbackModal = ({ type, message, onClose }: ModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl p-8 shadow-xl ${
          type === "success" ? "bg-green-50" : "bg-red-50"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          onClick={onClose}
        >
          <X
            size={20}
            className={
              type === "success" ? "text-green-600" : "text-red-600"
            }
          />
        </button>

        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            type === "success" ? "bg-emerald-100" : "bg-rose-100"
          }`}
        >
          {type === "success" ? (
            <CheckCircle size={40} className="text-emerald-600" />
          ) : (
            <AlertCircle size={40} className="text-rose-600" />
          )}
        </div>

        <h3
          className={`mt-4 text-center text-2xl font-bold ${
            type === "success" ? "text-emerald-800" : "text-rose-800"
          }`}
        >
          {type === "success" ? "Email enviado!" : "Erro!"}
        </h3>

        <p className="mt-2 text-center text-gray-600">{message}</p>

        <button
          className={`mt-6 w-full rounded-lg py-3 font-medium ${
            type === "success"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
          onClick={onClose}
        >
          {type === "success" ? "Voltar para login" : "Tentar novamente"}
        </button>
      </div>
    </div>
  );
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMessage, setModalMessage] = useState("");

  // Inicializa o EmailJS
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY_2) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY_2);
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendResetEmail = async () => {
    try {
      // 1. Gera token no backend
      const tokenResponse = await axios.post('http://localhost:8000/generate-reset-token/', { 
        email: email 
      });
      
      if (!tokenResponse.data.token) {
        throw new Error("Token não foi gerado corretamente");
      }
  
      // 2. Prepara link com token real
      const resetLink = `${window.location.origin}/newpassword?token=${tokenResponse.data.token}&email=${encodeURIComponent(email)}`;
  
      // 3. Envia email
      if (
        !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID_2 ||
        !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_3
      ) {
        throw new Error("Configuração do EmailJS incompleta");
      }
  
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID_2,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_3,
        {
          to_email: email,
          reset_link: resetLink,
          from_name: "EmotionTrack Support",
        }
      );
      
    } catch (error) {
      console.error("Erro no processo de reset:", error);
      alert("Ocorreu um erro ao enviar o email de recuperação. Por favor, tente novamente.");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        await sendResetEmail();
        
        setModalType("success");
        setModalMessage(
          `Um link para redefinição de senha foi enviado para ${email}. 
          Por favor, verifique sua caixa de entrada e siga as instruções.`
        );
        setEmail("");
      } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        setModalType("error");
        setModalMessage(
          "Ocorreu um erro ao enviar o e-mail de redefinição. Por favor, tente novamente mais tarde."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalMessage("");
    if (modalType === "success") {
      window.location.href = "/login";
    }
  };

  return (
    <>
      <Head>
        <title>EmotionTrack | Esqueci a Senha</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        ></link>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Voltar para login
                </Link>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Esqueceu a senha?
                </h1>
                <p className="text-gray-600">
                  Digite seu email e enviaremos um link para você redefinir sua
                  senha
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <div
                    className={`relative rounded-md shadow-sm ${
                      errors.email ? "animate-shake" : ""
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Digite seu email cadastrado"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.email
                          ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-rose-600">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    "Enviar link de redefinição"
                  )}
                </button>

                <div className="text-center text-sm text-gray-600">
                  Lembrou sua senha?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Voltar para o login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {modalType && (
          <FeedbackModal
            type={modalType}
            message={modalMessage}
            onClose={closeModal}
          />
        )}
      </div>
    </>
  );
}