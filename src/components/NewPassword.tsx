import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/NewPass.module.css";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, X } from "lucide-react";
import Head from "next/head";

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
          {type === "success" ? "Senha atualizada!" : "Erro!"}
        </h3>
        <p className={styles.modalMessage}>{message}</p>
        <button 
          className={styles.modalButton}
          onClick={onClose}
        >
          {type === "success" ? "Ir para login" : "Tentar novamente"}
        </button>
      </div>
    </div>
  );
};

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMessage, setModalMessage] = useState("");
  
  useEffect(() => {
    if (token) {
      const validateToken = async () => {
        try {
          console.log("Validando token:", token);
          await new Promise(resolve => setTimeout(resolve, 800));
          
          if (typeof token === 'string' && token.length > 10) {
            setIsTokenValid(true);
          } else {
            setIsTokenValid(false);
            setErrors({
              token: "Link de redefinição inválido ou expirado. Solicite um novo link."
            });
          }
        } catch (error) {
          console.error("Erro ao validar token:", error);
          setIsTokenValid(false);
          setErrors({
            token: "Não foi possível validar seu link de redefinição. Tente novamente mais tarde."
          });
        }
      };
      
      validateToken();
    }
  }, [token]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.password) {
      newErrors.password = "Nova senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        console.log("Dados do formulário:", { ...formData, token });
        // Simulação de envio para o backend
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Sucesso (aqui seria a integração com o backend)
        setModalType("success");
        setModalMessage(
          "Sua senha foi atualizada com sucesso! Agora você pode fazer login com sua nova senha."
        );
        
        setFormData({
          password: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        setModalType("error");
        setModalMessage("Ocorreu um erro ao atualizar sua senha. Por favor, tente novamente.");
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
      router.push('/login');
    }
  };

  if (isTokenValid === false) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.container}>
          <div className={styles.formWrapper}>
            <div className={styles.headerSection}>
              <div className={styles.errorIcon}>
                <AlertCircle size={50} color="#e53e3e" />
              </div>
              <h1 className={styles.title}>Link inválido</h1>
              <p className={styles.subtitle}>
                {errors.token || "Seu link de redefinição é inválido ou expirou"}
              </p>
              <Link href="/forgot-password" className={styles.requestNewLink}>
                Solicitar um novo link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <><Head>
      <title>WellBeing - Nova Senha</title>
      <link rel="icon" href="/image/logo.png" />
    </Head><div className={styles.pageContainer}>
        <div className={styles.container}>
          <div className={styles.formWrapper}>
            <div className={styles.headerSection}>
              <h1 className={styles.title}>Criar nova senha</h1>
              <p className={styles.subtitle}>
                Digite e confirme sua nova senha abaixo
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Nova senha</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? styles.inputError : styles.input} />
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
                <label htmlFor="confirmPassword" className={styles.label}>Confirmar nova senha</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? styles.inputError : styles.input} />
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

              <div className={styles.passwordRequirements}>
                <p className={styles.requirementsTitle}>Sua senha deve conter:</p>
                <ul className={styles.requirementsList}>
                  <li className={formData.password.length >= 6 ? styles.requirementMet : ''}>
                    No mínimo 6 caracteres
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? styles.requirementMet : ''}>
                    Pelo menos uma letra maiúscula
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? styles.requirementMet : ''}>
                    Pelo menos um número
                  </li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? styles.requirementMet : ''}>
                    Pelo menos um caractere especial
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className={styles.spinnerContainer}>
                    <span className={styles.spinner}></span>
                    Atualizando...
                  </span>
                ) : (
                  "Atualizar senha"
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
            onClose={closeModal} />
        )}
      </div></>
  );
}