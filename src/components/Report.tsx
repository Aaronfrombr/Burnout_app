import { useState, useEffect } from "react";
import Head from "next/head";
import {
  ArrowLeft,
  AlertCircle,
  Save,
  Send,
  CheckCircle,
  User,
  Clock,
  X,
} from "lucide-react";
import { useAuth } from "./useAuth";
import emailjs from "@emailjs/browser";
import { NotificationModal } from "./NotificationModal";

// Interfaces
interface EmailParams {
  from_name: string;
  from_email: string;
  message: string;
  emotion?: string;
  severity?: string;
  report?: string;
  user_name?: string;
  date?: string;
}

interface SeverityOption {
  value: string;
  color: string;
}

interface EmotionOption {
  value: string;
  icon: string;
}

export default function Report() {
  const [validationError, setValidationError] = useState("");
  const { isLogged, userName } = useAuth();
  const [report, setReport] = useState("");
  const [severity, setSeverity] = useState("Médio");
  const [emotion, setEmotion] = useState("Neutro");
  const [saveStatus, setSaveStatus] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const isReportEmpty = !report.trim();

  // Opções para os seletores
  const severityOptions: SeverityOption[] = [
    { value: "Baixo", color: "bg-green-500" },
    { value: "Médio", color: "bg-yellow-500" },
    { value: "Alto", color: "bg-purple-500" },
    { value: "Urgente", color: "bg-red-500" },
  ];

  const emotionOptions: EmotionOption[] = [
    { value: "Neutro", icon: "😐" },
    { value: "Positivo", icon: "😊" },
    { value: "Negativo", icon: "😔" },
    { value: "Ansioso", icon: "😰" },
    { value: "Estressado", icon: "😤" },
  ];

  // Efeitos iniciais
  useEffect(() => {
    initializeEmailJS();
    setupFormattedDate();
    loadSavedDraft();
  }, [isLogged, userName]);

  const initializeEmailJS = () => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    }
  };

  const setupFormattedDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    setFormattedDate(now.toLocaleString("pt-BR", options));
  };

  const loadSavedDraft = () => {
    if (!isLogged) return;

    const savedDraft = localStorage.getItem(`emotiontrack-draft-${userName}`);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setReport(parsedDraft.report || "");
        setSeverity(parsedDraft.severity || "Médio");
        setEmotion(parsedDraft.emotion || "Neutro");
      } catch (e) {
        console.error("Erro ao carregar rascunho:", e);
      }
    }
  };

  // Manipuladores de eventos
  const handleEmotionChange = (value: string) => {
    setEmotion(value);
  };

  const handleSeverityChange = (value: string) => {
    setSeverity(value);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSubmitStatus(null);
  };

  // Funções de envio e salvamento
  const sendEmail = async (): Promise<void | any> => {
    if (
      !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_2
    ) {
      throw new Error("EmailJS configuration is missing");
    }

    const emailParams: EmailParams | any = {
      from_name: userName || "Usuário EmotionTrack",
      from_email: "no-reply@emotiontrack.com",
      message: report,
      emotion,
      severity,
      user_name: userName,
      date: formattedDate,
    };

    return emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_2,
      emailParams
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!report.trim()) {
      setValidationError("Por favor, digite sua análise antes de enviar");
      return;
    }

    if (!isLogged) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setValidationError(""); // Limpa erros anteriores

    try {
      await sendEmail();
      setSubmitStatus("success");
      setShowModal(true);
      clearFormAfterSubmit();
    } catch (error) {
      console.error("Error sending email:", error);
      setSubmitStatus("error");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFormAfterSubmit = () => {
    setTimeout(() => {
      setReport("");
      setSeverity("Baixo");
      setEmotion("Neutro");
      localStorage.removeItem(`emotiontrack-draft-${userName}`);
    }, 3000);
  };

  const saveDraft = () => {
    // Validação
    if (!report.trim()) {
      setValidationError("Por favor, digite sua análise antes de salvar");
      return;
    }

    if (!isLogged) return;

    const draft = {
      report,
      severity,
      emotion,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      `emotiontrack-draft-${userName}`,
      JSON.stringify(draft)
    );
    showSaveStatus();
    setValidationError(""); // Limpa erros anteriores
  };

  const showSaveStatus = () => {
    setSaveStatus("Rascunho salvo!");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  // Renderização
  return (
    <>
      <Head>
        <title>EmotionTrack | Relatório Profissional</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      <link
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        rel="stylesheet"
      ></link>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">EmotionTrack</h1>
              <p className="text-blue-100 text-sm">
                Sistema de Análise Emocional
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-2">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <a href="/dashboard">
                <button
                  type="button"
                  className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
              </a>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock size={14} />
                <span>{formattedDate}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                Relatório Profissional
              </h2>
              <p className="text-gray-500 text-sm">
                Compartilhe suas análises e observações sobre seu estado
                emocional
              </p>
            </div>

            {!isLogged ? (
              <NotLoggedView />
            ) : (
              <LoggedView
                userName={userName}
                report={report}
                setReport={setReport}
                emotion={emotion}
                severity={severity}
                emotionOptions={emotionOptions}
                severityOptions={severityOptions}
                handleEmotionChange={handleEmotionChange}
                handleSeverityChange={handleSeverityChange}
                saveDraft={saveDraft}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                saveStatus={saveStatus}
                validationError={validationError}
                isReportEmpty={isReportEmpty}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
            <span>EmotionTrack © 2025</span>
            <span>Análises Confidenciais</span>
          </div>
        </div>

        {/* Modal de notificação */}
        <NotificationModal
          isOpen={showModal}
          onClose={handleCloseModal}
          status={submitStatus}
          message={
            submitStatus === "success"
              ? "Seu relatório foi enviado com sucesso! Entraremos em contato se necessário."
              : "Ocorreu um erro ao enviar seu relatório. Por favor, tente novamente."
          }
        />
      </div>
    </>
  );
}

// Componente para visualização quando não logado
const NotLoggedView = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-6">
    <div className="flex justify-center mb-4">
      <AlertCircle size={48} className="text-blue-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-800 mb-2">Acesso Restrito</h3>
    <p className="text-gray-600 mb-4">
      Você precisa estar logado para preencher e enviar um relatório emocional.
    </p>
    <a
      href="/login"
      className="inline-block px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
    >
      Fazer Login
    </a>
  </div>
);

// Componente para visualização quando logado
interface LoggedViewProps {
  userName: string;
  report: string;
  setReport: (value: string) => void;
  emotion: string;
  severity: string;
  emotionOptions: EmotionOption[];
  severityOptions: SeverityOption[];
  handleEmotionChange: (value: string) => void;
  handleSeverityChange: (value: string) => void;
  saveDraft: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  saveStatus: string;
  validationError: string;
  isReportEmpty: boolean;
}

const LoggedView = ({
  userName,
  report,
  setReport,
  emotion,
  severity,
  emotionOptions,
  severityOptions,
  handleEmotionChange,
  handleSeverityChange,
  saveDraft,
  handleSubmit,
  isSubmitting,
  saveStatus,
  validationError,
  isReportEmpty,
}: LoggedViewProps) => (
  <div>
    <div className="space-y-6">
      {/* User info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Funcionário
        </label>
        <div className="flex bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 items-center">
          <User size={18} className="text-gray-500 mr-3" />
          <span className="font-medium text-gray-800">{userName}</span>
        </div>
      </div>

      {/* Emotion selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado Emocional Principal
        </label>
        <div className="flex space-x-3">
          {emotionOptions.map((option) => (
            <EmotionOptionButton
              key={option.value}
              option={option}
              isSelected={emotion === option.value}
              onChange={handleEmotionChange}
            />
          ))}
        </div>
      </div>

      {/* Report content */}
      <div>
        <label
          htmlFor="report"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Análise Detalhada
        </label>
        <textarea
          id="report"
          placeholder="Descreva sua análise profissional sobre o estado emocional, comportamento e recomendações..."
          value={report}
          onChange={(e) => setReport(e.target.value)}
          rows={8}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
        />

        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-500">
            {report.length} caracteres
          </span>
        </div>
      </div>

      <div className="mt-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <div className="flex items-start">
          <AlertCircle
            size={18}
            className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="font-medium text-yellow-800 mb-1">
              Importante: Sobre anexos e destinatários
            </p>
            <p className="text-yellow-700">
              Qualquer tipo de anexo deve encaminhado
              diretamente para os emails de autoridades responsáveis como
              psicólogos e líderes (<strong>dsglucass@gmail.com</strong> e{" "}
              <strong>aaron.msilva56@gmail.com</strong>). Certifique-se de que
              os materiais compartilhados são apropriados e relevantes para
              análise.
            </p>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="mt-2 text-sm text-rose-600 flex items-center">
          <AlertCircle size={16} className="mr-1" />
          {validationError}
        </div>
      )}

      {/* Analysis severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nível de Atenção Requerido
        </label>
        <div className="flex space-x-3">
          {severityOptions.map((option) => (
            <SeverityOptionButton
              key={option.value}
              option={option}
              isSelected={severity === option.value}
              onChange={handleSeverityChange}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Action buttons */}
    <div className="mt-8 flex space-x-4">
      <button
        type="button"
        onClick={saveDraft}
        disabled={isReportEmpty}
        className={`px-5 py-3 border rounded-lg flex-1 flex items-center justify-center transition-all focus:outline-none focus:ring-2 ${
          isReportEmpty
            ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200"
        }`}
      >
        <Save size={18} className="mr-2" />
        Salvar Rascunho
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || isReportEmpty}
        className={`px-5 py-3 rounded-lg text-white flex-1 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          isSubmitting
            ? "bg-green-500"
            : isReportEmpty
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
        }`}
      >
        {isSubmitting ? (
          <>
            <CheckCircle size={18} className="mr-2" />
            Enviando...
          </>
        ) : (
          <>
            <Send size={18} className="mr-2" />
            Enviar Relatório
          </>
        )}
      </button>
    </div>

    {/* Save status message */}
    {saveStatus && (
      <div className="mt-4 text-center text-sm text-green-600">
        <CheckCircle size={16} className="inline mr-1" />
        {saveStatus}
      </div>
    )}
  </div>
);

