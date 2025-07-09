import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';

export function MatrixEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useThemeStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Caracteres para o efeito matrix
    const chars = '01';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    // Inicializar posição das gotas
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    // Função de desenho
    const draw = () => {
      // Aumentar a opacidade do fade para deixar um rastro mais longo
      ctx.fillStyle = theme === 'dark' ? 'rgba(18, 18, 18, 0.1)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#7f00ff'; // Cor roxa do Zenaix
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Reduzir a frequência de atualização dos caracteres
        if (Math.random() > 0.975) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }

        // Reduzir a velocidade de queda e a chance de reset
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.99) {
          drops[i] = 0;
        }

        // Reduzir a velocidade de queda
        if (Math.random() > 0.7) { // Apenas atualiza a posição 30% das vezes
          drops[i] += 0.05; // Reduzir o incremento para movimento mais suave
        }
      }
    };

    // Loop de animação com delay
    let animationId: number;
    const animate = () => {
      draw();
      // Adicionar um delay entre frames para reduzir a velocidade
      setTimeout(() => {
        animationId = requestAnimationFrame(animate);
      }, 50); // 50ms de delay entre cada frame
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  );
} 