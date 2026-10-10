import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  ArrowRight, 
  Activity as ActivityIcon,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardMetrics, Project, Task, Activity } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { NewProjectModal } from '../components/NewProjectModal';
import { getUserAvatar } from '../utils/avatar';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalTasks: 0
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const displayName = user?.name || (user?.email?.split('@')[0] || 'User');

  const dedupeTasks = (taskList: Task[]): Task[] => {
    const seen = new Map<string, Task>();
    taskList.forEach((t) => {
      if (t && t.id) {
        seen.set(t.id, t);
      }
    });
    return Array.from(seen.values());
  };

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard');
      setMetrics(res.data.metrics || {
        totalProjects: 0,
        activeProjects: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalTasks: 0
      });
      setRecentProjects(res.data.recentProjects || []);
      setMyTasks(dedupeTasks(res.data.myTasks || []));
      setActivities(res.data.recentActivities || []);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
      case 'HIGH': return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
      case 'MEDIUM': return 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400';
      default: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4f46e5] border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-7 animate-in fade-in duration-200">
      {/* 1. Hero Section */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
          Welcome back, {displayName} 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here's what is happening across your projects today.
        </p>
      </div>

      {/* 2. 4 Statistic Cards matching reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* TOTAL PROJECTS */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              TOTAL PROJECTS
            </span>
            <div className="p-2.5 rounded-2xl bg-[#ede9fe] dark:bg-indigo-950/60 text-[#4f46e5] dark:text-indigo-400">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.totalProjects}
            </h3>
            <p className="text-xs text-[#4f46e5] dark:text-indigo-400 mt-2 font-medium">
              {metrics.activeProjects} active workspace{metrics.activeProjects === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* ACTIVE PROJECTS */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE PROJECTS
            </span>
            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.activeProjects}
            </h3>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-2 font-medium">
              In progress & active
            </p>
          </div>
        </div>

        {/* COMPLETED TASKS */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              COMPLETED TASKS
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.completedTasks}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              Out of {metrics.totalTasks} total tasks
            </p>
          </div>
        </div>

        {/* OVERDUE TASKS */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              OVERDUE TASKS
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.overdueTasks}
            </h3>
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 font-medium">
              {metrics.overdueTasks > 0 ? 'Requires attention' : 'All clear!'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Layout matching reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): My Assigned Tasks & Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Assigned Tasks Card */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                My Assigned Tasks
              </h3>
              <span className="text-xs font-semibold text-[#4f46e5] dark:text-indigo-400">
                {myTasks.length}
              </span>
            </div>

            {myTasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
                No tasks assigned to you right now. Great job!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myTasks.map((t) => (
                  <Link
                    key={t.id}
                    to={`/projects/${t.projectId}?task=${t.id}`}
                    className="group py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-2xl transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#4f46e5] dark:group-hover:text-indigo-400 transition truncate">
                          {t.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {t.project?.name} • Column: {t.column?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {t.dueDate && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(t.dueDate), 'MMM d')}</span>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#4f46e5] transition" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Projects Card */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Projects
              </h3>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="text-xs text-[#4f46e5] dark:text-indigo-400 font-semibold hover:underline"
              >
                + New Project
              </button>
            </div>

            {recentProjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No projects yet
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs transition group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {p.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#4f46e5] dark:group-hover:text-indigo-400 transition truncate">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {p.description || 'No description provided'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width): Recent Activity Card */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <ActivityIcon className="w-4 h-4 text-[#4f46e5]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
            </div>

            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <img
                      src={getUserAvatar(a.user, a.user?.name || 'User')}
                      alt={a.user?.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-bold text-slate-900 dark:text-white">{a.user?.name}</span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">{a.details || a.action}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {a.project && (
                          <span className="text-[10px] font-medium text-[#4f46e5] dark:text-indigo-400">
                            {a.project.name}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={fetchDashboard}
        />
      )}
    </div>
  );
};
