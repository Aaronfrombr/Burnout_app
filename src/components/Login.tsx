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
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });
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

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      password: ""
    };

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Por favor, insira um email válido";
      valid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response: any = await login(formData.email, formData.password);
      
      if (response.success) {
        // Login bem-sucedido
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', response.token);
        storage.setItem('userData', JSON.stringify({
          name: response.user.name,
          email: response.user.email
        }));
        setModal({
          type: 'success',
          message: 'Login realizado com sucesso! Redirecionando...'
        });
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500);
        
        // Armazena o token e redireciona
      } else {
        setModal({
          type: 'error',
          message: response.message || 'Credenciais inválidas'
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setModal({
        type: 'error',
        message: 'Erro ao conectar com o servidor. Tente novamente mais tarde.'
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

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
                name="email"
                type="email"
                placeholder="Digite seu email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              />
            </div>
            {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Senha</label>
            <Lock size={18} className={styles.inputIcon} />
            <div className={styles.inputWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.toggleButton}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
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

          <button 
            type="submit" 
            disabled={isLoading} 
            className={styles.submitButton}
            aria-busy={isLoading}
          >
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