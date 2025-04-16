import { useState, FormEvent } from "react";
import Link from "next/link";
import styles from "../styles/Forgot.module.css";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, X } from "lucide-react";

type ModalType = "success" | "error" | null;

interface ModalProps {
  type: ModalType;
  message: string;
  onClose: () => void;
}

const FeedbackModal = ({ type, message, onClose }: ModalProps) => {
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
          {type === "success" ? "Email enviado!" : "Erro!"}
        </h3>
        <p className={styles.modalMessage}>{message}</p>
        <button 
          className={styles.modalButton}
          onClick={onClose}
        >
          {type === "success" ? "Voltar para login" : "Tentar novamente"}
        </button>
      </div>
    </div>
  );
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMessage, setModalMessage] = useState("");
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        console.log("Email para redefinição:", email);
        // Simulação de envio para o backend
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulando uma resposta (aqui seria a integração com o backend)
        if (Math.random() > 0.2) { // 80% de chance de sucesso para simulação
          // Sucesso
          setModalType("success");
          setModalMessage(
            `Um link para redefinição de senha foi enviado para ${email}. 
            Por favor, verifique sua caixa de entrada e siga as instruções.`
          );
          
          setEmail("");
        } else {
          throw new Error("Não encontramos uma conta associada a este email. Verifique se digitou corretamente.");
        }
      } catch (error) {
        console.error("Erro ao solicitar redefinição:", error);
        setModalType("error");
        setModalMessage(error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const closeModal = () => {
    setModalType(null);
    setModalMessage("");
    
    // Se o modal era de sucesso, redirecionar para login
    if (modalType === "success") {
      // Na prática, você usaria o router do Next.js para navegar
      // router.push('/login');
      console.log("Redirecionando para login...");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.headerSection}>
            <div className={styles.returnLinkContainer}>
              <Link href="/" className={styles.returnLink}>
                <ArrowLeft size={16} />
                <span>Voltar para login</span>
              </Link>
            </div>
            <h1 className={styles.title}>Esqueceu a senha?</h1>
            <p className={styles.subtitle}>
              Digite seu email e enviaremos um link para você redefinir sua senha
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Digite seu email cadastrado"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? styles.inputError : styles.input}
                />
              </div>
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles.spinnerContainer}>
                  <span className={styles.spinner}></span>
                  Enviando...
                </span>
              ) : (
                "Enviar link de redefinição"
              )}
            </button>
            
            <div className={styles.linkContainer}>
              <span>Lembrou sua senha?</span>
              <Link href="/" className={styles.loginLink}>
                Voltar para o login
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