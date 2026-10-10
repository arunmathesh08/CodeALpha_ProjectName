import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Trash2, 
  Search, 
  Kanban, 
  ListTodo, 
  ChevronRight,
  FolderKanban,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { Project, Task, Column } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { NewTaskModal } from '../components/NewTaskModal';
import { ProjectMembersModal } from '../components/ProjectMembersModal';
import { format } from 'date-fns';
import { getUserAvatar } from '../utils/avatar';

export const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskInitialColumnId, setNewTaskInitialColumnId] = useState<string | undefined>(undefined);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Strict task deduplication helper by ID
  const dedupeTasks = (taskList: Task[]): Task[] => {
    const seen = new Map<string, Task>();
    taskList.forEach((t) => {
      if (t && t.id) {
        seen.set(t.id, t);
      }
    });
    return Array.from(seen.values());
  };

  const fetchProjectDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/projects/${id}`);
      const proj = res.data.project;
      setProject(proj);

      if (proj.boards && proj.boards.length > 0) {
        const boardCols = proj.boards[0].columns || [];
        setColumns(boardCols);

        const allTasks: Task[] = [];
        boardCols.forEach((col: Column) => {
          if (col.tasks) {
            col.tasks.forEach((t: Task) => {
              allTasks.push({ ...t, column: col });
            });
          }
        });
        setTasks(dedupeTasks(allTasks));
      }
    } catch (err: any) {
      console.error('Error fetching project', err);
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Handle URL ?task=123 to open task modal directly
  useEffect(() => {
    const taskIdFromUrl = searchParams.get('task');
    if (taskIdFromUrl && tasks.length > 0) {
      const target = tasks.find(t => t.id === taskIdFromUrl);
      if (target) {
        setSelectedTask(target);
      }
    }
  }, [searchParams, tasks]);

  // Socket.IO real-time project room listener
  useEffect(() => {
    if (!id || !socket) return;

    joinProject(id);

    const handleTaskCreated = (newTask: Task) => {
      setTasks(prev => {
        const exists = prev.some(t => t.id === newTask.id);
        if (exists) {
          return prev.map(t => (t.id === newTask.id ? { ...t, ...newTask } : t));
        }
        return dedupeTasks([...prev, newTask]);
      });
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks(prev =>
        dedupeTasks(prev.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)))
      );
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    };

    const handleTaskMoved = (data: { taskId: string; columnId: string; order: number; task: Task }) => {
      setTasks(prev => {
        const exists = prev.some(t => t.id === data.taskId);
        if (exists) {
          return dedupeTasks(
            prev.map(t =>
              t.id === data.taskId ? { ...t, ...data.task, columnId: data.columnId, order: data.order } : t
            )
          );
        }
        return dedupeTasks([...prev, { ...data.task, columnId: data.columnId, order: data.order }]);
      });
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      setTasks(prev => dedupeTasks(prev.filter(t => t.id !== data.taskId)));
      if (selectedTask?.id === data.taskId) {
        setSelectedTask(null);
      }
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_moved', handleTaskMoved);
    socket.on('task_deleted', handleTaskDeleted);

    return () => {
      leaveProject(id);
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_moved', handleTaskMoved);
      socket.off('task_deleted', handleTaskDeleted);
    };
  }, [id, socket, joinProject, leaveProject, selectedTask?.id]);

  const handleTaskMove = async (
    taskId: string,
    sourceColId: string,
    destColId: string,
    newOrder: number
  ) => {
    setTasks(prev => {
      return dedupeTasks(
        prev.map(t => {
          if (t.id === taskId) {
            return { ...t, columnId: destColId, order: newOrder };
          }
          return t;
        })
      );
    });

    try {
      await api.put(`/tasks/${taskId}/move`, {
        columnId: destColId,
        order: newOrder
      });
    } catch (err) {
      console.error('Failed to persist task move', err);
      fetchProjectDetails();
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await api.delete(`/projects/${project.id}`);
        navigate('/');
      } catch (err) {
        console.error('Failed to delete project', err);
      }
    }
  };

  const isOwner = project?.ownerId === user?.id;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading project board...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-xs text-slate-500">Project not found</p>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.column?.name.toLowerCase().includes('complete') || t.column?.name.toLowerCase().includes('done')).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Project Header Bar */}
      <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title & Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition md:hidden"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {project.name}
                </h1>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Progress indicator */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-slate-500 font-medium">Progress:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{progressPercent}%</span>
              <span className="text-[11px] text-slate-400">({completedCount}/{tasks.length})</span>
            </div>

            {/* Member Avatars */}
            <div
              onClick={() => setShowMembersModal(true)}
              className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-85 transition"
              title="Manage Members"
            >
              {project.members?.slice(0, 3).map((m) => (
                <img
                  key={m.id}
                  src={getUserAvatar(m.user, m.user.name)}
                  alt={m.user.name}
                  className="w-6 h-6 rounded-full ring-1.5 ring-white dark:ring-slate-900 object-cover"
                />
              ))}
              {(project.members?.length || 0) > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 ring-1.5 ring-white dark:ring-slate-900">
                  +{(project.members?.length || 0) - 3}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowMembersModal(true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Members</span>
            </button>

            {isOwner && (
              <button
                onClick={handleDeleteProject}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-700/80 text-xs transition"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                setNewTaskInitialColumnId(columns[0]?.id);
                setShowNewTaskModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filters & View Switcher Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40 sm:w-48"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {project.members?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Board vs List View */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode('board')}
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Board / List View */}
      <div className="flex-1 p-4 sm:p-5 overflow-hidden">
        {viewMode === 'board' ? (
          <KanbanBoard
            columns={columns}
            tasks={tasks}
            members={project.members || []}
            onTaskMove={handleTaskMove}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setSearchParams({ task: task.id });
            }}
            onAddTaskClick={(colId) => {
              setNewTaskInitialColumnId(colId);
              setShowNewTaskModal(true);
            }}
            filterSearch={searchQuery}
            filterPriority={priorityFilter}
            filterAssignee={assigneeFilter}
          />
        ) : (
          <div className="h-full overflow-y-auto bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {tasks.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No tasks found. Click "+ Add Task" to get started!
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTask(t);
                      setSearchParams({ task: t.id });
                    }}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 rounded-lg cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase w-20 shrink-0">
                        {t.column?.name || 'Task'}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {t.priority}
                      </span>
                      {t.assignee && (
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <img
                            src={getUserAvatar(t.assignee, t.assignee.name)}
                            alt={t.assignee.name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="hidden md:inline">{t.assignee.name.split(' ')[0]}</span>
                        </div>
                      )}
                      {t.dueDate && (
                        <span className="text-[11px] text-slate-400">
                          {format(new Date(t.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Drawer */}
      {selectedTask && (
        <TaskModal
          taskId={selectedTask.id}
          projectId={project.id}
          columns={columns}
          members={project.members || []}
          onClose={() => {
            setSelectedTask(null);
            setSearchParams({});
          }}
          onTaskUpdated={(updated) => {
            setTasks(prev =>
              dedupeTasks(prev.map(t => (t.id === updated.id ? { ...t, ...updated } : t)))
            );
          }}
          onTaskDeleted={(deletedId) => {
            setTasks(prev => dedupeTasks(prev.filter(t => t.id !== deletedId)));
          }}
        />
      )}

      {/* New Task Modal with strict deduplication on success */}
      {showNewTaskModal && (
        <NewTaskModal
          projectId={project.id}
          columns={columns}
          initialColumnId={newTaskInitialColumnId}
          members={project.members || []}
          onClose={() => setShowNewTaskModal(false)}
          onSuccess={(newTask) => {
            setShowNewTaskModal(false);
            setTasks(prev => {
              const existingIndex = prev.findIndex(t => t.id === newTask.id);
              if (existingIndex >= 0) {
                const copy = [...prev];
                copy[existingIndex] = newTask;
                return dedupeTasks(copy);
              }
              return dedupeTasks([...prev, newTask]);
            });
          }}
        />
      )}

      {/* Project Members Modal */}
      {showMembersModal && (
        <ProjectMembersModal
          projectId={project.id}
          projectName={project.name}
          isOwner={isOwner}
          members={project.members || []}
          onClose={() => setShowMembersModal(false)}
          onMembersUpdated={fetchProjectDetails}
        />
      )}
    </div>
  );
};
