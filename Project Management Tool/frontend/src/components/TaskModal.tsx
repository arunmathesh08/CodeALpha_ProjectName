import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Calendar, 
  Flag, 
  User as UserIcon, 
  MessageSquare, 
  Send, 
  Edit3, 
  Clock,
  AlertCircle,
  Save,
  Check
} from 'lucide-react';
import { Task, Priority, Comment, Column, ProjectMember } from '../types/index';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { format, formatDistanceToNow } from 'date-fns';
import { getUserAvatar } from '../utils/avatar';

interface TaskModalProps {
  taskId: string;
  projectId: string;
  columns: Column[];
  members: ProjectMember[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  taskId,
  projectId,
  columns,
  members,
  onClose,
  onTaskUpdated,
  onTaskDeleted
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const fetchTaskDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      const t = res.data.task;
      setTask(t);
      setTitle(t.title);
      setDescription(t.description || '');
      setColumnId(t.columnId);
      setPriority(t.priority);
      setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
      setAssigneeId(t.assigneeId || '');
      setComments(t.comments || []);
    } catch (err) {
      console.error('Failed to load task', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  // Real-time socket events for comments
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = (comment: Comment) => {
      if (comment.taskId === taskId) {
        setComments(prev => [...prev.filter(c => c.id !== comment.id), comment]);
      }
    };

    const handleCommentDeleted = (data: { commentId: string; taskId: string }) => {
      if (data.taskId === taskId) {
        setComments(prev => prev.filter(c => c.id !== data.commentId));
      }
    };

    socket.on('comment_added', handleCommentAdded);
    socket.on('comment_deleted', handleCommentDeleted);

    return () => {
      socket.off('comment_added', handleCommentAdded);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [socket, taskId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await api.put(`/tasks/${taskId}`, {
        title,
        description: description || null,
        columnId,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeId: assigneeId || null
      });
      setTask(res.data.task);
      onTaskUpdated(res.data.task);
    } catch (err) {
      console.error('Failed to save task', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        onTaskDeleted(taskId);
        onClose();
      } catch (err) {
        console.error('Failed to delete task', err);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const res = await api.post(`/comments/task/${taskId}`, {
        content: newComment.trim()
      });
      setComments(prev => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, {
        content: editCommentText.trim()
      });
      setComments(prev =>
        prev.map(c => (c.id === commentId ? res.data.comment : c))
      );
      setEditingCommentId(null);
    } catch (err) {
      console.error('Failed to edit comment', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl flex items-center gap-3 border border-slate-200 dark:border-slate-800">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Right-side Task Drawer */}
      <div className="w-full max-w-2xl h-full bg-white dark:bg-[#0f172a] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Task Details
            </span>
            {isSaving && (
              <span className="text-[10px] text-indigo-500 font-medium animate-pulse">Saving...</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="Task title..."
              className="w-full text-base font-bold text-slate-900 dark:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>

          {/* Quick Attributes Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</span>
              <select
                value={columnId}
                onChange={(e) => {
                  setColumnId(e.target.value);
                  setTimeout(handleSave, 50);
                }}
                className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Priority</span>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as Priority);
                  setTimeout(handleSave, 50);
                }}
                className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Assignee</span>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  setTimeout(handleSave, 50);
                }}
                className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setTimeout(handleSave, 50);
                }}
                className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Add details, acceptance criteria, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              className="w-full text-xs text-slate-800 dark:text-slate-200 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Comments Discussion */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Activity & Comments ({comments.length})
              </h4>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <img
                src={getUserAvatar(user, user?.name || 'Me')}
                alt="Me"
                className="w-6 h-6 rounded-full shrink-0 mt-1 ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-2 pt-1">
              {comments.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80"
                  >
                    <img
                      src={getUserAvatar(c.user, c.user?.name || 'User')}
                      alt={c.user?.name}
                      className="w-5 h-5 rounded-full shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {c.user?.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {c.userId === user?.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditCommentText(c.content);
                              }}
                              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="p-0.5 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="mt-1.5 flex gap-1.5">
                          <input
                            type="text"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="flex-1 px-2 py-1 rounded border border-indigo-400 text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleUpdateComment(c.id)}
                            className="px-2 py-1 rounded bg-indigo-600 text-white text-[11px] font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="px-1.5 py-1 text-[11px] text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
                          {c.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            {task?.createdAt && (
              <span>Created {format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
