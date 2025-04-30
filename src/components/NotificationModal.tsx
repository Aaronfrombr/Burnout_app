import { useState, useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "error" | null;
  message: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, status, message }) => {
  // Fecha o modal após 5 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay com backdrop blur */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal container com animação */}
      <div className={`
        transform transition-all duration-500 ease-out
        animate-fadeIn
        ${status === 'success' ? 'bg-emerald-50' : 'bg-rose-50'}
        p-6 rounded-xl shadow-xl w-full max-w-md relative z-10
        border-l-4 ${status === 'success' ? 'border-emerald-500' : 'border-rose-500'}
      `}>
        {/* Botão de fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center">
          {/* Ícone animado */}
          <div className={`
            flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center
            ${status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}
          `}>
            {status === 'success' ? (
              <Check className="animate-bounce" size={32} />
            ) : (
              <AlertCircle className="animate-pulse" size={32} />
            )}
          </div>
          
          {/* Texto da notificação */}
          <div className="ml-5">
            <h3 className={`
              text-lg font-bold
              ${status === 'success' ? 'text-emerald-800' : 'text-rose-800'}
            `}>
              {status === 'success' ? 'Mensagem Enviada!' : 'Erro no Envio'}
            </h3>
            <p className={`
              mt-2 text-sm
              ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}
            `}>
              {message || (status === 'success' 
                ? 'Sua mensagem foi enviada com sucesso. Entraremos em contato em breve!' 
                : 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.')}
            </p>
          </div>
        </div>
        
        {/* Botão de ação */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className={`
              w-full py-2 px-4 rounded-lg font-medium text-black 
              ${status === 'success' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-rose-600 hover:bg-rose-700'}
              transition-colors
            `}
          >
            {status === 'success' ? 'Ótimo!' : 'Tentar novamente'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Exportar o componente de modal para uso em outros arquivos
export { NotificationModal };

// Demonstração de como usar o componente
export default function ModalDemo() {
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>('success');
  
  const handleShowSuccess = () => {
    setStatus('success');
    setShowModal(true);
  };
  
  const handleShowError = () => {
    setStatus('error');
    setShowModal(true);
  };
  
  const handleClose = () => {
    setShowModal(false);
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex gap-4">
        <button 
          onClick={handleShowSuccess}
          className="px-4 py-2 bg-emerald-600 text-black rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Mostrar Sucesso
        </button>
        
        <button 
          onClick={handleShowError}
          className="px-4 py-2 bg-rose-600 text-black rounded-lg hover:bg-rose-700 transition-colors"
        >
          Mostrar Erro
        </button>
      </div>
      
      <NotificationModal 
        isOpen={showModal} 
        onClose={handleClose} 
        status={status} 
        message={status === 'success' 
          ? "Seu email foi enviado com sucesso! Entraremos em contato em breve." 
          : "Ocorreu um erro ao enviar seu email. Por favor, tente novamente mais tarde."}
      />
    </div>
  );
}