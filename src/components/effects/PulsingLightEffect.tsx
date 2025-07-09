import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

interface PulsingLightEffectProps {
  className?: string;
}

export function PulsingLightEffect({ className = '' }: PulsingLightEffectProps) {
  const { theme } = useThemeStore();

  const lightColor = theme === 'dark' 
    ? 'rgba(255, 255, 255, 0.07)' 
    : 'rgba(255, 255, 255, 0.4)';

  return (
    <motion.div
      className={`absolute rounded-full blur-[100px] ${className}`}
      style={{
        background: `radial-gradient(circle, ${lightColor} 0%, transparent 70%)`,
        width: '500px',
        height: '500px',
        zIndex: 0,
      }}
      animate={{
        opacity: [0.6, 0.8, 0.6],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }}
    />
  );
} 