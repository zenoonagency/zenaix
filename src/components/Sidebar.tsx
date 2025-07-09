import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  LayoutList,
  Users,
  DollarSign,
  FileText,
  Send,
  UserPlus,
  CreditCard,
  Calendar,
  Tag,
  Settings,
  Globe
} from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 p-6">
      <div className="mb-8">
        <img src="https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK-SMALL.png" alt="Zenaix" className="h-8" />
      </div>
      
      <nav className="flex flex-col h-full">
        <div className="space-y-2 flex-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/conversations"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <MessageSquare size={20} />
            Conversas
          </NavLink>

          <NavLink
            to="/dashboard/ai-agent"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <Brain size={20} />
            Agente IA
          </NavLink>

          <NavLink
            to="/dashboard/clients"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <LayoutList size={20} />
            Gestão de funil
          </NavLink>

          <NavLink
            to="/dashboard/contacts"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <Users size={20} />
            Contatos
          </NavLink>

          <NavLink
            to="/dashboard/financial"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <DollarSign size={20} />
            Financeiro
          </NavLink>

          <NavLink
            to="/dashboard/contracts"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <FileText size={20} />
            Contratos
          </NavLink>

          <NavLink
            to="/dashboard/messaging"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <Send size={20} />
            Disparo
          </NavLink>

          <NavLink
            to="/dashboard/team"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <Users size={20} />
            Equipe
          </NavLink>

          <NavLink
            to="/dashboard/calendar"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <Calendar size={20} />
            Calendário
          </NavLink>
        </div>

        <div className="space-y-2 pt-4">
          <NavLink
            to="/dashboard/tags"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <Tag size={20} />
            Marcadores
          </NavLink>

          <NavLink
            to="/dashboard/embed-pages"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-violet-600 hover:text-gray-200'
              }`
            }
          >
            <Globe size={20} />
            Páginas Embed
          </NavLink>
        </div>
      </nav>
    </aside>
  );
} 