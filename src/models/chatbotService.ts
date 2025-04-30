// // src/services/chatbotService.ts

// import { EmotionData } from '../types/emotionTypes';

// // Tipos para o chatbot
// export type ChatMessage = {
//   role: 'user' | 'assistant' | 'system';
//   content: string;
// };

// export type ChatResponse = {
//   message: ChatMessage;
//   emotionAnalysis?: {
//     dominantEmotion: string;
//     recommendedAction: string;
//     severity: 'low' | 'medium' | 'high';
//     requiresAttention: boolean;
//   };
// };

// // Classe para gerenciar o chatbot com integração de IA
// export class ChatbotService {
//   private apiKey: string;
//   private endpoint: string;
//   private systemPrompt: string;
//   private userEmotions: EmotionData[];
  
//   constructor(apiKey: string, endpoint: string) {
//     this.apiKey = apiKey;
//     this.endpoint = endpoint;
//     this.userEmotions = [];
    
//     // Define o comportamento base do chatbot
//     this.systemPrompt = `
//       Você é um assistente especializado em análise comportamental de emoções.
//       Seu objetivo é ajudar o usuário a entender seus padrões emocionais e oferecer
//       insights baseados em dados de emoções coletados. Quando relevante, você deve:
      
//       1. Analisar os padrões emocionais recentes do usuário
//       2. Identificar possíveis gatilhos para emoções negativas
//       3. Sugerir técnicas de gerenciamento emocional
//       4. Alertar sobre padrões preocupantes que possam exigir atenção profissional
      
//       Manter um tom empático, sem julgamentos e profissional. Priorizar o bem-estar do usuário.
//     `;
//   }
  
//   // Atualiza os dados emocionais do usuário para análise
//   public updateEmotionData(emotionData: EmotionData[]): void {
//     this.userEmotions = emotionData;
//   }
  
//   // Prepara um contexto baseado nos dados de emoções para a IA
//   private prepareEmotionContext(): string {
//     if (!this.userEmotions.length) {
//       return '';
//     }
    
//     // Calcula médias e tendências das emoções
//     const emotionSummary = this.analyzeEmotionTrends();
    
//     return `
//       Dados recentes de emoções do usuário:
//       - Emoção dominante: ${emotionSummary.dominantEmotion}
//       - Tendência geral: ${emotionSummary.trend}
//       - Variações significativas: ${emotionSummary.significantVariations.join(', ')}
//       - Período analisado: ${emotionSummary.period}
      
//       Use essas informações para contextualizar suas respostas quando relevante.
//     `;
//   }
  
//   // Analisa tendências emocionais a partir dos dados brutos
//   private analyzeEmotionTrends() {
//     // Em uma implementação real, este método faria cálculos complexos
//     // baseados nos dados emocionais armazenados
    
//     // Para este exemplo, vamos simular um resultado
//     return {
//       dominantEmotion: 'ansiedade',
//       trend: 'crescente nos últimos 3 dias',
//       significantVariations: ['picos de estresse pela manhã', 'melhora durante atividades físicas'],
//       period: 'últimos 7 dias'
//     };
//   }
  
//   // Processa o diagnóstico baseado nas emoções e na interação do usuário
//   private processEmotionalDiagnosis(userMessage: string): any {
//     // Aqui seria implementada a lógica de diagnóstico baseada nas emoções
//     // Para nosso exemplo, vamos simular um resultado
    
//     const keywords = {
//       ansiedade: ['preocupado', 'ansioso', 'nervoso', 'estressado', 'tensão'],
//       tristeza: ['triste', 'deprimido', 'melancólico', 'desânimo', 'sozinho'],
//       raiva: ['irritado', 'com raiva', 'frustrado', 'chateado', 'bravo'],
//       alegria: ['feliz', 'animado', 'satisfeito', 'contente', 'bem'],
//     };
    
//     // Detecção simples baseada em palavras-chave no texto do usuário
//     let detectedEmotions = {};
//     Object.entries(keywords).forEach(([emotion, words]) => {
//       const matches = words.filter(word => 
//         userMessage.toLowerCase().includes(word.toLowerCase())
//       );
//       if (matches.length) {
//         detectedEmotions[emotion] = matches.length;
//       }
//     });
    
//     // Combina detecção textual com dados de emoções capturados
//     const dominantEmotionsFromData = this.userEmotions.length 
//       ? this.getDominantEmotionsFromData() 
//       : {};
    
//     // Diagnóstico combinado (em uma implementação real, isto seria muito mais sofisticado)
//     return {
//       detectedFromText: detectedEmotions,
//       detectedFromData: dominantEmotionsFromData,
//       // Aqui entraria um algoritmo mais complexo que integra ambas as fontes
//     };
//   }
  
//   // Extrai emoções dominantes dos dados
//   private getDominantEmotionsFromData() {
//     // Em uma implementação real, isto seria baseado nos dados
//     // Para este exemplo, vamos simular
//     return {
//       ansiedade: 0.65,
//       tristeza: 0.32,
//       raiva: 0.15,
//       alegria: 0.20
//     };
//   }
  
