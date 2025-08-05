import { useState, useCallback, useRef } from 'react';

interface Size {
  width: number;
  height: number;
}

interface UseResizeOptions {
  initialSize?: Size;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const useResize = ({ 
  initialSize = { width: 400, height: 600 }, 
  minWidth = 300,
  minHeight = 400,
  maxWidth = window.innerWidth * 0.8,
  maxHeight = window.innerHeight * 0.9
}: UseResizeOptions = {}) => {
  const [size, setSize] = useState<Size>(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sizeStart = useRef<Size>(initialSize);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = size;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;
      
      let newWidth = sizeStart.current.width;
      let newHeight = sizeStart.current.height;

      if (direction === 'right' || direction === 'corner') {
        newWidth = sizeStart.current.width + deltaX;
      }
      
      if (direction === 'bottom' || direction === 'corner') {
        newHeight = sizeStart.current.height + deltaY;
      }

      // Aplicar limites
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [size, minWidth, minHeight, maxWidth, maxHeight]);

  const resetSize = useCallback(() => {
    setSize(initialSize);
  }, [initialSize]);

  return {
    size,
    isResizing,
    handleResizeStart,
    resetSize,
  };
};