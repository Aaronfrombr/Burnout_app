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
    const colors = labels.map(label => colorMap[label] || "rgba(128, 128, 128, 0.8)");
    
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
    }
  };

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f0f4f8", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e90ff", marginBottom: "1.5rem" }}>Análise de Expressões Faciais</h1>
      
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setMode("singleImage")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: mode === "singleImage" ? "#1e90ff" : "#e0e0e0",
              color: mode === "singleImage" ? "white" : "black",
              cursor: "pointer"
            }}
          >
            Imagem Única
          </button>
          <button 
            onClick={() => setMode("continuous")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: mode === "continuous" ? "#1e90ff" : "#e0e0e0",
              color: mode === "continuous" ? "white" : "black",
              cursor: "pointer"
            }}
          >
            Análise Contínua
          </button>
        </div>
      </div>

      {/* Controles baseados no modo selecionado */}
      <div style={{ marginBottom: "1.5rem" }}>
        {mode === "singleImage" ? (
          <button
            onClick={analyzeSingleImage}
            disabled={isLoading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: isLoading ? "#cccccc" : "#1e90ff",
              color: "white",
              cursor: isLoading ? "default" : "pointer"
            }}
          >
            {isLoading ? "Analisando..." : "Capturar e Analisar"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={startContinuousAnalysis}
              disabled={isLoading || isAnalyzing}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: (isLoading || isAnalyzing) ? "#cccccc" : "#1e90ff",
                color: "white",
                cursor: (isLoading || isAnalyzing) ? "default" : "pointer"
              }}
            >
              {isLoading ? "Iniciando..." : "Iniciar Análise"}
            </button>
            <button
              onClick={stopContinuousAnalysis}
              disabled={!isAnalyzing || isLoading}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: (!isAnalyzing || isLoading) ? "#cccccc" : "#ff4d4d",
                color: "white",
                cursor: (!isAnalyzing || isLoading) ? "default" : "pointer"
              }}
            >
              Parar Análise
            </button>
          </div>
        )}
        
        {/* Botão de exportar dados */}
        <button
          onClick={exportData}
          disabled={!data.labels || data.labels.length === 0}
          style={{
            marginLeft: "10px",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            backgroundColor: (!data.labels || data.labels.length === 0) ? "#cccccc" : "#4CAF50",
            color: "white",
            cursor: (!data.labels || data.labels.length === 0) ? "default" : "pointer"
          }}
        >
          Exportar CSV
        </button>
      </div>

      {/* Mensagens de status */}
      {isAnalyzing && (
        <div style={{ marginBottom: "1rem", color: "#1e90ff" }}>
          Análise em andamento... (Atualizações: {totalAnalyzed})
        </div>
      )}
      
      {errorMessage && (
        <div style={{ marginBottom: "1rem", color: "#ff4d4d" }}>
          {errorMessage}
        </div>
      )}

      {/* Gráfico de resultados */}
      <div style={{
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}