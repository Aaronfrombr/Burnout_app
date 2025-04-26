"use client";
import { useState, useEffect, useRef } from "react";
import { Home } from "lucide-react";
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
import { Camera, Upload, Play, Square, Download, BarChart } from "lucide-react";
import styles from "../styles/Dashboard.module.css";
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
  const [data, setData] = useState<ChartData<"bar">>({
    labels: ["felicidade", "tristeza", "raiva", "estresse", "nojo", "surpresa", "neutro"],
    datasets: [
      {
        label: "Emoções Detectadas",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          "rgba(0, 255, 0, 0.8)",       // Verde para Felicidade
          "rgba(255, 0, 0, 0.8)",        // Azul para Tristeza
          "rgba(0, 0, 255, 0.8)",        // Vermelho para Raiva
          "rgba(255, 0, 255, 0.8)",      // Magenta para Estresse
          "rgba(0, 255, 255, 0.8)",      // Amarelo para Nojo
          "rgba(255, 255, 0, 0.8)",      // Ciano para Surpresa
          "rgba(200, 200, 200, 0.8)",   // Cinza para Neutro
        ],
      },
    ],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState("");
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState<"singleImage" | "continuous">("singleImage");
  const dataPollingInterval = useRef<NodeJS.Timeout | null>(null);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsLogged(true);
        setUsername(userData.name);
      } catch (e) {
        console.error("Erro ao recuperar dados de usuário:", e);
      }
    }

    return () => {
      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const setupVideoStream = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      return stream;
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      setErrorMessage("Não foi possível acessar a câmera. Verifique as permissões.");
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
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            throw new Error("Falha ao converter canvas para blob");
          }
        }, "image/jpeg", 0.9);
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
      setErrorMessage("Erro ao analisar imagem. Verifique o console para detalhes.");
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
  
      // Atualizar mais rapidamente (a cada 300ms)
      dataPollingInterval.current = setInterval(fetchEmotionData, 300);
      
      // Capturar imagem inicial
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
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/jpeg", 0.8);
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
        streamRef.current.getTracks().forEach(track => track.stop());
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
        captureFrame()
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
    const defaultLabels = ["felicidade", "tristeza", "raiva", "estresse", "nojo", "surpresa", "neutro"];
    
    const values = defaultLabels.map(label => {
      return emotionData[label] || 0;
    });
  
    const updatedData = {
      labels: defaultLabels,
      datasets: [
        {
          label: "Emoções Detectadas",
          data: values,
          backgroundColor: [
            "rgba(0, 255, 0, 0.8)",
            "rgba(255, 0, 0, 0.8)",
            "rgba(0, 0, 255, 0.8)",
            "rgba(255, 0, 255, 0.8)",
            "rgba(0, 255, 255, 0.8)",
            "rgba(255, 255, 0, 0.8)",
            "rgba(200, 200, 200, 0.8)",
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
    sessionStorage.removeItem('user');
    setIsLogged(false);
    setUsername("");
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

  return (
    <>
      <Head>
        <title>WellBeing | Análise Facial em Tempo Real</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <li className={styles.navItem} title="Home">
                <Home size={20} />
              </li>
              <BarChart className={styles.titleIcon} size={28} />
              Insights Faciais | Emocional em Foco
            </h1>
            <nav className={styles.navBar}>
              <span className={styles.statusBadge}>
                {isAnalyzing ? "Análise em tempo real" : "Pronto para análise"}
              </span>
              <ul className={styles.navLinks}>
                {isLogged ? (
                  <>
                    <li className={styles.navItem} onClick={handleLogout}>Sair</li>
                    <li className={styles.navItem}>Bem-Vindo(a): {username}</li>
                  </>
                ) : (
                  <>
                    <li className={styles.navItem}>
                      <a href="/">Entrar</a>
                    </li>
                    <li className={styles.navItem}>
                      <a href="/register">Cadastrar</a>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </header>

        <div className={styles.container}>
          <div className={styles.gridLayout}>
            <div className={styles.controlPanel}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Painel de Controle</h2>

                <div className={styles.controlSection}>
                  <h3 className={styles.sectionTitle}>Modo de Análise</h3>
                  <div className={styles.buttonGrid}>
                    <button
                      onClick={() => setMode("singleImage")}
                      className={`${styles.modeButton} ${
                        mode === "singleImage" ? styles.activeButton : ""
                      }`}
                    >
                      <Camera className={styles.buttonIcon} size={18} />
                      <span>Imagem Única</span>
                    </button>
                    <button
                      onClick={() => setMode("continuous")}
                      className={`${styles.modeButton} ${
                        mode === "continuous" ? styles.activeButton : ""
                      }`}
                    >
                      <Upload className={styles.buttonIcon} size={18} />
                      <span>Análise Contínua</span>
                    </button>
                  </div>
                </div>

                <div className={styles.controlSection}>
                  <h3 className={styles.sectionTitle}>Controles</h3>
                  {mode === "singleImage" ? (
                    <button
                      onClick={analyzeSingleImage}
                      disabled={isLoading}
                      className={`${styles.actionButton} ${
                        styles.primaryButton
                      } ${isLoading ? styles.disabledButton : ""}`}
                    >
                      <Camera className={styles.buttonIcon} size={18} />
                      {isLoading ? "Analisando..." : "Capturar e Analisar"}
                    </button>
                  ) : (
                    <div className={styles.buttonGrid}>
                      <button
                        onClick={startContinuousAnalysis}
                        disabled={isLoading || isAnalyzing}
                        className={`${styles.actionButton} ${
                          styles.successButton
                        } ${
                          isLoading || isAnalyzing ? styles.disabledButton : ""
                        }`}
                      >
                        <Play className={styles.buttonIcon} size={18} />
                        {isLoading ? "Iniciando..." : "Iniciar"}
                      </button>
                      <button
                        onClick={stopContinuousAnalysis}
                        disabled={!isAnalyzing || isLoading}
                        className={`${styles.actionButton} ${
                          styles.dangerButton
                        } ${
                          !isAnalyzing || isLoading ? styles.disabledButton : ""
                        }`}
                      >
                        <Square className={styles.buttonIcon} size={18} />
                        Parar
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.controlSection}>
                  <h3 className={styles.sectionTitle}>Exportação</h3>
                  <button
                    onClick={exportData}
                    disabled={!data.labels || data.labels.length === 0}
                    className={`${styles.actionButton} ${
                      styles.secondaryButton
                    } ${
                      !data.labels || data.labels.length === 0
                        ? styles.disabledButton
                        : ""
                    }`}
                  >
                    <Download className={styles.buttonIcon} size={18} />
                    Exportar CSV
                  </button>
                </div>

                {isAnalyzing && (
                  <div className={styles.statusPanel}>
                    <h3 className={styles.statusTitle}>Status da Análise</h3>
                    <div className={styles.statusInfo}>
                      <span>Frames analisados:</span>
                      <span className={styles.statusValue}>
                        {totalAnalyzed}
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressValue} 
                        style={{ width: `${Math.min(totalAnalyzed, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className={styles.errorMessage}>
                    <p className={styles.errorText}>
                      <span className={styles.errorIcon}>⚠️</span>
                      {errorMessage}
                    </p>
                  </div>
                )}
              </div>
              
              <video 
                ref={videoRef}
                style={{ display: 'none' }}
                width="640"
                height="480"
                muted
                playsInline
              />
            </div>

            <div className={styles.resultsColumn}>
              {lastImageUrl && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Última Captura</h2>
                  <div className={styles.imagePreview}>
                    <img
                      src={lastImageUrl}
                      alt="Preview"
                      className={styles.previewImage}
                    />
                    <div className={styles.imageOverlay}>
                      {getEmotionText()}
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Resultados da Análise</h2>
                <div className={styles.chartContainer}>
                  <Bar data={data} options={options} />
                </div>
                <div className={styles.legendGrid}>
                  {data.labels &&
                    data.labels.map((label: any, index: any) => (
                      <div key={index} className={styles.legendItem}>
                        <div
                          className={styles.colorIndicator}
                          style={{
                            backgroundColor: (
                              data.datasets[0].backgroundColor as string[]
                            )[index],
                          }}
                        ></div>
                        <span className={styles.legendLabel}>{label}</span>
                      </div>
                    ))}
                </div>
                <div className={styles.infoPanel}>
                  <h3 className={styles.infoTitle}>Sobre a Análise</h3>
                  <p className={styles.infoText}>
                    Este sistema detecta expressões faciais em tempo real usando
                    visão computacional. As emoções são classificadas com base
                    nos padrões faciais detectados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}