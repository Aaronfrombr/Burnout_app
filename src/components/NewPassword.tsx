import { useState, FormEvent, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import axios from "axios";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
} from "lucide-react";
import emailjs from "@emailjs/browser";

type ModalType = "success" | "error" | null;

interface ModalProps {
  type: ModalType;
  message: string;
  onClose: () => void;
}

const FeedbackModal = ({ type, message, onClose }: ModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 ${
          type === "success"
            ? "border-l-8 border-green-500"
            : "border-l-8 border-red-500"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-4 rounded-full p-3 ${
                type === "success"
                  ? "bg-green-100 text-green-500"
                  : "bg-red-100 text-red-500"
              }`}
            >
              {type === "success" ? (
                <CheckCircle size={40} />
              ) : (
                <AlertCircle size={40} />
              )}
            </div>

            <h3 className="text-xl font-bold mb-2 text-gray-800">
              {type === "success" ? "Senha atualizada!" : "Erro!"}
            </h3>

            <p className="text-gray-600 mb-6">{message}</p>

            <button
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 ${
                type === "success"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              }`}
              onClick={onClose}
            >
              {type === "success" ? "Ir para login" : "Tentar novamente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FormData {
  email: string;
  current_password: string;
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  const decodedEmail = emailParam ? decodeURIComponent(emailParam) : '';
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    current_password: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMessage, setModalMessage] = useState("");

  // Inicializa o EmailJS no lado do cliente
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    }
  }, []);

  useEffect(() => {
    
    const validateToken = async () => {
      try {
        const response = await axios.post('http://localhost:8000/validate-reset-token/', { 
          token,
          email: decodedEmail,  // Envie ambos token e email
          new_password: formData.password
        });
        
        if (response.data.valid) {
          setIsTokenValid(true);
          setFormData(prev => ({ ...prev, email: decodedEmail }));
        } else {
          setIsTokenValid(false);
          setErrors({ token: response.data.message });
        }
      } catch (error) {
        console.error("Erro na validação:", error);
        setIsTokenValid(false);
        setErrors({ token: "Erro ao validar token" });
      }
    };

    if (token && emailParam) {
      validateToken();
    } else {
      setIsTokenValid(false);
      setErrors({ token: "Link incompleto" });
    }
}, [token, decodedEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Nova senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      // Verificação adicional dos dados
      if (!token || !emailParam || !formData.password) {
        throw new Error("Dados incompletos para processar a requisição");
      }
  
      const response = await axios.post('http://localhost:8000/reset-password/', {
        token,
        email: decodedEmail, // Usa o email da URL
        new_password: formData.password
      });
  
      setModalType("success");
      setModalMessage("Senha alterada com sucesso! Você será redirecionado para o login.");
      
    } catch (error: any) {
      console.error("Erro ao resetar senha:", error);
      setModalType("error");
      setModalMessage(
        error.response?.data?.detail || 
        error.message ||
        "Erro ao alterar senha. Por favor, tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeModal = () => {
    setModalType(null);
    setModalMessage("");

    if (modalType === "success") {
      router.push("/login");
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;

    return strength;
  };

  const renderStrengthBar = () => {
    const strength = getPasswordStrength();

    let barColor = "bg-gray-200";
    let strengthText = "Força da senha";

    if (strength > 0 && strength <= 25) {
      barColor = "bg-red-500";
      strengthText = "Fraca";
    } else if (strength > 25 && strength <= 50) {
      barColor = "bg-orange-500";
      strengthText = "Razoável";
    } else if (strength > 50 && strength <= 75) {
      barColor = "bg-yellow-500";
      strengthText = "Boa";
    } else if (strength > 75) {
      barColor = "bg-green-500";
      strengthText = "Forte";
    }

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Força da senha</span>
          <span className="text-xs font-medium">{strengthText}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${barColor} transition-all duration-300`}
            style={{ width: `${strength}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>EmotionTrack | Nova Senha</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        ></link>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">EmotionTrack</h1>
                <p className="text-blue-100 text-sm opacity-80">
                  Sistema de Análise Emocional
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <Lock size={24} className="text-white" />
              </div>
            </div>
          </div>

          

          {/* Form Section */}
          <div className="p-8">
            <div className="mb-2">
              <Link href="/">
                <button
                  type="button"
                  className="px-5 py-1 border border-gray-300 text-gray-700 rounded-lg bg-blue-400 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all flex-1"
                >
                  <ArrowLeft />
                </button>
              </Link>
              <h2 className="text-xl font-semibold text-gray-800 mb-1 mt-3">
                Criar nova senha
              </h2>
              <p className="text-gray-500 text-sm">
                Digite e confirme sua nova senha abaixo
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Password Field */}
              <div className="mb-5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 border ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } rounded-lg shadow-sm transition-all duration-300`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 border ${
                      errors.confirmPassword
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } rounded-lg shadow-sm transition-all duration-300`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password Strength Indicator */}
              {renderStrengthBar()}

              {/* Password Requirements */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Sua senha deve conter:
                </p>
                <ul className="space-y-1">
                  {[
                    {
                      text: "No mínimo 6 caracteres",
                      check: formData.password.length >= 6,
                    },
                    {
                      text: "Pelo menos uma letra maiúscula",
                      check: /[A-Z]/.test(formData.password),
                    },
                    {
                      text: "Pelo menos um número",
                      check: /[0-9]/.test(formData.password),
                    },
                    {
                      text: "Pelo menos um caractere especial",
                      check: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
                    },
                  ].map((requirement, index) => (
                    <li
                      key={index}
                      className={`text-sm flex items-center ${
                        requirement.check ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`inline-flex mr-2 items-center justify-center w-4 h-4 ${
                          requirement.check
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        } rounded-full`}
                      >
                        {requirement.check ? (
                          <CheckCircle size={12} />
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      {requirement.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
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
                    Atualizando senha...
                  </span>
                ) : (
                  "Atualizar senha"
                )}
              </button>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <span className="text-gray-600 text-sm">
                  Lembrou sua senha?
                </span>
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm ml-2 transition-colors"
                >
                  Voltar para o login
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t text-xs text-center text-gray-500">
            EmotionTrack © 2025 • Todos os direitos reservados
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <FeedbackModal
          type={modalType}
          message={modalMessage}
          onClose={closeModal}
        />
      )}
    </>
  );
}