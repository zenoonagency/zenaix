import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from './pages/Dashboard';
import { AIAgent } from './pages/AIAgent';
import { Clients } from './pages/Clients';
import { Contacts } from './pages/Contacts';
import { Financial } from './pages/Financial';
import { Contracts } from './pages/Contracts';
import { Messaging } from './pages/Messaging';
import { Team } from './pages/Team';
import { Conversations } from './pages/Conversations';
import { Calendar } from './pages/Calendar/index';
import { DataTables } from './pages/DataTables';
import { Settings } from './pages/Settings';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useThemeStore } from './store/themeStore';
import { Plans } from './pages/Plans';
import { EmbedPages } from './pages/EmbedPages';
import { ToastContainer } from 'react-toastify';
import { PageTransition } from './components/PageTransition';
import { NetworkStatus } from './components/NetworkStatus';
import 'react-toastify/dist/ReactToastify.css';
import { Help } from './pages/Help';

export function App() {
  return (
    <BrowserRouter>
      <NetworkStatus />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <AnimatePresence mode="wait">
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/dashboard/ai-agent" element={<PageTransition><AIAgent /></PageTransition>} />
            <Route path="/dashboard/clients" element={<PageTransition><Clients /></PageTransition>} />
            <Route path="/dashboard/contacts" element={<PageTransition><Contacts /></PageTransition>} />
            <Route path="/dashboard/financial" element={<PageTransition><Financial /></PageTransition>} />
            <Route path="/dashboard/contracts" element={<PageTransition><Contracts /></PageTransition>} />
            <Route path="/dashboard/messaging" element={<PageTransition><Messaging /></PageTransition>} />
            <Route path="/dashboard/team" element={<PageTransition><Team /></PageTransition>} />
            <Route path="/dashboard/conversations" element={<PageTransition><Conversations /></PageTransition>} />
            <Route path="/dashboard/calendar" element={<PageTransition><Calendar /></PageTransition>} />
            <Route path="/dashboard/data-tables" element={<PageTransition><DataTables /></PageTransition>} />
            <Route path="/dashboard/settings" element={<PageTransition><Settings /></PageTransition>} />
            <Route path="/dashboard/plans" element={<PageTransition><Plans /></PageTransition>} />
            <Route path="/dashboard/embed-pages" element={<PageTransition><EmbedPages /></PageTransition>} />
            <Route path="/dashboard/help" element={<PageTransition><Help /></PageTransition>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}