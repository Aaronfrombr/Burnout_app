import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import styles from "../styles/Register.module.css";
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle, X } from "lucide-react";

type ModalType = "success" | "error" | null;

interface ModalProps {
  type: ModalType;
  message: string;
  onClose: () => void;
}

const FeedbackModal = ({ type, message, onClose }: ModalProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={`${styles.modalContainer} ${type === "success" ? styles.successModal : styles.errorModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>
        <div className={styles.modalIcon}>
          {type === "success" ? (
            <CheckCircle size={50} />
          ) : (
            <AlertCircle size={50} />
          )}
        </div>
        <h3 className={styles.modalTitle}>
          {type === "success" ? "Sucesso!" : "Erro!"}
        </h3>
        <p className={styles.modalMessage}>{message}</p>
        <button 
          className={styles.modalButton}
          onClick={onClose}
        >
          {type === "success" ? "Continuar" : "Tentar novamente"}
        </button>
      </div>
    </div>
  );
};

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMessage, setModalMessage] = useState("");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Você deve aceitar os termos de uso";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        console.log("Dados do formulário:", formData);
        // Simulação de envio para o backend
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulando uma resposta bem-sucedida (aqui seria a integração com o backend)
        if (Math.random() > 0.3) { // 70% de chance de sucesso para simulação
          // Sucesso
          setModalType("success");
          setModalMessage("Seu cadastro foi realizado com sucesso! Você já pode fazer login na plataforma.");
          
          // Limpar formulário após sucesso
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false
          });
        } else {
          // Simulando erro do servidor
          throw new Error("O email informado já está em uso. Por favor, tente outro email.");
        }
      } catch (error) {
        console.error("Erro ao cadastrar:", error);
        setModalType("error");
        setModalMessage(error instanceof Error ? error.message : "Ocorreu um erro ao processar seu cadastro. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const closeModal = () => {
    setModalType(null);
    setModalMessage("");
  };
  
  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Criar Conta</h1>
            <p className={styles.subtitle}>Preencha os dados abaixo para se cadastrar</p>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Nome completo</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? styles.inputError : styles.input}
                />
              </div>
              {errors.name && <p className={styles.errorText}>{errors.name}</p>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? styles.inputError : styles.input}
                />
              </div>
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie uma senha forte"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? styles.inputError : styles.input}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.toggleButton}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirmar senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? styles.inputError : styles.input}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.toggleButton}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
            </div>
            
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>Eu li e aceito os <a href="/termos" className={styles.link}>Termos de Uso</a> e <a href="/privacidade" className={styles.link}>Política de Privacidade</a></span>
              </label>
              {errors.acceptTerms && <p className={styles.errorText}>{errors.acceptTerms}</p>}
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles.spinnerContainer}>
                  <span className={styles.spinner}></span>
                  Processando...
                </span>
              ) : (
                "Criar conta"
              )}
            </button>
            
            <div className={styles.linkContainer}>
              <span>Já tem uma conta?</span>
              <Link href="/" className={styles.loginLink}>
                Entrar
              </Link>
            </div>
          </form>
        </div>
      </div>
      
      {modalType && (
        <FeedbackModal 
          type={modalType} 
          message={modalMessage} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}