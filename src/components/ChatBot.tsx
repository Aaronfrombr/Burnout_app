import { useState, useEffect, useRef, JSX } from "react";
import { MessageSquare, Send, Smile, Frown, Meh, AlertTriangle, Heart, ChevronDown, ChevronUp } from "lucide-react";

// Definição de tipos
type EmotionType = "happiness" | "sadness" | "anger" | "anxiety" | "neutral";

interface EmotionScores {
  happiness: number;
  sadness: number;
  anger: number;
  anxiety: number;
  neutral: number;
}

interface EmotionAnalysis {
  dominant: EmotionType;
  scores: EmotionScores;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  emotion?: EmotionType;
}

export default function EmotionTrackChatbot(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Olá! Sou o assistente do EmotionTrack. Como está se sentindo hoje?", 
      emotion: "neutral" 
    }
  ]);
  
  const [chatInput, setChatInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysis | null>(null);
  const [showEmotionChart, setShowEmotionChart] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detecta emoção do texto do usuário
  const detectEmotion = (text: string): EmotionAnalysis => {
    // Palavras-chave para cada emoção
    const emotionKeywords: Record<EmotionType, string[]> = {
      happiness: ["feliz", "alegre", "contente", "animado", "ótimo", "maravilhoso", "satisfeito", "entusiasmado", "alegria"],
      sadness: ["triste", "deprimido", "chateado", "melancólico", "desanimado", "desmotivado", "baixo", "infeliz", "saudade", "perda"],
      anger: ["irritado", "raiva", "bravo", "furioso", "frustrado", "aborrecido", "indignado", "nervoso", "chateado"],
      anxiety: ["ansioso", "preocupado", "nervoso", "tenso", "inquieto", "estressado", "medo", "assustado", "inseguro"],
      neutral: ["normal", "bem", "ok", "neutro", "regular", "médio", "morno", "tanto faz"]
    };

    // Conta ocorrências de palavras-chave
    const emotionScores: EmotionScores = {
      happiness: 0,
      sadness: 0,
      anger: 0,
      anxiety: 0,
      neutral: 0
    };

    const lowercaseText = text.toLowerCase();
    
    // Analisa o texto para cada emoção
    for (const [emotion, keywords] of Object.entries(emotionKeywords) as [EmotionType, string[]][]) {
      for (const keyword of keywords) {
        if (lowercaseText.includes(keyword)) {
          emotionScores[emotion] += 1;
        }
      }
    }

    // Encontra a emoção dominante
    let dominantEmotion: EmotionType = "neutral";
    let highestScore = 0;
    
    for (const [emotion, score] of Object.entries(emotionScores) as [EmotionType, number][]) {
      if (score > highestScore) {
        highestScore = score;
        dominantEmotion = emotion;
      }
    }

    // Retorna a emoção e os scores
    return {
      dominant: dominantEmotion,
      scores: emotionScores
    };
  };

  // Gera resposta com base na emoção detectada
  const generateResponse = (text: string, emotion: EmotionAnalysis): string => {
    // Respostas personalizadas para cada emoção
    const responses: Record<EmotionType, string[]> = {
      happiness: [
        "Fico feliz em saber que você está se sentindo bem! Emoções positivas são importantes para nosso bem-estar.",
        "Que bom que você está se sentindo alegre! Quer compartilhar o que te deixou assim?",
        "É ótimo ver você animado! Sentimentos positivos fortalecem nossa resiliência emocional."
      ],
      sadness: [
        "Percebo que você não está se sentindo bem. Lembre-se que é normal sentir tristeza às vezes. Quer conversar sobre isso?",
        "Sinto muito que você esteja passando por um momento difícil. Expressar suas emoções já é um passo importante.",
        "A tristeza faz parte da vida. Seria útil identificar o que está provocando esse sentimento?"
      ],
      anger: [
        "Vejo que você está irritado. Respirar fundo algumas vezes pode ajudar a acalmar essa sensação inicial.",
        "A raiva é uma emoção natural, mas é importante saber canalizá-la. Quer falar sobre o que está causando essa frustração?",
        "Entendo sua irritação. Às vezes, escrever sobre o que nos incomoda pode ajudar a processar melhor esses sentimentos."
      ],
      anxiety: [
        "Percebo que você está ansioso. Tente focar no momento presente, respire profundamente e lembre-se que você está seguro.",
        "A ansiedade pode ser desconfortável, mas é temporária. Há algo específico que está te preocupando?",
        "Entendo sua inquietação. Quer tentar um exercício simples de respiração para ajudar a reduzir essa sensação?"
      ],
      neutral: [
        "Como posso ajudar você hoje? Estou aqui para conversar ou oferecer algumas sugestões para o seu bem-estar.",
        "Obrigado por compartilhar. Há algo específico sobre suas emoções que gostaria de entender melhor?",
        "Estou aqui para ajudar. Gostaria de saber mais sobre como o EmotionTrack pode auxiliar no monitoramento das suas emoções?"
      ]
    };

    // Seleciona uma resposta aleatória da categoria adequada
    const emotionResponses = responses[emotion.dominant] || responses.neutral;
    const randomIndex = Math.floor(Math.random() * emotionResponses.length);
    
    return emotionResponses[randomIndex];
  };

  // Envia mensagem
  const handleSendMessage = (): void => {
    if (chatInput.trim() === "") return;

    // Adiciona mensagem do usuário
    const newUserMessage: Message = { role: "user", content: chatInput };
    setMessages([...messages, newUserMessage]);
    
    // Analisa a emoção
    const emotion = detectEmotion(chatInput);
    setEmotionAnalysis(emotion);
    
    // Limpa o input
    setChatInput("");
    
    // Mostra indicador de digitação
    setIsTyping(true);
    
    // Gera resposta (com delay para simular processamento)
    setTimeout(() => {
      const response = generateResponse(chatInput, emotion);
      
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: response, 
          emotion: emotion.dominant 
        }
      ]);
      
      setIsTyping(false);
    }, 1500);
  };

  // Retorna um ícone para cada emoção
  const getEmotionIcon = (emotion: EmotionType): JSX.Element => {
    switch(emotion) {
      case "happiness":
        return <Smile className="text-green-500 h-5 w-5" />;
      case "sadness":
        return <Frown className="text-blue-500 h-5 w-5" />;
      case "anger":
        return <AlertTriangle className="text-red-500 h-5 w-5" />;
      case "anxiety":
        return <Meh className="text-yellow-500 h-5 w-5" />;
      default:
        return <Heart className="text-purple-500 h-5 w-5" />;
    }
  };

  // Mostra o gráfico de emoções se houver análise
  const renderEmotionChart = (): JSX.Element | null => {
    if (!emotionAnalysis) return null;
    
    const { scores, dominant } = emotionAnalysis;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;
    
    // Versão compacta - mostra apenas a emoção dominante
    if (!showEmotionChart) {
      // Mapeia as cores das emoções
      const emotionColors = {
        happiness: "text-green-500",
        sadness: "text-blue-500",
        anger: "text-red-500",
        anxiety: "text-yellow-500",
        neutral: "text-purple-500"
      };
      
      return (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2 text-sm">
          <div className="flex items-center">
            <span className="mr-2">{getEmotionIcon(dominant)}</span>
            <span className={`font-medium capitalize ${emotionColors[dominant]}`}>
              {dominant === "happiness" ? "Felicidade" : 
               dominant === "sadness" ? "Tristeza" :
               dominant === "anger" ? "Raiva" :
               dominant === "anxiety" ? "Ansiedade" : "Neutro"}
            </span>
            <span className="text-xs text-gray-500 ml-2">detectada na sua mensagem</span>
          </div>
          <button 
            onClick={() => setShowEmotionChart(true)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center text-xs"
          >
            Detalhes <ChevronDown className="h-3 w-3 ml-1" />
          </button>
        </div>
      );
    }
    
    // Versão detalhada
    return (
      <div className="p-3 bg-gray-50 rounded-lg mb-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Análise de Emoções</h4>
          <button 
            onClick={() => setShowEmotionChart(false)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center text-xs"
          >
            Minimizar <ChevronUp className="h-3 w-3 ml-1" />
          </button>
        </div>
        <div className="space-y-1">
          {Object.entries(scores).map(([emotion, score]) => {
            const percentage = Math.round((score / totalScore) * 100) || 0;
            let colorClass = "bg-gray-300";
            let textColor = "text-gray-600";
            
            if (emotion === "happiness") {
              colorClass = "bg-green-500";
              textColor = "text-green-700";
            }
            if (emotion === "sadness") {
              colorClass = "bg-blue-500";
              textColor = "text-blue-700";
            }
            if (emotion === "anger") {
              colorClass = "bg-red-500";
              textColor = "text-red-700";
            }
            if (emotion === "anxiety") {
              colorClass = "bg-yellow-500";
              textColor = "text-yellow-700";
            }
            if (emotion === "neutral") {
              colorClass = "bg-purple-500";
              textColor = "text-purple-700";
            }
            
            const emotionLabel = 
              emotion === "happiness" ? "Felicidade" : 
              emotion === "sadness" ? "Tristeza" :
              emotion === "anger" ? "Raiva" :
              emotion === "anxiety" ? "Ansiedade" : "Neutro";
            
            return (
              <div key={emotion} className="flex items-center text-xs">
                <span className={`w-20 capitalize ${textColor}`}>{emotionLabel}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                  <div 
                    className={`${colorClass} h-2 rounded-full`} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-600">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Envia mensagem ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96 max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-3 bg-indigo-600 text-white flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        <h3 className="font-medium">Assistente EmotionTrack</h3>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs sm:max-w-md rounded-lg p-3 flex items-start ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.role === "assistant" && msg.emotion && (
                <span className="mr-2 mt-1">{getEmotionIcon(msg.emotion)}</span>
              )}
              <div>{msg.content}</div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {emotionAnalysis && renderEmotionChart()}
      
      <div className="p-3 border-t">
        <div className="flex">
          <input
            type="text"
            value={chatInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite como você está se sentindo..."
            className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { EmotionTrackChatbot }