// Componente para botão de opção de emoção
interface EmotionOptionButtonProps {
  option: EmotionOption;
  isSelected: boolean;
  onChange: (value: string) => void;
}

const EmotionOptionButton = ({
  option,
  isSelected,
  onChange,
}: EmotionOptionButtonProps) => (
  <div className="relative flex-1">
    <input
      type="radio"
      name="emotion"
      id={`emotion-${option.value}`}
      value={option.value}
      className="sr-only"
      checked={isSelected}
      onChange={() => onChange(option.value)}
    />
    <label
      htmlFor={`emotion-${option.value}`}
      className={`h-12 flex flex-col items-center justify-center border rounded-lg ${
        isSelected
          ? "bg-blue-500 border-blue-500 text-white ring-2 ring-blue-300"
          : "text-gray-600 border-gray-300 hover:bg-gray-50"
      } cursor-pointer transition-all block w-full`}
    >
      <span className="text-xl mb-1">{option.icon}</span>
      <span className="text-xs">{option.value}</span>
    </label>
  </div>
);

// Componente para botão de opção de severidade
interface SeverityOptionButtonProps {
  option: SeverityOption;
  isSelected: boolean;
  onChange: (value: string) => void;
}

const SeverityOptionButton = ({
  option,
  isSelected,
  onChange,
}: SeverityOptionButtonProps) => (
  <div className="relative flex-1">
    <input
      type="radio"
      name="severity"
      id={`severity-${option.value}`}
      value={option.value}
      className="sr-only"
      checked={isSelected}
      onChange={() => onChange(option.value)}
    />
    <label
      htmlFor={`severity-${option.value}`}
      className={`h-10 flex items-center justify-center border rounded-lg ${
        isSelected
          ? "bg-blue-500 border-blue-500 text-white ring-2 ring-blue-300"
          : "text-gray-600 border-gray-300 hover:bg-gray-50"
      } cursor-pointer transition-all block w-full`}
    >
      <div className={`w-3 h-3 ${option.color} rounded-full mr-2`}></div>
      {option.value}
    </label>
  </div>
);
