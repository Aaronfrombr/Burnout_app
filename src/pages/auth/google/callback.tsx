import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function GoogleCallback() {
  const router = useRouter();
  const { code, state } = router.query;

  useEffect(() => {
    if (code) {
      const handleAuth = async () => {
        try {
            const response = await fetch('http://localhost:8000/auth/google', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, state }),
              });

          const data = await response.json();

          if (data.success && data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            router.push('/');
          } else {
            router.push('/login?error=google_auth_failed');
          }
        } catch (error) {
          router.push('/login?error=connection_error');
        }
      };

      handleAuth();
    }
  }, [code]);

  return <div>Processando login com Google...</div>;
}