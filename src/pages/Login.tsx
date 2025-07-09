import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/Input';
import { useThemeStore } from '../store/themeStore';
import { ParticlesEffect } from '../components/effects/ParticlesEffect';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useThemeStore();

  const logoUrl = theme === 'dark' 
    ? 'https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png'
    : 'https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png'; // Always use light logo for better visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login timing
    setTimeout(() => {
      setLoading(false);
      
      // For demo purposes, always succeed
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 1500);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-blue-800 via-blue-600 to-indigo-800">
      {/* Blurred particles effect */}
      <div className="absolute inset-0 filter blur-[6px] opacity-40">
        <ParticlesEffect blueTheme={true} />
      </div>
      
      {/* Decorative shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[30rem] h-[30rem] bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
      
      {/* Login container */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Login card with glowing border */}
        <motion.div 
          className="relative backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Snake border effect container */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden z-0">
            <div className="snake-border rounded-3xl"></div>
          </div>
          
          {/* Glass background */}
          <div className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-8">
            {/* Logo and content */}
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <img
                  src={logoUrl}
                  alt="Zenoon"
                  className="w-32 h-auto"
                />
              </motion.div>
              
              <motion.h2 
                className="text-2xl font-bold text-center mb-8 text-white"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Seja bem-vindo!
              </motion.h2>
              
              {/* Login form */}
              <motion.form 
                onSubmit={handleSubmit}
                className="w-full space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      label="Email"
                      required
                      className="bg-white/10 border-white/10 text-white focus:border-white/30 focus:ring-white/20"
                      labelClassName="text-white font-medium mb-1.5"
                      placeholder="Seu endereço de email"
                    />
                  </div>
                  
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      label="Senha"
                      required
                      className="bg-white/10 border-white/10 text-white focus:border-white/30 focus:ring-white/20"
                      labelClassName="text-white font-medium mb-1.5"
                      placeholder="Sua senha"
                    />
                    <button 
                      type="button"
                      onClick={toggleShowPassword}
                      className="absolute right-3 top-[48px] transform -translate-y-1/2 text-white/60 hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 px-4 rounded-xl 
                      hover:from-indigo-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400/50 
                      focus:ring-offset-2 disabled:opacity-70 transition-all duration-200 
                      shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.4)]"
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
                </div>
                
                <div className="flex justify-end">
                  <a 
                    href="#" 
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
              </motion.form>
            </div>
          </div>
        </motion.div>
        
        {/* Brand tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8 text-white/60 text-sm"
        >
          &copy; {new Date().getFullYear()} Zenoon AI - Plataforma de Automação
        </motion.div>
      </div>
      
      {/* CSS for snake border effect */}
      <style jsx>{`
        .snake-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, 
            transparent, 
            rgba(255, 255, 255, 0.2), 
            rgba(255, 255, 255, 0.4), 
            rgba(255, 255, 255, 0.2), 
            transparent
          );
          animation: animate 4s linear infinite;
          transform: translateX(-100%);
        }
        
        @keyframes animate {
          to {
            transform: translateX(0%);
          }
        }
        
        .snake-border::after {
          content: '';
          position: absolute;
          inset: 3px;
          background: transparent;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}