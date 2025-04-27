"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Obter dados do localStorage ou sessionStorage
      const localStorageData = localStorage.getItem('userData');
      const sessionStorageData = sessionStorage.getItem('userData');
      
      // Verificar qual storage tem dados
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
      
      // Se não encontrou dados válidos
      setIsLogged(false);
      router.push('/');
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