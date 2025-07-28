import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

export function HelpButton() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const handleClick = () => {
    navigate('/dashboard/help');
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed 
        bottom-20 
        right-6 
        flex 
        items-center 
        gap-2 
        px-4 
        py-3 
        rounded-full 
        shadow-lg 
        hover:shadow-xl 
        transition-all 
        duration-300 
        z-50
        ${isDark 
          ? 'bg-[#7f00ff] hover:bg-[#8a00ff] text-white' 
          : 'bg-[#7f00ff] hover:bg-[#8a00ff] text-white'
        }
        transform hover:scale-105
      `}
      aria-label="Abrir ajuda"
    >
      <HelpCircle className="w-5 h-5" />
      <span className="font-medium">Ajuda</span>
    </button>
  );
} 