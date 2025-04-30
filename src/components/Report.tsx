import { useState, FormEvent } from "react";
import Head from "next/head";
import { ArrowLeft } from "lucide-react";

export default function Report() {
  const [report, setReport] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({ report });
    // Simulação de envio para backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReport("");
    }, 3000);
  };

  return (
    <>
      <Head>
        <title>EmotionTrack | Relatório Profissional</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-blue-600 shadow-xl relative z-10 flex flex-col items-center justify-center p-4">
      <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        ></link>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-2xl transition-all">
          
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
          <a href='/dashboard'>
                  <button
                    type="button"
                    className="px-5 py-1 border border-gray-300 text-gray-700 rounded-lg bg-blue-400 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all flex-1"
                  >
                    <span><ArrowLeft /></span>
                  </button>
                </a>
            <div className="mb-6 mt-3">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Relatório Profissional</h2>
              <p className="text-gray-500 text-sm">Compartilhe suas análises e observações sobre o estado emocional do funcionário</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Select employee section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
                  <div className="relative">
                    <select 
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Selecione um funcionário</option>
                      <option value="1">Ana Silva - Desenvolvimento</option>
                      <option value="2">Carlos Oliveira - Design</option>
                      <option value="3">Mariana Costa - Marketing</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
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
                </div>
                
                {/* Analysis severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Atenção Requerido</label>
                  <div className="flex space-x-4">
                    {['Baixo', 'Médio', 'Alto', 'Urgente'].map((level, index) => (
                      <label key={index} className="relative flex-1">
                        <input 
                          type="radio" 
                          name="severity" 
                          className="sr-only peer" 
                          defaultChecked={index === 1}
                        />
                        <div className="h-10 flex items-center justify-center border rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-checked:text-white text-gray-600 border-gray-300 cursor-pointer transition-all">
                          {level}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-8 flex space-x-4">
                <button
                  type="button"
                  className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all flex-1"
                >
                  Salvar Rascunho
                </button>
                <button
                  type="submit"
                  disabled={submitted}
                  className={`px-5 py-3 rounded-lg text-white flex-1 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    submitted 
                      ? 'bg-green-500' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
                  }`}
                >
                  {submitted ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Enviado
                    </>
                  ) : 'Enviar Relatório'}
                </button>
              </div>
            </form>
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