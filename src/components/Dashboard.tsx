"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import {
  Camera,
  Upload,
  Play,
  Square,
  Download,
  BarChart,
  Home,
  ChevronRight,
  AlertCircle,
  Brain,
  Timer,
  NotepadText,
} from "lucide-react";
import Head from "next/head";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const router = useRouter();
  const { isLogged, userName } = useAuth();

  // Estados da análise
  const [data, setData] = useState<ChartData<"bar">>({
    labels: [
      "felicidade",
      "tristeza",
      "raiva",
      "estresse",
      "nojo",
      "surpresa",
      "neutro",
    ],
    datasets: [
      {
        label: "Emoções Detectadas",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          "rgba(34, 197, 94, 0.85)", // verde mais moderno
          "rgba(239, 68, 68, 0.85)", // vermelho mais moderno
          "rgba(59, 130, 246, 0.85)", // azul mais moderno
          "rgba(168, 85, 247, 0.85)", // roxo mais moderno
          "rgba(14, 165, 233, 0.85)", // ciano mais moderno
          "rgba(234, 179, 8, 0.85)", // amarelo mais moderno
          "rgba(107, 114, 128, 0.85)", // cinza mais moderno
        ],
      },
    ],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState<"singleImage" | "continuous">("singleImage");
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);

  // Refs
  const dataPollingInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Autenticação

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/health");
        if (!response.ok) {
          setErrorMessage("Servidor indisponível. Verifique a conexão.");
        }
      } catch (error) {
        console.error("Erro ao verificar status do servidor:", error);
        setErrorMessage("Servidor indisponível. Verifique a conexão.");
      }
    };

    checkServerStatus();

    return () => {
      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Funções de análise (mantidas iguais)
  const setupVideoStream = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      return stream;
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      setErrorMessage(
        "Não foi possível acessar a câmera. Verifique as permissões."
      );
      throw error;
    }
  };

  const captureImage = async () => {
    try {
      let stream = streamRef.current;
      if (!stream) {
        stream = await setupVideoStream();
      }

      let video = videoRef.current;
      if (!video) {
        video = document.createElement("video");
        video.srcObject = stream;
        await video.play();
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Não foi possível criar contexto de canvas");
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setLastImageUrl(canvas.toDataURL("image/jpeg"));

      return new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              throw new Error("Falha ao converter canvas para blob");
            }
          },
          "image/jpeg",
          0.9
        );
      });
    } catch (error) {
      console.error("Erro ao capturar imagem:", error);
      setErrorMessage("Não foi possível capturar imagem da câmera");
      throw error;
    }
  };

  const analyzeSingleImage = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const imageBlob = await captureImage();

      const formData = new FormData();
      formData.append("file", imageBlob, "image.jpg");

      const response = await fetch("http://localhost:8000/analyze-emotion/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      console.log("Resultado da análise:", result);

      if (Object.keys(result).length === 0) {
        setErrorMessage("Nenhuma emoção detectada na imagem");
        return;
      }

      updateChartData(result);
    } catch (error) {
      console.error("Erro ao analisar imagem:", error);
      setErrorMessage(
        "Erro ao analisar imagem. Verifique o console para detalhes."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startContinuousAnalysis = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      await setupVideoStream();

      const response = await fetch(
        "http://localhost:8000/start-continuous-analysis/",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao iniciar análise contínua: ${response.status}`);
      }

      const result = await response.json();
      console.log(result.message);

      setIsAnalyzing(true);
      setTotalAnalyzed(0);

      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
      }

      dataPollingInterval.current = setInterval(fetchEmotionData, 300);
      await captureImage();
    } catch (error) {
      console.error("Erro ao iniciar análise contínua:", error);
      setErrorMessage("Erro ao iniciar a análise contínua");
    } finally {
      setIsLoading(false);
    }
  };

  const captureFrame = async () => {
    try {
      if (!videoRef.current || !streamRef.current) return;

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL("image/jpeg");
      setLastImageUrl(imageUrl);

      return new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      });
    } catch (error) {
      console.error("Erro ao capturar frame:", error);
    }
  };

  const stopContinuousAnalysis = async () => {
    try {
      setIsLoading(true);

      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
        dataPollingInterval.current = null;
      }

      const response = await fetch(
        "http://localhost:8000/stop-continuous-analysis/",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao parar análise: ${response.status}`);
      }

      const result = await response.json();
      console.log(result.message);

      await fetchEmotionData();
      setIsAnalyzing(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error("Erro ao parar análise:", error);
      setErrorMessage("Erro ao parar a análise");
      setIsAnalyzing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmotionData = async () => {
    try {
      const [response, imageBlob] = await Promise.all([
        fetch("http://localhost:8000/get-emotion-data/"),
        captureFrame(),
      ]);

      if (!response.ok) throw new Error(`Erro: ${response.status}`);

      const emotionData = await response.json();
      console.log("Dados recebidos:", emotionData);

      updateChartData(emotionData);
      setTotalAnalyzed((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setErrorMessage("Erro ao receber dados da análise contínua");
    }
  };

  const updateChartData = (emotionData: Record<string, number>) => {
    const defaultLabels = [
      "Felicidade",
      "Tristeza",
      "Raiva",
      "Estresse",
      "Nojo",
      "Surpresa",
      "Neutro",
    ];

    const values = defaultLabels.map((label) => {
      return emotionData[label] || 0;
    });

    const updatedData = {
      labels: defaultLabels,
      datasets: [
        {
          label: "Emoções Detectadas",
          data: values,
          backgroundColor: [
            "rgba(34, 197, 94, 0.85)", // verde mais moderno
            "rgba(239, 68, 68, 0.85)", // vermelho mais moderno
            "rgba(59, 130, 246, 0.85)", // azul mais moderno
            "rgba(168, 85, 247, 0.85)", // roxo mais moderno
            "rgba(14, 165, 233, 0.85)", // ciano mais moderno
            "rgba(234, 179, 8, 0.85)", // amarelo mais moderno
            "rgba(107, 114, 128, 0.85)", // cinza mais moderno
          ],
        },
      ],
    };

    setData(updatedData);
  };

  const exportData = () => {
    if (!data.labels || !data.datasets[0].data) return;

    const labels = data.labels;
    const values = data.datasets[0].data;

    const csvContent = [
      "Emoção,Contagem",
      ...labels.map((label, index) => `${label},${values[index]}`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "analise_emocoes.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
    window.location.href = "/";
  };

  const options: ChartOptions<"bar"> = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Contagem",
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Análise de Emoções",
      },
      legend: {
        display: false,
      },
    },
    animation: {
      duration: 500,
    },
    maintainAspectRatio: false,
  };

  const getEmotionText = () => {
    if (!data.labels || data.labels.length === 0)
      return "Nenhuma emoção detectada";

    let highestIndex = 0;
    let highestValue = 0;

    data.datasets[0].data.forEach((value: any, index) => {
      if (value > highestValue) {
        highestValue = value as number;
        highestIndex = index;
      }
    });

    if (highestValue === 0) return "Nenhuma emoção predominante";

    return `Emoção predominante: ${data.labels[highestIndex]}`;
  };

  const getEmotionColor = () => {
    if (!data.labels || data.labels.length === 0) return "bg-gray-500";

    let highestIndex = 0;
    let highestValue = 0;

    data.datasets[0].data.forEach((value: any, index) => {
      if (value > highestValue) {
        highestValue = value as number;
        highestIndex = index;
      }
    });

    if (highestValue === 0) return "bg-gray-500";

    const colors = [
      "bg-green-500", // felicidade
      "bg-red-500", // tristeza
      "bg-blue-500", // raiva
      "bg-purple-500", // estresse
      "bg-sky-500", // nojo
      "bg-yellow-500", // surpresa
      "bg-gray-500", // neutro
    ];

    return colors[highestIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 text-white">
      <Head>
        <title>EmotionTrack | Análise Facial em Tempo Real</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      <link
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        rel="stylesheet"
      ></link>
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-xl relative z-10 transition-all duration-300 hover:brightness-105">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e título */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <h1 className="flex items-center text-2xl font-bold text-white transition-all duration-300 group-hover:tracking-wider">
                <Brain className="text-white h-8 w-8 mr-2 animate-pulse group-hover:scale-110 transition-transform duration-300" />
                <span>EmotionTrack</span>
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="p-2 rounded-full hover:bg-black transition duration-200"
              >
                <Home size={20} className="text-white" />
              </a>
              <div
                className={`px-3 py-1 rounded-full text-sm shadow-inner backdrop-blur-sm ${
                  isAnalyzing
                    ? "bg-green-100 text-green-800"
                    : "bg-white/20 text-white"
                }`}
              >
                <span className="flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isAnalyzing ? "bg-green-500 animate-ping" : "bg-white"
                    }`}
                  ></span>
                  {isAnalyzing ? "ANÁLISE ATIVA" : "PRONTO"}
                </span>
              </div>

              {isLogged ? (
                <div className="flex items-center space-x-3">
                  <div className="text-white/90 text-sm font-medium leading-tight">
                    <p className="text-xs text-white/70">Logado como:</p>
                    <p className="font-semibold">{userName || "Usuário"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-black transition-all duration-200 backdrop-blur-md shadow-sm"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <a
                    href="/"
                    className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/30 transition duration-200 backdrop-blur-md shadow-sm"
                  >
                    Entrar
                  </a>
                  <a
                    href="/register"
                    className="px-4 py-2 rounded-md bg-white text-indigo-600 hover:bg-gray-100 transition duration-200 shadow-sm"
                  >
                    Cadastrar
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 py-4 px-6">
                <h2 className="text-white text-xl font-bold flex items-center">
                  <span className="mr-2">Painel de Controle</span>
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Mode Selection */}
                {isLogged ? (
                  <>
                    <>
                      <div>
                        <h3 className="text-gray-700 font-medium mb-3">
                          Modo de Análise
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setMode("singleImage")}
                            className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                              mode === "singleImage"
                                ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
                                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            <Camera className="mr-2" size={18} />
                            <span>Imagem Única</span>
                          </button>
                          <button
                            onClick={() => setMode("continuous")}
                            className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                              mode === "continuous"
                                ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
                                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            <Timer className="mr-2" size={18} />
                            <span>Análise Contínua</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-gray-700 font-medium mb-3">
                          Controles
                        </h3>
                        {mode === "singleImage" ? (
                          <button
                            onClick={analyzeSingleImage}
                            disabled={isLoading}
                            className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                              isLoading
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            <Camera className="mr-2" size={18} />
                            {isLoading ? (
                              <span className="flex items-center">
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
                                Analisando...
                              </span>
                            ) : (
                              "Capturar e Analisar"
                            )}
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={startContinuousAnalysis}
                              disabled={isLoading || isAnalyzing}
                              className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                                isLoading || isAnalyzing
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              }`}
                            >
                              <Play className="mr-2" size={18} />
                              {isLoading ? (
                                <span className="flex items-center">
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
                                  Iniciando...
                                </span>
                              ) : (
                                "Iniciar"
                              )}
                            </button>
                            <button
                              onClick={stopContinuousAnalysis}
                              disabled={!isAnalyzing || isLoading}
                              className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                                !isAnalyzing || isLoading
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              }`}
                            >
                              <Square className="mr-2" size={18} />
                              Parar
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-3">
                        Exportação
                      </h3>
                      <button
                        onClick={exportData}
                        disabled={!data.labels || data.labels.length === 0}
                        className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                          !data.labels || data.labels.length === 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Download className="mr-2" size={18} />
                        Exportar CSV
                      </button>
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-3">
                        Reportar
                      </h3>
                      <span className="text-black">
                        Nesta seção, será necessário que a partir de um certo
                        nível/porcentagem de estresse a IA automaticamente gere
                        um diagnóstico e um alerta, juntamente com o envio para
                        uma autoridade. Porém, o usuário pode gerar este
                        relatório por escrito que a IA gera a partir da análise
                        efetuada.
                      </span>
                      <button
                        className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                          !data.labels || data.labels.length === 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <NotepadText className="mr-2" size={18} />
                        Gerar Relatório
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <>
                      <div>
                        <div className="flex items-center space-x-3 group cursor-pointer">
                          <h1 className="flex items-center text-3xl font-bold text-black transition-all duration-300 group-hover:tracking-wider mb-6">
                            <span>
                              Você precisa entrar para acessar este recurso.
                            </span>
                          </h1>
                        </div>
                        <h3 className="text-gray-700 font-medium mb-3">
                          Modo de Análise
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            disabled
                            onClick={() => setMode("singleImage")}
                            className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                              mode === "singleImage"
                                ? "text-indigo-700 border-2"
                                : "bg-gray-300 text-black"
                            }`}
                          >
                            <Camera className="mr-2" size={18} />
                            <span>Imagem Única</span>
                          </button>
                          <button
                            disabled
                            onClick={() => setMode("continuous")}
                            className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                              mode === "continuous"
                                ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
                                : "text-gray-700 border border-gray-200"
                            }`}
                          >
                            <Timer className="mr-2" size={18} />
                            <span>Análise Contínua</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-gray-700 font-medium mb-3">
                          Controles
                        </h3>
                        {mode === "singleImage" ? (
                          <button
                            onClick={analyzeSingleImage}
                            disabled
                            className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                              isLoading
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-gray-300 text-black"
                            }`}
                          >
                            <Camera className="mr-2" size={18} />
                            {isLoading ? (
                              <span className="flex items-center">
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
                                Analisando...
                              </span>
                            ) : (
                              "Capturar e Analisar"
                            )}
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={startContinuousAnalysis}
                              disabled
                              className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                                isLoading || isAnalyzing
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-gray-300 text-black"
                              }`}
                            >
                              <Play className="mr-2" size={18} />
                              {isLoading ? (
                                <span className="flex items-center">
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
                                  Iniciando...
                                </span>
                              ) : (
                                "Iniciar"
                              )}
                            </button>
                            <button
                              onClick={stopContinuousAnalysis}
                              disabled
                              className={`px-4 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                                !isAnalyzing || isLoading
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-gray-300 text-black"
                              }`}
                            >
                              <Square className="mr-2" size={18} />
                              Parar
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-3">
                        Exportação
                      </h3>
                      <button
                        onClick={exportData}
                        disabled
                        className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                          !data.labels || data.labels.length === 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gray-300 text-black"
                        }`}
                      >
                        <Download className="mr-2" size={18} />
                        Exportar CSV
                      </button>
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-3">
                        Reportar
                      </h3>
                      <button
                        disabled
                        className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                          !data.labels || data.labels.length === 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gray-300 text-black"
                        }`}
                      >
                        <NotepadText className="mr-2" size={18} />
                        Gerar Relatório
                      </button>
                    </div>
                  </>
                )}

                {/* Analysis Status */}
                {isAnalyzing && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-blue-800 font-medium mb-2">
                      Status da Análise
                    </h3>

                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-700">Frames analisados:</span>
                      <span className="font-medium text-blue-900">
                        {totalAnalyzed}
                      </span>
                    </div>

                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(totalAnalyzed, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-3">
            {/* Image Preview */}
            {lastImageUrl && (
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-8">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-6">
                  <h2 className="text-white text-xl font-bold">
                    Última Captura
                  </h2>
                </div>

                <div className="p-6">
                  <div className="relative rounded-xl overflow-hidden shadow-inner border border-gray-200">
                    <img
                      src={lastImageUrl}
                      alt="Preview"
                      className="w-full h-auto object-contain"
                    />
                    <div
                      className={`absolute bottom-0 left-0 right-0 ${getEmotionColor()} text-white py-3 px-4 font-medium text-center backdrop-blur-sm bg-opacity-90`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-2">🎯</span>
                        {getEmotionText()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Results */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-6">
                <h2 className="text-white text-xl font-bold">
                  Resultados da Análise
                </h2>
              </div>

              <div className="p-6">
                <div className="h-72 mb-6">
                  <Bar
                    data={data}
                    options={{
                      ...options,
                      plugins: {
                        ...options.plugins,
                        tooltip: {
                          callbacks: {
                            label: (context) =>
                              `${context.label}: ${context.raw}%`,
                          },
                        },
                      },
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  {data.labels &&
                    data.labels.map((label: any, index: any) => (
                      <div
                        key={index}
                        className="flex items-center bg-gray-50 px-3 py-2 rounded-md"
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: (
                              data.datasets[0].backgroundColor as string[]
                            )[index],
                          }}
                        ></div>
                        <span className="text-sm text-gray-700">{label}</span>
                      </div>
                    ))}
                </div>

                {/* Info Panel */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-blue-800 font-medium mb-2 flex items-center">
                    <ChevronRight size={18} className="mr-1" />
                    Sobre a Análise
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Este sistema detecta expressões faciais em tempo real usando
                    visão computacional. As emoções são classificadas com base
                    nos padrões faciais detectados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden video element */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        width="640"
        height="480"
        muted
        playsInline
      />
    </div>
  );
}
