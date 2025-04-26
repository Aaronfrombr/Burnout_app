import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { login } from "../models/api";
import styles from '../styles/Login.module.css';
import Image from "next/image";
import Head from 'next/head';
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, X } from "lucide-react";


const backgroundImages = [
  "/image/Janeiro-Branco-Bem-estar-Psicologico-e-Emocional.jpg",
  "/image/bem-estar.png",
  "/image/bem-estar-psicologico.avif",
];

type ModalProps = {
  type: 'success' | 'error' | null;
  message: string;
  onClose: () => void;
};

const FeedbackModal = ({ type, message, onClose }: ModalProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={`${styles.modalContainer} ${type === 'success' ? styles.successModal : styles.errorModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>
        <div className={styles.modalIcon}>
          {type === 'success' ? <CheckCircle size={50} /> : <AlertCircle size={50} />}
        </div>
        <h3 className={styles.modalTitle}>
          {type === 'success' ? 'Sucesso!' : 'Erro!'}
        </h3>
        <p className={styles.modalMessage}>{message}</p>
        <button 
          className={styles.modalButton}
          onClick={onClose}
        >
          {type === 'success' ? 'Continuar' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  );
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modal, setModal] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

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
    
    if (!isValidEmail(email)) {
      setModal({ type: 'error', message: 'Por favor, insira um email válido' });
      return;
    }

    if (password.length < 6) {
      setModal({ type: 'error', message: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(email, password);
      
      if (response.success) {
        // Armazena o token de acordo com a preferência do usuário
        if (rememberMe) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userData', JSON.stringify(response.user));
        } else {
          sessionStorage.setItem('authToken', response.token);
          sessionStorage.setItem('userData', JSON.stringify(response.user));
        }
        
        setModal({
          type: 'success',
          message: 'Login realizado com sucesso! Redirecionando...'
        });
        
        // Redireciona após 2 segundos
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        setModal({
          type: 'error',
          message: response.message || 'Credenciais inválidas. Tente novamente.'
        });
      }
    } catch (err) {
      setModal({
        type: 'error',
        message: 'Ocorreu um erro ao conectar com o servidor. Tente novamente mais tarde.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>WellBeing | Login</title>
        <link rel="icon" href="/image/logo.png" />
      </Head>
      
      <div className={styles.animatedContainer}>
        <div className={styles.backgroundContainer}>
          {backgroundImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Background ${index + 1}`}
              fill
              quality={100}
              priority={index === 0}
              className={`${styles.backgroundImage} ${index === currentImageIndex ? styles.active : ''}`}
            />
          ))}
          <div className={styles.backgroundOverlay}></div>
          <div className={styles.topGradient}></div>
          <div className={styles.bottomGradient}></div>
          <div className={styles.leftGradient}></div>
          <div className={styles.rightGradient}></div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h1 className={`${styles.title}`}>
            {title}
            <span className={styles.cursor}>|</span>
          </h1>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <Mail size={18} className={styles.inputIcon} />
            <div className={styles.inputWrapper}>
              
              <input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${styles.input} ${modal.type === 'error' && !isValidEmail(email) ? styles.inputError : ''}`}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Senha</label>
            <Lock size={18} className={styles.inputIcon} />
            <div className={styles.inputWrapper}>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${styles.input} ${modal.type === 'error' && password.length < 6 ? styles.inputError : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.toggleButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.rememberMe}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkboxInput}
              />
              <span className={styles.checkmark}></span>
              Lembrar de mim
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
            <Link href="/forgotpassword" className={styles.link}>
              Esqueceu sua senha?
            </Link>
            <Link href="/register" className={styles.link}>
              Criar uma conta
            </Link>
          </div>
        </form>
      </div>

      {modal.type && (
        <FeedbackModal
          type={modal.type}
          message={modal.message}
          onClose={() => setModal({ type: null, message: '' })}
        />
      )}
    </>
  );
}