export interface LoginResponse {
    success: boolean;
    token: string;
  }
  
  export interface FacialData {
    happiness: number;
    sadness: number;
    anger: number;
    stress: number;
  }
  
  export interface ReportResponse {
    success: boolean;
  }
  
  export const login = async (email: string, password: string): Promise<LoginResponse> => {
    // Simulação
    return { success: true, token: "fake-token" };
  };
  
  export const getFacialData = async (): Promise<FacialData> => {
    return {
      happiness: 70,
      sadness: 20,
      anger: 10,
      stress: 50,
    };
  };
  
  export const submitReport = async (report: string): Promise<ReportResponse> => {
    return { success: true };
  };

  export const Login = async (email: string, password: string): Promise<LoginResponse> => {
    // Exemplo: aceita apenas email "test@exemplo.com" e senha "123456"
    if (email === "test@exemplo.com" && password === "123456") {
      return { success: true, token: "fake-token" };
    }
    return { success: false, token: "" };
  };