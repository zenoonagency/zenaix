import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  baseRadius: number;
  color: string;
}

interface Mouse {
  x: number | null;
  y: number | null;
  radius: number;
}

export function ParticlesEffect({ blueTheme = false }: { blueTheme?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useThemeStore();
  const mouseRef = useRef<Mouse>({ x: null, y: null, radius: 150 });
  const isDark = theme === 'dark';

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

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Configurações das partículas
    const particlesArray: Particle[] = [];
    // Mais partículas no tema claro para melhor visibilidade
    const numberOfParticles = blueTheme 
      ? (isDark ? 150 : 180) 
      : (isDark ? 100 : 160);
    const baseRadius = blueTheme ? 2.5 : (isDark ? 2 : 2.2);
    const maxRadius = blueTheme ? 6 : (isDark ? 5 : 6);
    const maxSpeed = 0.4;
    const connectionDistance = blueTheme ? 180 : (isDark ? 150 : 200);

    // Definir cores para diferentes temas
    const getRandomColor = () => {
      if (blueTheme) {
        // Cores para o tema azul (variações de azul e roxo)
        if (isDark) {
          const colors = [
            '#4dabf7', // azul claro
            '#3b82f6', // azul
            '#748ffc', // azul-violeta
            '#7c3aed', // violeta 
            '#6366f1', // indigo
            '#a78bfa', // lilás
          ];
          return colors[Math.floor(Math.random() * colors.length)];
        } else {
          // Cores para tema azul no modo claro (mais saturadas e escuras)
          const colors = [
            '#1e40af', // azul escuro
            '#3730a3', // indigo escuro
            '#6d28d9', // violeta escuro
            '#4f46e5', // azul-violeta escuro
            '#4338ca', // indigo escuro
            '#7e22ce', // roxo escuro
          ];
          return colors[Math.floor(Math.random() * colors.length)];
        }
      } else {
        // Cores padrão
        return isDark ? '#7f00ff' : '#6200ea'; // Roxo mais escuro no tema claro
      }
    };

    // Criar partículas
    for (let i = 0; i < numberOfParticles; i++) {
      const radius = Math.random() * baseRadius + 1;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const dx = (Math.random() - 0.5) * maxSpeed;
      const dy = (Math.random() - 0.5) * maxSpeed;
      const color = getRandomColor();
      
      particlesArray.push({ 
        x, 
        y, 
        dx, 
        dy, 
        radius,
        baseRadius: radius,
        color
      });
    }

    // Desenhar partículas e conexões
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesArray.forEach((particle, i) => {
        // Atualizar posição
        particle.x += particle.dx;
        particle.y += particle.dy;

        // Verificar colisão com bordas
        if (particle.x < 0 || particle.x > canvas.width) particle.dx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.dy *= -1;

        // Interação com o mouse
        if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRef.current.radius) {
            // Aumentar o tamanho da partícula quando próxima ao mouse
            const scale = (1 - distance / mouseRef.current.radius) * 2;
            particle.radius = particle.baseRadius + (maxRadius * scale);
            
            // Adicionar uma pequena força de repulsão
            const angle = Math.atan2(dy, dx);
            const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
            particle.dx -= Math.cos(angle) * force * 0.5;
            particle.dy -= Math.sin(angle) * force * 0.5;
          } else {
            particle.radius = particle.baseRadius;
          }
        } else {
          particle.radius = particle.baseRadius;
        }

        // Desenhar partícula
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Desenhar conexões
        for (let j = i + 1; j < particlesArray.length; j++) {
          const dx = particle.x - particlesArray[j].x;
          const dy = particle.y - particlesArray[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            // Maior opacidade para conexões no tema claro
            const baseOpacity = isDark ? 0.6 : 0.8;
            const opacity = blueTheme ? 
              (1 - distance / connectionDistance) * baseOpacity :
              (1 - distance / connectionDistance) * (isDark ? 1 : 0.85);
            
            ctx.beginPath();
            
            if (blueTheme) {
              // Gradiente para as linhas com tema azul
              const gradient = ctx.createLinearGradient(
                particle.x, particle.y, 
                particlesArray[j].x, particlesArray[j].y
              );
              gradient.addColorStop(0, particle.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba'));
              gradient.addColorStop(1, particlesArray[j].color.replace(')', `, ${opacity})`).replace('rgb', 'rgba'));
              ctx.strokeStyle = gradient;
            } else {
              // No tema claro, usar cor roxa mais escura
              ctx.strokeStyle = isDark 
                ? `rgba(127, 0, 255, ${opacity})` 
                : `rgba(98, 0, 234, ${opacity})`;
            }
            
            // Linhas mais grossas no tema claro
            ctx.lineWidth = blueTheme ? 0.6 : (isDark ? 0.5 : 0.8);
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
            ctx.stroke();
          }
        }
      });
    };

    // Loop de animação
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [theme, blueTheme, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${
        isDark 
          ? (blueTheme ? 'opacity-40' : 'opacity-30') 
          : (blueTheme ? 'opacity-60' : 'opacity-40')
      }`}
      style={{ zIndex: 0 }}
    />
  );
}
 