import React, { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  X,
  Layers
} from 'lucide-react';
import { Project } from '../types/index';
import { api } from '../services/api';
import { NewProjectModal } from './NewProjectModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, refreshTrigger }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const { id: currentProjectId } = useParams<{ id: string }>();

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500';
      case 'COMPLETED': return 'bg-blue-500';
      case 'ON_HOLD': return 'bg-amber-500';
      case 'ARCHIVED': return 'bg-slate-400';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111827] transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">TaskFlow</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* OVERVIEW Section */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              Overview
            </p>
            <nav className="space-y-1">
              <NavLink
                to="/"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#ede9fe] dark:bg-indigo-950/70 text-[#4f46e5] dark:text-indigo-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 text-[#4f46e5] dark:text-indigo-400" />
                <span>Dashboard</span>
              </NavLink>
            </nav>
          </div>

          {/* PROJECTS Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Projects ({projects.length})
              </p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                title="Create Project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-400">
                  No projects yet
                </div>
              ) : (
                projects.map((p) => {
                  const isActive = currentProjectId === p.id;
                  return (
                    <NavLink
                      key={p.id}
                      to={`/projects/${p.id}`}
                      onClick={onClose}
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#ede9fe] text-[#4f46e5] dark:bg-indigo-950/80 dark:text-indigo-300 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(p.status)}`} />
                        <span className="truncate">{p.name}</span>
                      </div>
                      {p._count?.tasks !== undefined && (
                        <span className="text-[10px] text-slate-400 font-normal group-hover:text-slate-600 dark:group-hover:text-slate-300">
                          {p._count.tasks}
                        </span>
                      )}
                    </NavLink>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Quick Action */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </aside>

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={() => {
            setShowNewProjectModal(false);
            fetchProjects();
          }}
        />
      )}
    </>
  );
};
