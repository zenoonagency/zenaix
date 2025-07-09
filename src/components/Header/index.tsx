import React, { useState } from 'react';
import { ChevronLeft, BrainCircuit, Sun, Moon, User, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../hooks/useUser';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { name, photo, plan } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="px-4 py-2 flex items-center justify-between relative bg-transparent">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.open('/pergunte-ia', '_blank')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-[#7f00ff]/10 rounded-lg transition-colors bg-white dark:bg-dark-700"
        >
          <img 
            src="https://zenaix.com.br/wp-content/uploads/2025/03/pergunte-a-IA.webp" 
            alt="IA" 
            className="w-5 h-5 mr-1" 
          />
          Pergunte à IA
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#7f00ff]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#7f00ff]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#7f00ff]" />
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{plan}</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg py-1 z-50">
              <Link
                to="/perfil"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                Perfil
              </Link>
              <button
                onClick={() => {/* Lógica de logout */}}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 