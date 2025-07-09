import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DefaultLayout } from '../layouts/DefaultLayout';
import { Dashboard } from '../pages/Dashboard';
import { Financial } from '../pages/Financial';
import { Kanban } from '../pages/Kanban';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
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
            element: <Dashboard />,
          },
          {
            path: 'conversations',
            element: <Conversations />,
          },
          {
            path: 'ai-agent',
            element: <AIAgent />,
          },
          {
            path: 'clients',
            element: <Clients />,
          },
          {
            path: 'contacts',
            element: <Contacts />,
          },
          {
            path: 'financial',
            element: <Financial />,
          },
          {
            path: 'contracts',
            element: <Contracts />,
          },
          {
            path: 'messaging',
            element: <Messaging />,
          },
          {
            path: 'team',
            element: <Team />,
          },
          {
            path: 'calendar',
            element: <Calendar />,
          },
          {
            path: 'embed-pages',
            element: <EmbedPages />,
          },
          {
            path: 'plans',
            element: <Plans />,
          },
          {
            path: 'profile',
            element: <Profile />,
          }
        ],
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      }
    ],
  },
]); 