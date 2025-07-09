import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import { NetworkStatus } from './components/NetworkStatus';
import { Notification } from './components/Notification';
import { useThemeStore } from './store/themeStore';
import { router } from './routes';
import 'react-toastify/dist/ReactToastify.css';

export function App() {
  const { theme } = useThemeStore();
  
  return (
    <>
      <NetworkStatus />
      <Notification />
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />
      <AnimatePresence mode="wait">
        <RouterProvider router={router} />
      </AnimatePresence>
    </>
  );
}