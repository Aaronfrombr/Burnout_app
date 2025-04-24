import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../models/api";
import styles from '../styles/Login.module.css';
import { Pacifico } from 'next/font/google';
import Image from "next/image";
import Head from 'next/head';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
});

const backgroundImages = [
  "/image/Janeiro-Branco-Bem-estar-Psicologico-e-Emocional.jpg",
  "/image/bem-estar.png",
  "/image/bem-estar-psicologico.avif",
]

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fullTitle = "WELL BEING";
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullTitle.length) {
        setTitle(fullTitle.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 3000); 
    
    return () => clearInterval(slideInterval);
  }, []);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!isValidEmail(email)) {
      setError("Por favor, insira um email válido.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await login(email, password);
      if (response.success) {
        router.push("/dashboard");
      } else {
        setError("Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <><Head>
      <title>WellBeing - Login</title>
      <link rel="icon" href="/image/logo.png" />
    </Head><div className={styles.animatedContainer}>
        <div className={styles.backgroundContainer}>
          {backgroundImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Background ${index + 1}`}
              fill
              quality={100}
              priority={index === 0}
              className={`${styles.backgroundImage} ${index === currentImageIndex ? styles.active : ''}`} />
          ))}
          <div className={styles.backgroundOverlay}></div>
          <div className={styles.topGradient}></div>
          <div className={styles.bottomGradient}></div>
          <div className={styles.leftGradient}></div>
          <div className={styles.rightGradient}></div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h1 className={`${styles.title} ${pacifico.className}`}>
            {title}
            <span className={styles.cursor}>|</span>
          </h1>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${styles.input} ${error && !isValidEmail(email) ? styles.inputError : ''}`} />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input} />
          </div>

          <div className={styles.rememberMe}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkboxInput} />
              <span className={styles.checkmark}></span>
              Lembrar senha
            </label>
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitButton}>
            {isLoading ? (
              <span className={styles.loading}></span>
            ) : (
              'Entrar'
            )}
          </button>

          <div className={styles.links}>
            <Link href="/forgotpassword" className={styles.link}>Esqueceu sua senha?</Link>
            <Link href="/register" className={styles.link}>Cadastrar-se</Link>
          </div>
        </form>
      </div></>
  );
}