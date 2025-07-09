import React, { useState } from 'react';
import { X, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: ContactData) => void;
  title: string;
  type: 'service' | 'feedback';
  formData?: any;
}

export interface ContactData {
  name: string;
  phone: string;
  email: string;
}

export function ContactModal({ isOpen, onClose, onSubmit, title, type, formData }: ContactModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [contactData, setContactData] = useState<ContactData>({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro ao editar
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: {
      name?: string;
      phone?: string;
      email?: string;
    } = {};
    
    if (!contactData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!contactData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^[0-9]{10,11}$/.test(contactData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Telefone inválido (deve conter 10-11 dígitos)';
    }
    
    if (!contactData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(contactData);
    }
  };

  return (
    <div className={`fixed inset-0 ${
      isDark ? 'bg-black/60' : 'bg-gray-800/40'
    } backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 transition-all`}>
      <div className={`${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      } rounded-xl shadow-2xl border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300`}>
        <div className={`p-4 border-b ${
          isDark ? 'border-dark-700' : 'border-gray-200'
        } flex items-center justify-between`}>
          <h2 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Nome completo
              </label>
              <div className={`relative ${errors.name ? 'mb-6' : 'mb-0'}`}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={contactData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 p-2.5 rounded-lg ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-gray-300 focus:border-[#7f00ff]/70' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#7f00ff]'
                  } border ${errors.name ? (isDark ? 'border-red-500' : 'border-red-500') : ''} outline-none focus:ring-2 focus:ring-[#7f00ff]/20 transition-all`}
                  placeholder="Digite seu nome completo"
                />
                {errors.name && (
                  <p className="absolute text-xs text-red-500 -bottom-5 left-0 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Telefone
              </label>
              <div className={`relative ${errors.phone ? 'mb-6' : 'mb-0'}`}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={contactData.phone}
                  onChange={handleChange}
                  className={`w-full pl-10 p-2.5 rounded-lg ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-gray-300 focus:border-[#7f00ff]/70' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#7f00ff]'
                  } border ${errors.phone ? (isDark ? 'border-red-500' : 'border-red-500') : ''} outline-none focus:ring-2 focus:ring-[#7f00ff]/20 transition-all`}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && (
                  <p className="absolute text-xs text-red-500 -bottom-5 left-0 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <div className={`relative ${errors.email ? 'mb-6' : 'mb-0'}`}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={contactData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 p-2.5 rounded-lg ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-gray-300 focus:border-[#7f00ff]/70' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#7f00ff]'
                  } border ${errors.email ? (isDark ? 'border-red-500' : 'border-red-500') : ''} outline-none focus:ring-2 focus:ring-[#7f00ff]/20 transition-all`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="absolute text-xs text-red-500 -bottom-5 left-0 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className={`pt-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>
                Seus dados serão usados apenas para responder sua solicitação.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg ${
                  isDark 
                    ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } transition-colors`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#7f00ff] hover:bg-[#8a00ff] text-white rounded-lg transition-colors shadow-md"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 