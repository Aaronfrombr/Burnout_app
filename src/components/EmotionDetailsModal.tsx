import { useState } from "react";

type EmotionSolution = {
  title: string;
  description: string;
  steps: string[];
  resources?: string[];
};

type EmotionDetailsModalProps = {
  emotion: string | null;
  onClose: () => void;
};

type EmotionDiagnosis = {
  emotion: string;
  description: string;
  possibleCauses: string[];
  solutions: EmotionSolution[];
};

const emotionDiagnosticsMap: Record<string, EmotionDiagnosis> = {
  happy: {
    emotion: "Felicidade",
    description: "Sentimento de bem-estar, contentamento ou realização.",
    possibleCauses: [
      "Conquistas pessoais",
      "Momentos com pessoas queridas",
      "Autenticidade e alinhamento com valores",
    ],
    solutions: [
      {
        title: "Gratidão consciente",
        description: "A gratidão aumenta a duração da felicidade.",
        steps: [
          "Liste 3 coisas boas do seu dia",
          "Envie uma mensagem de agradecimento a alguém",
          "Olhe no espelho e diga: 'estou indo bem'",
        ],
      },
    ],
  },
  sad: {
    emotion: "Tristeza",
    description:
      "Estado emocional caracterizado por sentimentos de desânimo e perda.",
    possibleCauses: [
      "Eventos desagradáveis recentes",
      "Problemas pessoais ou profissionais",
      "Condições médicas como depressão",
      "Isolamento social",
    ],
    solutions: [
      {
        title: "Atividade física",
        description: "Exercícios para liberar endorfinas",
        steps: [
          "Yoga por 20 minutos",
          "Alongamento matinal",
          "Dança livre por 3 músicas",
        ],
      },
    ],
  },
  angry: {
    emotion: "Raiva",
    description:
      "Resposta emocional intensa a situações de frustração ou injustiça.",
    possibleCauses: [
      "Frustração com objetivos bloqueados",
      "Sentimento de injustiça",
      "Invasão de espaço pessoal",
      "Acúmulo de estresse",
    ],
    solutions: [
      {
        title: "Técnicas de controle imediato",
        description: "Ações para reduzir a intensidade no momento",
        steps: [
          "Respiração 4-7-8 (4s inspirar, 7s segurar, 8s expirar)",
          "Contar até 20 lentamente",
          "Beber um copo de água",
          "Sair do local por 5 minutos",
        ],
      },
    ],
  },
  disgust: {
    emotion: "Nojo",
    description: "Rejeição intensa diante de algo repulsivo ou ofensivo.",
    possibleCauses: [
      "Experiências sensoriais negativas",
      "Contatos desagradáveis",
      "Fatores culturais",
    ],
    solutions: [
      {
        title: "Distanciamento",
        description: "Afaste-se do estímulo desagradável sempre que possível.",
        steps: [
          "Identifique o gatilho",
          "Respire fundo",
          "Desvie sua atenção para outra coisa",
        ],
      },
    ],
  },
  fear: {
    emotion: "Estresse",
    description: "Sensação de sobrecarga mental ou emocional.",
    possibleCauses: [
      "Excesso de tarefas",
      "Problemas pessoais",
      "Falta de descanso",
    ],
    solutions: [
      {
        title: "Reduzindo o estresse",
        description: "Práticas para aliviar a tensão:",
        steps: [
          "Faça pausas regulares",
          "Respiração consciente",
          "Organize sua rotina",
        ],
      },
    ],
  },
  surprise: {
    emotion: "Surpresa",
    description: "Resposta emocional rápida a algo inesperado.",
    possibleCauses: [
      "Notícias repentinas",
      "Mudança de planos",
      "Descobertas ou revelações"
    ],
    solutions: [
      {
        title: "Transformar em oportunidade",
        description: "Nem toda surpresa é ruim. Pode haver um presente escondido.",
        steps: [
          "Reavalie suas expectativas",
          "Busque o lado positivo",
          "Adapte-se com leveza"
        ]
      }
    ]
  },
  neutral: {
    emotion: "Neutro",
    description: "Estado de equilíbrio, sem emoções fortes predominantes.",
    possibleCauses: [
      "Rotina estável",
      "Ausência de estímulos marcantes",
      "Descanso emocional"
    ],
    solutions: [
      {
        title: "Autoexploração suave",
        description: "Explore sua neutralidade como espaço criativo.",
        steps: [
          "Escreva sobre como está se sentindo",
          "Experimente algo novo, mesmo que pequeno",
          "Observe seus pensamentos sem julgá-los"
        ]
      }
    ]
  }  
};

const EmotionDetailsModal = ({
  emotion,
  onClose,
}: EmotionDetailsModalProps) => {
  if (!emotion) return null;

  const diagnosis = emotionDiagnosticsMap[emotion];

  if (!diagnosis) return null;

  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        rel="stylesheet"
      ></link>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto my-4 overflow-y-auto max-h-[90vh]">
          {/* Cabeçalho */}
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 pr-2">
              Diagnóstico: {diagnosis.emotion}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Descrição */}
          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2">
              Descrição:
            </h4>
            <p className="text-sm sm:text-base text-gray-600">
              {diagnosis.description}
            </p>
          </div>

          {/* Causas */}
          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2">
              Possíveis causas:
            </h4>
            <ul className="list-disc pl-5 space-y-0.5 sm:space-y-1 text-sm sm:text-base text-gray-600">
              {diagnosis.possibleCauses.map((cause, index) => (
                <li key={index}>{cause}</li>
              ))}
            </ul>
          </div>

          {/* Soluções */}
          <div className="space-y-4 sm:space-y-6">
            <h4 className="font-semibold text-gray-700">
              Soluções recomendadas:
            </h4>
            {diagnosis.solutions.map((solution, index) => (
              <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h5 className="font-medium text-base sm:text-lg text-blue-600 mb-1 sm:mb-2">
                  {solution.title}
                </h5>
                <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">
                  {solution.description}
                </p>

                <h6 className="font-medium text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">
                  Passos:
                </h6>
                <ol className="list-decimal pl-5 space-y-0.5 sm:space-y-1 text-sm sm:text-base text-gray-600">
                  {solution.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>

                {solution.resources && (
                  <>
                    <h6 className="font-medium text-sm sm:text-base text-gray-700 mt-2 sm:mt-3 mb-1 sm:mb-2">
                      Recursos:
                    </h6>
                    <ul className="list-disc pl-5 space-y-0.5 sm:space-y-1 text-sm sm:text-base text-gray-600">
                      {solution.resources.map((resource, resIndex) => (
                        <li key={resIndex}>{resource}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Botão de fechar */}
          <div className="mt-4 sm:mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export { EmotionDetailsModal };
