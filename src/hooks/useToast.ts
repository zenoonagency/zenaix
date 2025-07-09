import { useToastStore } from '../components/Notification';

export const useToast = () => {
  const { addToast, removeToast } = useToastStore();

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = addToast(message, type);
    setTimeout(() => removeToast(id), 3000);
  };

  return { showToast };
};