//   // Método principal que processa uma mensagem e retorna uma resposta
//   public async processMessage(userMessage: string): Promise<ChatResponse> {
//     const emotionContext = this.prepareEmotionContext();
//     const diagnosis = this.processEmotionalDiagnosis(userMessage);
    
//     // Prepara os dados para enviar à API de IA
//     const messages: ChatMessage[] = [
//       { role: 'system', content: this.systemPrompt },
//     ];
    
//     // Adiciona o contexto emocional se disponível
//     if (emotionContext) {
//       messages.push({ role: 'system', content: emotionContext });
//     }
    
//     // Adiciona informações do diagnóstico para a IA
//     const diagnosisPrompt = `
//       Baseado nos dados coletados, detectei as seguintes emoções:
//       ${Object.entries(diagnosis.detectedFromData).map(([emotion, value]) => 
//         `- ${emotion}: ${(value as number).toFixed(2)}`
//       ).join('\n')}
      
//       Na mensagem atual, identifiquei indícios de:
//       ${Object.keys(diagnosis.detectedFromText).length 
//         ? Object.keys(diagnosis.detectedFromText).join(', ') 
//         : 'nenhuma emoção específica'
//       }
      
//       Considere estas informações ao formular sua resposta, mas mantenha um tom natural.
//     `;
//     messages.push({ role: 'system', content: diagnosisPrompt });
    
//     // Adiciona a mensagem do usuário
//     messages.push({ role: 'user', content: userMessage });
    
//     // Em uma implementação real, aqui faríamos a chamada à API de IA
//     // como OpenAI, Claude, etc.
//     // Para este exemplo, vamos simular uma resposta
    
//     try {
//       // Simula a chamada à API
//       // const response = await fetch(this.endpoint, {
//       //   method: 'POST',
//       //   headers: {
//       //     'Content-Type': 'application/json',
//       //     'Authorization': `Bearer ${this.apiKey}`
//       //   },
//       //   body: JSON.stringify({ messages })
//       // });
      
//       // const data = await response.json();
      
//       // Na implementação real, usaríamos a resposta da API
//       // Aqui estamos simulando
      
//       // Determina a emoção dominante
//       const emotions = diagnosis.detectedFromData;
//       const dominantEmotion = Object.entries(emotions)
//         .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
      
//       // Simula resposta baseada na emoção dominante
//       let responseContent = '';
//       let emotionAnalysis: any = {
//         dominantEmotion,
//         recommendedAction: '',
//         severity: 'medium' as 'low' | 'medium' | 'high',
//         requiresAttention: false
//       };
      
//       switch(dominantEmotion) {
//         case 'ansiedade':
//           responseContent = `Percebi que você pode estar sentindo um pouco de ansiedade. É normal sentir isso em certos momentos. Você gostaria de explorar algumas técnicas de respiração ou estratégias para lidar com a ansiedade?`;
//           emotionAnalysis.recommendedAction = 'Técnicas de respiração e mindfulness';
//           emotionAnalysis.severity = 'medium';
//           break;
//         case 'tristeza':
//           responseContent = `Parece que você está se sentindo um pouco para baixo. Lembre-se que é importante reconhecer esses sentimentos. Gostaria de conversar sobre atividades que geralmente te animam?`;
//           emotionAnalysis.recommendedAction = 'Engajamento em atividades prazerosas';
//           emotionAnalysis.severity = 'medium';
//           break;
//         case 'raiva':
//           responseContent = `Estou notando sinais de frustração. É importante encontrar formas saudáveis de expressar esses sentimentos. Você tem praticado alguma técnica para gerenciar emoções intensas?`;
//           emotionAnalysis.recommendedAction = 'Técnicas de gerenciamento de raiva';
//           emotionAnalysis.severity = 'medium';
//           break;
//         case 'alegria':
//           responseContent = `É bom ver que você está em um bom momento emocional! Aproveite esses sentimentos positivos. Há algo específico que você gostaria de conversar hoje?`;
//           emotionAnalysis.recommendedAction = 'Manter práticas positivas';
//           emotionAnalysis.severity = 'low';
//           break;
//         default:
//           responseContent = `Como posso ajudar você hoje? Estou aqui para conversar sobre qualquer coisa relacionada ao seu bem-estar emocional.`;
//           emotionAnalysis.recommendedAction = 'Exploração geral';
//           emotionAnalysis.severity = 'low';
//       }
      
//       // Verifica se requer atenção profissional
//       // Em uma implementação real, isto seria baseado em algoritmos mais complexos
//       emotionAnalysis.requiresAttention = 
//         (emotionAnalysis.severity === 'high') || 
//         (emotions['tristeza'] > 0.8) || 
//         (emotions['ansiedade'] > 0.9);
      
//       return {
//         message: { role: 'assistant', content: responseContent },
//         emotionAnalysis
//       };
      
//     } catch (error) {
//       console.error('Erro ao processar mensagem:', error);
//       return {
//         message: { 
//           role: 'assistant', 
//           content: 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.' 
//         }
//       };
//     }
//   }
// }

// // Exporta uma instância configurada do serviço (para uso em componentes)
// export const chatbotService = new ChatbotService(
//   process.env.AI_API_KEY || '',
//   process.env.AI_ENDPOINT || ''
// );