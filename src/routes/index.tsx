import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Dashboard } from '../pages/Dashboard';
import { Financial } from '../pages/Financial';
import { Conversations } from '../pages/Conversations';
import { AIAgent } from '../pages/AIAgent';
import { Clients } from '../pages/Clients';
import { Contacts } from '../pages/Contacts';
import { Contracts } from '../pages/Contracts';
import { Messaging } from '../pages/Messaging';
import { Team } from '../pages/Team';
import { Plans } from '../pages/Plans';
import { Profile } from '../pages/Profile';
import { Calendar } from '../pages/Calendar';
import { EmbedPages } from '../pages/EmbedPages';
import { Settings } from '../pages/Settings';
import { DataTables } from '../pages/DataTables';
import { Help } from '../pages/Help';
import { Tags } from '../pages/Tags';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PageTransition } from '../components/PageTransition';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <DashboardLayout />,
        children: [
          {
            path: '',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            children: [
              {
                path: '',
                element: <PageTransition><Dashboard /></PageTransition>,
              },
              {
                path: 'conversations',
                element: <PageTransition><Conversations /></PageTransition>,
              },
              {
                path: 'ai-agent',
                element: <PageTransition><AIAgent /></PageTransition>,
              },
              {
                path: 'clients',
                element: <PageTransition><Clients /></PageTransition>,
              },
              {
                path: 'contacts',
                element: <PageTransition><Contacts /></PageTransition>,
              },
              {
                path: 'financial',
                element: <PageTransition><Financial /></PageTransition>,
              },
              {
                path: 'contracts',
                element: <PageTransition><Contracts /></PageTransition>,
              },
              {
                path: 'messaging',
                element: <PageTransition><Messaging /></PageTransition>,
              },
              {
                path: 'team',
                element: <PageTransition><Team /></PageTransition>,
              },
              {
                path: 'calendar',
                element: <PageTransition><Calendar /></PageTransition>,
              },
              {
                path: 'embed-pages',
                element: <PageTransition><EmbedPages /></PageTransition>,
              },
              {
                path: 'plans',
                element: <PageTransition><Plans /></PageTransition>,
              },
              {
                path: 'profile',
                element: <PageTransition><Profile /></PageTransition>,
              },
              {
                path: 'settings',
                element: <PageTransition><Settings /></PageTransition>,
              },
              {
                path: 'data-tables',
                element: <PageTransition><DataTables /></PageTransition>,
              },
              {
                path: 'help',
                element: <PageTransition><Help /></PageTransition>,
              },
              {
                path: 'tags',
                element: <PageTransition><Tags /></PageTransition>,
              },
            ],
          },
          {
            path: '*',
            element: <Navigate to="/dashboard" replace />,
          }
        ],
      },
    ],
  },
]); 