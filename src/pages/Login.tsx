import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/Input';
import { useThemeStore } from '../store/themeStore';
import { ParticlesEffect } from '../components/effects/ParticlesEffect';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { showToast } = useToast();

  const logoUrl = theme === 'dark' 
    ? 'https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png'
    : 'https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      // Salvar dados no store
      login(response.data, response.token);
      
      showToast('Login realizado com sucesso!', 'success');
      
      // Redirecionar para dashboard
      navigate('/dashboard');
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Efeito de partículas no fundo */}
      <ParticlesEffect />
      
      <motion.div 
        className="bg-white dark:bg-dark-800 p-8 rounded-lg shadow-md w-96 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 relative z-10"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="flex items-center justify-center mb-6"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <img
            src={logoUrl}
            alt="Login"
            className="w-24"
          />
        </motion.div>
        <motion.h2 
          className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Seja bem-vindo!
        </motion.h2>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          >
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
              required
            />
          </motion.div>
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Senha"
                required
              />
              <button 
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Autenticando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </motion.div>
        </form>
        <motion.div 
          className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          Não tem uma conta?{' '}
          <Link 
            to="/register" 
            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
            onClick={handleRegisterClick}
          >
            Cadastre-se
          </Link>
        </motion.div>
        <motion.div 
          className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <a 
            href="#" 
            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
          >
            Esqueceu sua senha?
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}