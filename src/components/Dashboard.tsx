"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [data, setData] = useState<ChartData<"bar", number[], string>>({
    labels: [
      "Felicidade",
      "Tristeza",
      "Raiva",
      "Estresse",
      "Nojo",
      "Surpresa",
      "Neutro",
    ],
    datasets: [
      {
        label: "Emoções Detectadas",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          "rgba(34, 197, 94, 0.85)",
          "rgba(239, 68, 68, 0.85)",
          "rgba(59, 130, 246, 0.85)",
          "rgba(168, 85, 247, 0.85)",
          "rgba(14, 165, 233, 0.85)",
          "rgba(234, 179, 8, 0.85)",
          "rgba(107, 114, 128, 0.85)",
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
  const [dominantEmotion, setDominantEmotion] = useState<string>("Nenhuma");
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const emotionMap: Record<string, string> = {
    happy: "Felicidade",
    sad: "Tristeza",
    angry: "Raiva",
    fear: "Estresse",
    disgust: "Nojo",
    surprise: "Surpresa",
    neutral: "Neutro",
  };

  // Inicializar câmera
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setErrorMessage("Não foi possível acessar a câmera");
      console.error("Erro ao acessar câmera:", err);
    }
  };

  // Parar câmera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Autenticação
  useEffect(() => {
    if (isLogged) {
      initCamera();
    }
  
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
      stopCamera();
      if (ws) {
        ws.close();
      }
    };
  }, [isLogged]);
  
  // Efeito separado para o WebSocket
  useEffect(() => {
    let websocket: WebSocket | null = null;
    let animationId: number | null = null;
    let lastAnalysisTime = 0;
    const ANALYSIS_INTERVAL = 300; // 300ms entre análises (~3 FPS)
  
    if (!isLogged || mode !== "continuous" || !isAnalyzing) return;
  
    websocket = new WebSocket("ws://localhost:8000/ws/analyze");
    setWs(websocket);
  
    const processMessage = (data: any) => {
      const emotionOrder = [
        "happy",
        "sad",
        "angry", 
        "fear",
        "disgust",
        "surprise",
        "neutral"
      ];
  
      const newData = emotionOrder.map(emotion => {
        const value = data.emotions[emotion] || 0;
        return Math.round(value * 100) / 100;
      });
  
      setData(prev => ({
        ...prev,
        datasets: [{
          ...prev.datasets[0],
          data: newData
        }]
      }));
  
      setDominantEmotion(emotionMap[data.dominant_emotion] || "Nenhuma");
      setTotalAnalyzed(prev => prev + 1);
    };
  
    const sendFrame = (timestamp: number) => {
      if (!isAnalyzing || !websocket || websocket.readyState !== WebSocket.OPEN) {
        if (animationId) cancelAnimationFrame(animationId);
        return;
      }
  
      if (timestamp - lastAnalysisTime >= ANALYSIS_INTERVAL) {
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (!context) return;
  
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
          canvas.toBlob(blob => {
            if (blob && websocket && websocket.readyState === WebSocket.OPEN) {
              try {
                websocket.send(blob);
                lastAnalysisTime = timestamp;
              } catch (error) {
                console.error("Erro ao enviar frame:", error);
                setIsAnalyzing(false);
              }
            }
          }, 'image/jpeg', 0.7);
        }
      }
  
      animationId = requestAnimationFrame(sendFrame);
    };
  
    websocket.onopen = () => {
      console.log("WebSocket conectado");
      animationId = requestAnimationFrame(sendFrame);
    };
  
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'analysis_result') {
        processMessage(message.data);
      }
      else if (message.type === "ping") {
        // Responde ao ping do servidor
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({ type: "pong" }));
        }
      }
    };
  
    websocket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
      setIsAnalyzing(false);
    };
  
    websocket.onclose = () => {
      console.log("WebSocket fechado");
      setIsAnalyzing(false);
    };
  
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (websocket) {
        websocket.close();
      }
    };
  }, [isLogged, mode, isAnalyzing]);
  // Atualizar gráfico
  const updateChartData = (emotionData: Record<string, number>) => {
    const labels = [
      "Felicidade",
      "Tristeza",
      "Raiva",
      "Estresse",
      "Nojo",
      "Surpresa",
      "Neutro",
    ];

    const values = labels.map((label) => {
      const key = Object.keys(emotionMap).find((k) => emotionMap[k] === label);
      return key ? emotionData[key] || 0 : 0;
    });

    setData((prevData) => ({
      labels,
      datasets: [
        {
          ...prevData.datasets[0],
          data: values,
        },
      ],
    }));
  };

  const analyzeSingleImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      // Capturar frame do vídeo
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Obter URL da imagem para exibição
      const imageUrl = canvas.toDataURL("image/jpeg");
      setLastImageUrl(imageUrl);

      // Enviar para análise
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Falha ao criar blob da imagem"));
          },
          "image/jpeg",
          0.95
        );
      });

      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const response = await fetch("http://localhost:8000/analyze/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro na análise da imagem");
      }

      const result = await response.json();

      if (result.success) {
        updateChartData(result.result.emotions);
        setDominantEmotion(
          emotionMap[result.result.dominant_emotion] || "Nenhuma"
        );
        setTotalAnalyzed((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Erro na análise:", err);
      setErrorMessage("Erro ao analisar imagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const startContinuousAnalysis = async () => {
    if (!isLogged) return;
  
    setIsAnalyzing(true);
    setErrorMessage("");
    setTotalAnalyzed(0);
    setData({
      labels: ["Felicidade", "Tristeza", "Raiva", "Estresse", "Nojo", "Surpresa", "Neutro"],
      datasets: [{
        label: "Emoções Detectadas",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          "rgba(34, 197, 94, 0.85)",
          "rgba(239, 68, 68, 0.85)",
          "rgba(59, 130, 246, 0.85)",
          "rgba(168, 85, 247, 0.85)",
          "rgba(14, 165, 233, 0.85)",
          "rgba(234, 179, 8, 0.85)",
          "rgba(107, 114, 128, 0.85)"
        ]
      }]
    });
  
    const websocket = new WebSocket("ws://localhost:8000/ws/analyze");
    setWs(websocket);
  
    // Controle de taxa de envio (3 FPS)
    const FPS = 3;
    const interval = 1000 / FPS;
    let lastSendTime = 0;
  
    const sendFrame = (timestamp: number) => {
      if (!isAnalyzing || websocket.readyState !== WebSocket.OPEN) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }
  
      if (timestamp - lastSendTime >= interval) {
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");
          if (!context) return;
  
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
          // Usar Blob para melhor performance
          canvas.toBlob(blob => {
            if (blob && websocket.readyState === WebSocket.OPEN) {
              try {
                websocket.send(blob);
                lastSendTime = timestamp;
                setLastImageUrl(canvas.toDataURL("image/jpeg"));
              } catch (error) {
                console.error("Erro ao enviar frame:", error);
                stopContinuousAnalysis();
              }
            }
          }, "image/jpeg", 0.7);
        }
      }
  
      animationRef.current = requestAnimationFrame(sendFrame);
    };
  
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "analysis_result") {
        const emotionOrder = ["happy", "sad", "angry", "fear", "disgust", "surprise", "neutral"];
        const newData = emotionOrder.map(emotion => message.data.emotions[emotion] || 0);
        
        setData(prev => ({
          ...prev,
          datasets: [{
            ...prev.datasets[0],
            data: newData
          }]
        }));
  
        setDominantEmotion(emotionMap[message.data.dominant_emotion] || "Nenhuma");
        setTotalAnalyzed(prev => prev + 1);
      }
    };
  
    websocket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
      setErrorMessage("Erro na conexão com o servidor");
      stopContinuousAnalysis();
    };
  
    websocket.onclose = () => {
      if (isAnalyzing) {
        setErrorMessage("Conexão com o servidor foi fechada");
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsAnalyzing(false);
    };
  
    animationRef.current = requestAnimationFrame(sendFrame);
  };
  
  const stopContinuousAnalysis = () => {
    setIsAnalyzing(false);
    
    if (ws) {
      // Fecha a conexão com código normal (1000)
      ws.close(1000, "Encerramento solicitado pelo usuário");
      setWs(null);
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // Exportar dados
  const exportToPDF = () => {
    if (!data?.labels || !data?.datasets?.[0]?.data) return;
  
    const doc = new jsPDF();
    const now = new Date().toLocaleString("pt-BR");
  
    // Título
    doc.setFontSize(16);
    doc.text("Relatório de Análise de Emoções", 14, 20);
  
    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${now}`, 14, 28);
  
    // Construir tabela
    const tableBody = data.labels.map((label, index) => [
      label,
      data.datasets[0].data[index],
    ]);
  
    autoTable(doc, {
      head: [["Tipo de Emoção", "Quantidade Detectada"]],
      body: tableBody,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
      foot: [["Total", data.datasets[0].data.reduce((a, b) => a + b, 0)]],
      footStyles: { fillColor: [230, 230, 230] },
    });
  
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    doc.save(`analise_emocoes_${timestamp}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
    router.push("/");
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

    data.datasets[0].data.forEach((value: number, index) => {
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
                          {isLoading ? "Analisando..." : "Capturar e Analisar"}
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

                    <div>
                      <h3 className="text-gray-700 font-medium mb-3">
                        Exportação
                      </h3>
                      <button
                        onClick={exportToPDF}
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
                      <h3 className="text-gray-700 font-medium">
                        Relatório Individual
                      </h3>
                      <span className="block text-sm bg-gray-300 rounded-lg px-2 py-1 text-purple-700 font-bold mt-1 mb-3">
                        O usuário efetuará um relatório individual com base na
                        análise das emoções efetuada em tempo real e encaminhará
                        para uma autoridade.
                      </span>
                      <a href="/report">
                        <button
                          className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 ${
                            !data.labels || data.labels.length === 0
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                        >
                          <NotepadText className="mr-2" size={18} />
                          Gerar Relatório
                        </button>
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center space-x-3 group cursor-pointer">
                        <h1 className="flex items-center text-xl font-bold text-black transition-all duration-300 group-hover:tracking-wider mb-6">
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
                            disabled
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

                    <div>
                      <h3 className="text-gray-700 font-medium mb-3">
                        Exportação
                      </h3>
                      <button
                        disabled
                        className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 bg-gray-300 text-gray-500 cursor-not-allowed`}
                      >
                        <Download className="mr-2" size={18} />
                        Exportar CSV
                      </button>
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium">
                        Relatório Individual
                      </h3>
                      <span className="block text-sm bg-gray-300 rounded-lg px-2 py-1 text-purple-700 font-bold mt-1 mb-3">
                        O usuário efetuará um relatório individual com base na
                        análise das emoções efetuada em tempo real e encaminhará
                        para uma autoridade.
                      </span>
                      <button
                        disabled
                        className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 bg-gray-300 text-gray-500 cursor-not-allowed`}
                      >
                        <NotepadText className="mr-2" size={18} />
                        Gerar Relatório
                      </button>
                    </div>
                  </>
                )}

                {/* Error message */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                    <AlertCircle
                      size={20}
                      className="mr-2 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-sm">{errorMessage}</span>
                  </div>
                )}

                {/* Status */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-gray-700 font-medium mb-2">Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Emoção atual</p>
                      <p className="font-medium text-gray-800">
                        {dominantEmotion}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Frames analisados</p>
                      <p className="font-medium text-gray-800">
                        {totalAnalyzed}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera View */}
            <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-4 px-6">
                <h2 className="text-white text-xl font-bold flex items-center">
                  <Camera className="mr-2" />
                  <span>Câmera</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="bg-black rounded-lg overflow-hidden relative aspect-video">
                  {isLogged ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800">
                      <div className="text-center p-6">
                        <Camera
                          className="mx-auto text-gray-400 mb-3"
                          size={48}
                        />
                        <p className="text-gray-300">
                          Faça login para acessar a câmera
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-3">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm font-medium text-white/60 mb-4">
              <a href="/" className="hover:text-white">
                Início
              </a>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-white">Dashboard</span>
            </nav>

            {/* Chart and Analysis */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-6">
                <h2 className="text-white text-xl font-bold flex items-center">
                  <BarChart className="mr-2" />
                  <span>Análise de Emoções</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="h-96 mb-8">
                  <Bar data={data} options={options} />
                </div>

                {/* Emotion Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-gray-700 font-medium mb-3">
                    Análise Emocional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Resultado da Análise
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {totalAnalyzed > 0
                          ? `A análise de ${totalAnalyzed} ${
                              totalAnalyzed === 1 ? "frame" : "frames"
                            } indica uma predominância da emoção ${dominantEmotion.toLowerCase()}.`
                          : "Inicie uma análise para visualizar os resultados."}
                      </p>
                      {totalAnalyzed > 0 && (
                        <p className="text-gray-600 text-sm mt-2">
                          {dominantEmotion === "Felicidade"
                            ? "Esta expressão indica um estado emocional positivo, geralmente associado com satisfação e bem-estar."
                            : dominantEmotion === "Tristeza"
                            ? "Esta expressão indica um estado emocional negativo, geralmente associado com perda ou desapontamento."
                            : dominantEmotion === "Raiva"
                            ? "Esta expressão indica um estado emocional de irritação ou fúria, frequentemente uma resposta a injustiça percebida."
                            : dominantEmotion === "Estresse"
                            ? "Esta expressão indica um estado de tensão ou ansiedade, frequentemente associado com situações desafiadoras."
                            : dominantEmotion === "Nojo"
                            ? "Esta expressão indica uma aversão ou repulsa, frequentemente uma resposta protetora a estímulos negativos."
                            : dominantEmotion === "Surpresa"
                            ? "Esta expressão indica uma reação a algo inesperado ou súbito, podendo ser positiva ou negativa."
                            : "Esta expressão indica ausência de emoções fortes ou claras no momento."}
                        </p>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 ${
                        totalAnalyzed > 0
                          ? getEmotionColor() + " text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <h4 className="text-sm font-medium mb-2">
                        Emoção Predominante
                      </h4>
                      <div className="text-center">
                        {dominantEmotion === "Felicidade" ? (
                          <div className="text-4xl mb-2">😊</div>
                        ) : dominantEmotion === "Tristeza" ? (
                          <div className="text-4xl mb-2">😢</div>
                        ) : dominantEmotion === "Raiva" ? (
                          <div className="text-4xl mb-2">😠</div>
                        ) : dominantEmotion === "Estresse" ? (
                          <div className="text-4xl mb-2">😰</div>
                        ) : dominantEmotion === "Nojo" ? (
                          <div className="text-4xl mb-2">🤢</div>
                        ) : dominantEmotion === "Surpresa" ? (
                          <div className="text-4xl mb-2">😲</div>
                        ) : (
                          <div className="text-4xl mb-2">😐</div>
                        )}
                        <p className="font-bold">{dominantEmotion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Captured Image */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 py-4 px-6">
                <h2 className="text-white text-xl font-bold flex items-center">
                  <span>Última Imagem Capturada</span>
                </h2>
              </div>
              <div className="p-6">
                {lastImageUrl ? (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={lastImageUrl}
                      alt="Última imagem capturada"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center">
                    <Camera className="text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500 text-center">
                      Nenhuma imagem capturada ainda. Inicie uma análise para
                      visualizar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-black py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                <Brain className="mr-2" size={20} />
                EmotionTrack
              </h3>
              <p className="text-gray-400 text-sm">
                Sistema de análise de emoções faciais em tempo real para
                monitoramento e avaliação emocional.
              </p>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">
                Links Rápidos
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Página Inicial
                  </a>
                </li>
                <li>
                  <a
                    href="/login"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a
                    href="/register"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Cadastro
                  </a>
                </li>
                <li>
                  <a
                    href="/report"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Relatórios
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Contato</h3>
              <p className="text-gray-400 text-sm mb-2">
                Envie dúvidas ou sugestões para nossa equipe.
              </p>
              <a
                href="mailto:dsglucass@gmail.com"
                className="text-indigo-400 hover:text-indigo-300 transition duration-200"
              >
                dsglucass@gmail.com
                <br></br>
                aaron.msilva56@gmail.com
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} EmotionTrack. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
