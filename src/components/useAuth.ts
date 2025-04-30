"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const localStorageData = localStorage.getItem('userData');
      const sessionStorageData = sessionStorage.getItem('userData');
      const storageData = localStorageData || sessionStorageData;
      
      if (storageData) {
        try {
          const userData = JSON.parse(storageData);
          if (userData?.name) {
            setIsLogged(true);
            setUserName(userData.name);
            return;
          }
        } catch (error) {
          console.error('Erro ao parsear userData:', error);
        }
      }
      
      // Apenas atualiza o estado, sem redirecionar
      setIsLogged(false);
      setUserName('');
    };

    checkAuth();
    
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  return { isLogged, userName };
};