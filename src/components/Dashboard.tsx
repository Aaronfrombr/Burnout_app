'use client';
import { useState, useEffect, useRef } from "react";
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
import styles from '../styles/Dashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


export default function Dashboard() {
  const [data, setData] = useState<ChartData<"bar">>({
    labels: ["Felicidade", "Tristeza", "Raiva", "Estresse"],
    datasets: [
      {
        label: "Emoções Detectadas",
        data: [0, 0, 0, 0],
        backgroundColor: [
          "rgba(75, 192, 75, 0.8)",    // Verde para Felicidade
          "rgba(54, 162, 235, 0.8)",   // Azul para Tristeza
          "rgba(255, 99, 132, 0.8)",   // Vermelho para Raiva
          "rgba(255, 99, 255, 0.8)",   // Magenta para Estresse
        ],
      },
    ],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState<"singleImage" | "continuous">("singleImage");
  const dataPollingInterval = useRef<NodeJS.Timeout | null>(null);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Limpar intervalos quando o componente for desmontado
    return () => {
      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
      }
    };
  }, []);

  // Função para capturar imagem da webcam
  const captureImage = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx : any = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Salvar a imagem para preview
      setLastImageUrl(canvas.toDataURL('image/jpeg'));
      
      // Encerrar a stream após capturar
      stream.getTracks().forEach(track => track.stop());
      
      return new Promise<Blob>((resolve: any) => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
      });
    } catch (error) {
      console.error("Erro ao capturar imagem:", error);
      setErrorMessage("Não foi possível acessar a câmera");
      throw error;
    }
  };

  // Análise de uma única imagem
  const analyzeSingleImage = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Capturar imagem da webcam
      const imageBlob = await captureImage();
      
      // Enviar para o backend
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

      // Se não houver resultados, mostrar mensagem
      if (Object.keys(result).length === 0) {
        setErrorMessage("Nenhuma emoção detectada na imagem");
        return;
      }

      // Atualizar o gráfico com os dados recebidos
      updateChartData(result);
      
    } catch (error) {
      console.error("Erro ao analisar imagem:", error);
      setErrorMessage("Erro ao analisar imagem. Verifique o console para detalhes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar análise contínua
  const startContinuousAnalysis = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Chamar o endpoint para iniciar a análise contínua no backend
      const response = await fetch("http://localhost:8000/start-continuous-analysis/", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao iniciar análise contínua: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(result.message);
      
      // Iniciar polling para obter dados atualizados a cada 2 segundos
      setIsAnalyzing(true);
      setTotalAnalyzed(0);
      
      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
      }
      
      dataPollingInterval.current = setInterval(fetchEmotionData, 2000);
      
    } catch (error) {
      console.error("Erro ao iniciar análise contínua:", error);
      setErrorMessage("Erro ao iniciar a análise contínua");
    } finally {
      setIsLoading(false);
    }
  };

  // Parar análise contínua
  const stopContinuousAnalysis = async () => {
    try {
      setIsLoading(true);
      
      // Parar o polling de dados
      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
        dataPollingInterval.current = null;
      }
      
      // Chamar o endpoint para parar a análise no backend
      const response = await fetch("http://localhost:8000/stop-continuous-analysis/", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao parar análise: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(result.message);
      
      // Fazer uma última atualização dos dados
      await fetchEmotionData();
      
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error("Erro ao parar análise:", error);
      setErrorMessage("Erro ao parar a análise");
      setIsAnalyzing(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Obter dados atualizados de emoções do servidor
  const fetchEmotionData = async () => {
    try {
      const response = await fetch("http://localhost:8000/get-emotion-data/");
      
      if (!response.ok) {
        throw new Error(`Erro ao obter dados: ${response.status}`);
      }
      
      const emotionData = await response.json();
      updateChartData(emotionData);
      
      // Incrementar contador de atualizações
      setTotalAnalyzed(prev => prev + 1);

      // Capturar imagem para preview
      if (mode === "continuous") {
        try {
          await captureImage();
        } catch (error) {
          console.error("Erro ao capturar preview:", error);
        }
      }
      
    } catch (error) {
      console.error("Erro ao buscar dados de emoções:", error);
      // Não mostramos o erro na interface para não interromper a análise contínua
    }
  };

  // Atualizar o gráfico com novos dados
  const updateChartData = (emotionData: Record<string, number>) => {
    const labels = Object.keys(emotionData);
    const values = Object.values(emotionData);
    
    // Mapeamento de cores para emoções
    const colorMap: Record<string, string> = {
      "felicidade": "rgba(75, 192, 75, 0.8)",    // Verde
      "tristeza": "rgba(54, 162, 235, 0.8)",     // Azul
      "raiva": "rgba(255, 99, 132, 0.8)",        // Vermelho
      "estresse": "rgba(255, 99, 255, 0.8)",     // Magenta
      "nojo": "rgba(255, 206, 86, 0.8)",         // Amarelo
      "surpresa": "rgba(75, 192, 192, 0.8)",     // Ciano
      "neutro": "rgba(169, 169, 169, 0.8)",      // Cinza
    };
    
    // Gerar cores com base nas emoções
    const colors = labels.map(label => colorMap[label.toLowerCase()] || "rgba(128, 128, 128, 0.8)");
    
    const updatedData = {
      labels: labels,
      datasets: [
        {
          label: "Emoções Detectadas",
          data: values,
          backgroundColor: colors,
        },
      ],
    };
    
    setData(updatedData);
  };

  // Exportar dados para CSV
  const exportData = () => {
    if (!data.labels || !data.datasets[0].data) return;
    
    const labels = data.labels;
    const values = data.datasets[0].data;
    
    const csvContent = [
      "Emoção,Contagem",
      ...labels.map((label, index) => `${label},${values[index]}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'analise_emocoes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const options: ChartOptions<"bar"> = {
    scales: {
      y: { 
        beginAtZero: true,
        title: {
          display: true,
          text: 'Contagem'
        }
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Análise de Emoções'
      },
      legend: {
        display: false
      }
    },
    animation: {
      duration: 500
    },
    maintainAspectRatio: false
  };

  const getEmotionText = () => {
    if (!data.labels || data.labels.length === 0) return "Nenhuma emoção detectada";
    
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
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <BarChart className={styles.titleIcon} size={28} />
            Análise de Expressões Faciais
          </h1>
          <div className={styles.statusBadge}>
            {isAnalyzing ? "Análise em tempo real" : "Pronto para análise"}
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.gridLayout}>
          {/* Painel de controle */}
          <div className={styles.controlPanel}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Painel de Controle</h2>
              
              {/* Modo de análise */}
              <div className={styles.controlSection}>
                <h3 className={styles.sectionTitle}>Modo de Análise</h3>
                <div className={styles.buttonGrid}>
                  <button 
                    onClick={() => setMode("singleImage")}
                    className={`${styles.modeButton} ${mode === "singleImage" ? styles.activeButton : ''}`}
                  >
                    <Camera className={styles.buttonIcon} size={18} />
                    <span>Imagem Única</span>
                  </button>
                  <button 
                    onClick={() => setMode("continuous")}
                    className={`${styles.modeButton} ${mode === "continuous" ? styles.activeButton : ''}`}
                  >
                    <Upload className={styles.buttonIcon} size={18} />
                    <span>Análise Contínua</span>
                  </button>
                </div>
              </div>
              
              {/* Controles de análise */}
              <div className={styles.controlSection}>
                <h3 className={styles.sectionTitle}>Controles</h3>
                
                {mode === "singleImage" ? (
                  <button
                    onClick={analyzeSingleImage}
                    disabled={isLoading}
                    className={`${styles.actionButton} ${styles.primaryButton} ${isLoading ? styles.disabledButton : ''}`}
                  >
                    <Camera className={styles.buttonIcon} size={18} />
                    {isLoading ? "Analisando..." : "Capturar e Analisar"}
                  </button>
                ) : (
                  <div className={styles.buttonGrid}>
                    <button
                      onClick={startContinuousAnalysis}
                      disabled={isLoading || isAnalyzing}
                      className={`${styles.actionButton} ${styles.successButton} ${(isLoading || isAnalyzing) ? styles.disabledButton : ''}`}
                    >
                      <Play className={styles.buttonIcon} size={18} />
                      {isLoading ? "Iniciando..." : "Iniciar"}
                    </button>
                    <button
                      onClick={stopContinuousAnalysis}
                      disabled={!isAnalyzing || isLoading}
                      className={`${styles.actionButton} ${styles.dangerButton} ${(!isAnalyzing || isLoading) ? styles.disabledButton : ''}`}
                    >
                      <Square className={styles.buttonIcon} size={18} />
                      Parar
                    </button>
                  </div>
                )}
              </div>
              
              {/* Exportar dados */}
              <div className={styles.controlSection}>
                <h3 className={styles.sectionTitle}>Exportação</h3>
                <button
                  onClick={exportData}
                  disabled={!data.labels || data.labels.length === 0}
                  className={`${styles.actionButton} ${styles.secondaryButton} ${(!data.labels || data.labels.length === 0) ? styles.disabledButton : ''}`}
                >
                  <Download className={styles.buttonIcon} size={18} />
                  Exportar CSV
                </button>
              </div>

              {/* Status */}
              {isAnalyzing && (
                <div className={styles.statusPanel}>
                  <h3 className={styles.statusTitle}>Status da Análise</h3>
                  <div className={styles.statusInfo}>
                    <span>Frames analisados:</span>
                    <span className={styles.statusValue}>{totalAnalyzed}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressValue}></div>
                  </div>
                </div>
              )}
              
              {/* Mensagens de erro */}
              {errorMessage && (
                <div className={styles.errorMessage}>
                  <p className={styles.errorText}>
                    <span className={styles.errorIcon}>⚠️</span>
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>
            
            {/* Preview da Imagem */}
            {lastImageUrl && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Última Captura</h2>
                <div className={styles.imagePreview}>
                  <img src={lastImageUrl} alt="Preview" className={styles.previewImage} />
                  <div className={styles.imageOverlay}>
                    {getEmotionText()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Gráfico de resultados */}
          <div className={styles.resultsPanel}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Resultados da Análise</h2>
              
              <div className={styles.chartContainer}>
                <Bar data={data} options={options} />
              </div>
              
              {/* Legenda personalizada */}
              <div className={styles.legendGrid}>
                {data.labels && data.labels.map((label: any, index: any) => (
                  <div key={index} className={styles.legendItem}>
                    <div 
                      className={styles.colorIndicator} 
                      style={{ backgroundColor: (data.datasets[0].backgroundColor as string[])[index] }}

                    ></div>
                    <span className={styles.legendLabel}>{label}</span>
                  </div>
                ))}
              </div>
              
              {/* Info sobre a análise */}
              <div className={styles.infoPanel}>
                <h3 className={styles.infoTitle}>Sobre a Análise</h3>
                <p className={styles.infoText}>
                  Este sistema detecta expressões faciais em tempo real usando visão computacional.
                  As emoções são classificadas com base nos padrões faciais detectados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}