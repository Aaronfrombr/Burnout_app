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
  const data: ChartData<"bar"> = {
    labels: ["Felicidade", "Tristeza", "Raiva", "Estresse"],
    datasets: [
      {
        label: "Níveis Detectados",
        data: [70, 20, 10, 50], // Dados fictícios
        backgroundColor: "#1e90ff",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f0f4f8", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e90ff" }}>Análise de Expressões Faciais</h1>
      <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "8px", maxWidth: "600px", margin: "0 auto" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}