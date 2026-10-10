import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ProjectMember } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { getUserAvatar } from '../utils/avatar';

interface ProjectMembersModalProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  members: ProjectMember[];
  onClose: () => void;
  onMembersUpdated: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  projectId,
  projectName,
  isOwner,
  members,
  onClose,
  onMembersUpdated
}) => {
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMsg('');
      await api.post(`/projects/${projectId}/members`, {
        email: email.trim(),
        role
      });

      setEmail('');
      setSuccessMsg('Member added successfully!');
      onMembersUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (window.confirm('Remove this member from the project?')) {
      try {
        await api.delete(`/projects/${projectId}/members/${targetUserId}`);
        onMembersUpdated();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Project Members</h3>
            <p className="text-xs text-slate-400 mt-0.5">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Add New Member
            </h4>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                {successMsg}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="User email (e.g. sarah@example.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Member list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Current Members ({members.length})
            </h4>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl">
              {members.map((m) => (
                <div key={m.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getUserAvatar(m.user, m.user.name)}
                      alt={m.user.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.user.name} {m.userId === currentUser?.id ? '(You)' : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{m.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        m.role === 'OWNER'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                          : m.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {m.role}
                    </span>

                    {isOwner && m.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
