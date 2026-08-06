import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import useToastStore from '../../stores/useToastStore';

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let bgColor = 'bg-gray-800';
          let textColor = 'text-white';
          
          if (toast.type === 'error') {
            Icon = AlertCircle;
            bgColor = 'bg-red-500';
          } else if (toast.type === 'success') {
            Icon = CheckCircle2;
            bgColor = 'bg-komorebi-primary'; // Or bg-[#5D8B66]
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto backdrop-blur-md bg-opacity-90 ${bgColor} ${textColor}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <p className="font-sans font-medium text-[15px]">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
