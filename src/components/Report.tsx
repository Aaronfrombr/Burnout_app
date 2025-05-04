import { useState, useEffect } from "react";
import Head from "next/head";
import { ArrowLeft, AlertCircle, Save, Send, CheckCircle, User, Clock, Calendar } from "lucide-react";
import { useAuth } from "./useAuth";

export default function Report() {
  const { isLogged, userName } = useAuth();
  const [report, setReport] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [severity, setSeverity] = useState("Médio");
  const [emotion, setEmotion] = useState("Neutro");
  const [saveStatus, setSaveStatus] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  
  useEffect(() => {
    // Configurar a data atual formatada
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    setFormattedDate(now.toLocaleString('pt-BR', options));
    
    // Recuperar rascunho salvo no localStorage se existir
    if (isLogged) {
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
    }
  }, [isLogged, userName]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    if (!isLogged) {
      return;
    }
    
    // Simulação de envio para backend
    console.log({ userName, report, severity, emotion, date: formattedDate });
    setSubmitted(true);
    
    // Limpar rascunho do localStorage após envio bem-sucedido
    localStorage.removeItem(`emotiontrack-draft-${userName}`);
    
    setTimeout(() => {
      setSubmitted(false);
      setReport("");
      setSeverity("Médio");
      setEmotion("Neutro");
    }, 3000);
  };
  
  const saveDraft = () => {
    if (!isLogged) return;
    
    // Salvar rascunho no localStorage
    const draft = JSON.stringify({
      report,
      severity,
      emotion,
      savedAt: new Date().toISOString()
    });
    
    localStorage.setItem(`emotiontrack-draft-${userName}`, draft);
    setSaveStatus("Rascunho salvo!");
    
    // Limpar mensagem de status após 3 segundos
    setTimeout(() => {
      setSaveStatus("");
    }, 3000);
  };
  
  const severityOptions = [
    { value: 'Baixo', color: 'bg-green-500' },
    { value: 'Médio', color: 'bg-yellow-500' },
    { value: 'Alto', color: 'bg-orange-500' },
    { value: 'Urgente', color: 'bg-red-500' }
  ];
  
  const emotionOptions = [
    { value: 'Neutro', icon: '😐' },
    { value: 'Positivo', icon: '😊' },
    { value: 'Negativo', icon: '😔' },
    { value: 'Ansioso', icon: '😰' },
    { value: 'Estressado', icon: '😤' }
  ];

  return (
    <>
      <Head>
        <title>EmotionTrack | Relatório Profissional</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-blue-600 flex flex-col items-center justify-center p-4">
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        />
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">EmotionTrack</h1>
              <p className="text-blue-100 text-sm">Sistema de Análise Emocional</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Relatório Profissional</h2>
              <p className="text-gray-500 text-sm">Compartilhe suas análises e observações sobre seu estado emocional</p>
            </div>
            
            {!isLogged ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-6">
                <div className="flex justify-center mb-4">
                  <AlertCircle size={48} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Acesso Restrito</h3>
                <p className="text-gray-600 mb-4">
                  Você precisa estar logado para preencher e enviar um relatório emocional.
                </p>
                <a href="/login" className="inline-block px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                  Fazer Login
                </a>
              </div>
            ) : (
              <div>
                <div className="space-y-6">
                  {/* User info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
                    <div className="flex bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 items-center">
                      <User size={18} className="text-gray-500 mr-3" />
                      <span className="font-medium text-gray-800">{userName}</span>
                    </div>
                  </div>
                  
                  {/* Emotion selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado Emocional Principal</label>
                    <div className="flex space-x-3">
                      {emotionOptions.map((option) => (
                        <div key={option.value} className="relative flex-1">
                          <input 
                            type="radio" 
                            name="emotion" 
                            id={`emotion-${option.value}`}
                            className="sr-only peer" 
                            checked={emotion === option.value}
                            onChange={() => setEmotion(option.value)}
                          />
                          <label 
                            htmlFor={`emotion-${option.value}`}
                            className="h-12 flex flex-col items-center justify-center border rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-checked:text-white text-gray-600 border-gray-300 cursor-pointer transition-all block w-full"
                          >
                            <span className="text-xl mb-1">{option.icon}</span>
                            <span className="text-xs">{option.value}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Report content */}
                  <div>
                    <label htmlFor="report" className="block text-sm font-medium text-gray-700 mb-2">Análise Detalhada</label>
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
                  
                  {/* Analysis severity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Atenção Requerido</label>
                    <div className="flex space-x-3">
                      {severityOptions.map((option) => (
                        <div key={option.value} className="relative flex-1">
                          <input 
                            type="radio" 
                            name="severity" 
                            id={`severity-${option.value}`}
                            className="sr-only peer" 
                            checked={severity === option.value}
                            onChange={() => setSeverity(option.value)}
                          />
                          <label
                            htmlFor={`severity-${option.value}`}
                            className="h-10 flex items-center justify-center border rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-checked:text-white text-gray-600 border-gray-300 cursor-pointer transition-all block w-full"
                          >
                            <div className={`w-3 h-3 ${option.color} rounded-full mr-2`}></div>
                            {option.value}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-8 flex space-x-4">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all flex-1 flex items-center justify-center"
                  >
                    <Save size={18} className="mr-2" />
                    Salvar Rascunho
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitted}
                    className={`px-5 py-3 rounded-lg text-white flex-1 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      submitted 
                        ? 'bg-green-500' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
                    }`}
                  >
                    {submitted ? (
                      <>
                        <CheckCircle size={18} className="mr-2" />
                        Enviado
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
            )}
          </div>
          
          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
            <span>EmotionTrack © 2025</span>
            <span>Análises Confidenciais</span>
          </div>
        </div>
      </div>
    </>
  );
}