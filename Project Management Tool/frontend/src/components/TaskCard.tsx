import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { 
  Calendar, 
  MessageSquare, 
  AlertCircle
} from 'lucide-react';
import { Task, Priority } from '../types/index';
import { format, isPast, isToday } from 'date-fns';
import { getUserAvatar } from '../utils/avatar';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
      case 'HIGH':
        return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      case 'MEDIUM':
        return 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50';
      case 'LOW':
      default:
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
    }
  };

  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    const past = isPast(date) && !isToday(date);
    const today = isToday(date);

    return {
      formatted: format(date, 'MMM d'),
      isOverdue: past,
      isToday: today
    };
  };

  const dueDateInfo = getDueDateInfo();
  const commentCount = task._count?.comments ?? task.comments?.length ?? 0;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group rounded-xl border p-3 transition-all duration-150 cursor-pointer ${
            snapshot.isDragging
              ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-xl scale-[1.01] rotate-0.5 ring-1 ring-indigo-500/20 z-50'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          {/* Priority & Due Date Header */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(
                task.priority
              )}`}
            >
              {task.priority}
            </span>

            {dueDateInfo && (
              <span
                className={`flex items-center gap-1 text-[10px] font-medium ${
                  dueDateInfo.isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : dueDateInfo.isToday
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-slate-400'
                }`}
                title={`Due: ${format(new Date(task.dueDate!), 'PPP')}`}
              >
                {dueDateInfo.isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                <span>{dueDateInfo.formatted}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
            {task.title}
          </h4>

          {/* Description Snippet */}
          {task.description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Card Footer */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5">
              {task.assignee ? (
                <div className="flex items-center gap-1.5" title={`Assigned to: ${task.assignee.name}`}>
                  <img
                    src={getUserAvatar(task.assignee, task.assignee.name)}
                    alt={task.assignee.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                    {task.assignee.name.split(' ')[0]}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Unassigned</span>
              )}
            </div>

            {commentCount > 0 && (
              <div
                className="flex items-center gap-1 text-[10px] text-slate-400 font-medium"
                title={`${commentCount} comments`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>{commentCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
