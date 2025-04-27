export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface FacialData {
  happiness: number;
  sadness: number;
  anger: number;
  stress: number;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Se estiver usando cookies
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || 'Credenciais inválidas'
      };
    }

    return {
      success: true,
      token: data.token, // Adicione isso se seu backend retornar um token
      user: data.user
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Erro ao conectar com o servidor'
    };
  }
};

export const getFacialData = async (token: string): Promise<FacialData> => {
  try {
    const response = await fetch(`${API_URL}/facial-data/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao obter dados faciais');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching facial data:', error);
    throw error;
  }
};

export const submitReport = async (report: string, token: string): Promise<ReportResponse> => {
  try {
    const response = await fetch(`${API_URL}/reports/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ report })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.detail || 'Erro ao enviar relatório'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting report:', error);
    return {
      success: false,
      message: 'Erro de conexão'
    };
  }
};

// Função para verificar token (opcional)
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/verify-token/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};