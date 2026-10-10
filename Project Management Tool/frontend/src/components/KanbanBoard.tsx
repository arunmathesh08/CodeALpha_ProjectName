import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Column, Task, ProjectMember } from '../types/index';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  columns: Column[];
  tasks: Task[];
  members: ProjectMember[];
  onTaskMove: (taskId: string, sourceColId: string, destColId: string, newOrder: number) => void;
  onTaskClick: (task: Task) => void;
  onAddTaskClick: (columnId: string) => void;
  filterSearch: string;
  filterPriority: string;
  filterAssignee: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  members,
  onTaskMove,
  onTaskClick,
  onAddTaskClick,
  filterSearch,
  filterPriority,
  filterAssignee
}) => {
  // Guarantee 100% strict deduplication of tasks by unique ID
  const uniqueTasksMap = new Map<string, Task>();
  tasks.forEach((t) => {
    if (t && t.id) {
      uniqueTasksMap.set(t.id, t);
    }
  });
  const uniqueTasks = Array.from(uniqueTasksMap.values());

  // Filter unique tasks
  const filteredTasks = uniqueTasks.filter((task) => {
    // Search filter
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Priority filter
    if (filterPriority && filterPriority !== 'ALL') {
      if (task.priority !== filterPriority) return false;
    }

    // Assignee filter
    if (filterAssignee && filterAssignee !== 'ALL') {
      if (filterAssignee === 'UNASSIGNED') {
        if (task.assigneeId) return false;
      } else {
        if (task.assigneeId !== filterAssignee) return false;
      }
    }

    return true;
  });

  const getColumnDotColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('todo') || n.includes('to do')) return 'bg-indigo-500';
    if (n.includes('progress')) return 'bg-amber-500';
    if (n.includes('review')) return 'bg-purple-500';
    if (n.includes('complete') || n.includes('done')) return 'bg-emerald-500';
    return 'bg-slate-400';
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    onTaskMove(
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start h-full">
        {columns.map((column) => {
          const colTasks = filteredTasks
            .filter((t) => t.columnId === column.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={column.id}
              className="w-72 shrink-0 flex flex-col rounded-xl bg-slate-100/70 dark:bg-[#0f172a]/70 border border-slate-200/80 dark:border-slate-800 shadow-2xs max-h-[calc(100vh-170px)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getColumnDotColor(column.name)}`} />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {column.name}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => onAddTaskClick(column.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition"
                  title="Add Task to column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[120px] transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                        : ''
                    }`}
                  >
                    {colTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={() => onTaskClick(task)}
                      />
                    ))}
                    {provided.placeholder}

                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        <p className="text-[11px] text-slate-400">No tasks in this column</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Quick Add Footer */}
              <div className="p-2 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  onClick={() => onAddTaskClick(column.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add task</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
