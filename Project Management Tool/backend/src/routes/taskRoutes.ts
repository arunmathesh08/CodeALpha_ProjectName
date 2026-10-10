import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { emitActivity, emitNotification, emitTaskCreated, emitTaskDeleted, emitTaskMoved, emitTaskUpdated } from '../socket.js';

const router = Router();
router.use(authenticateToken);

const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  columnId: z.string().min(1, 'Column ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  columnId: z.string().optional(),
  order: z.number().optional()
});

// GET /api/tasks/project/:projectId - list tasks for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const { priority, assigneeId, search } = req.query;

    const where: any = { projectId };
    if (priority) where.priority = priority as string;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        column: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// GET /api/tasks/:id - get single task details with comments
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        column: true,
        project: {
          select: { id: true, name: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
});

// POST /api/tasks - create new task
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validated = createTaskSchema.parse(req.body);

    const maxOrderTask = await prisma.task.findFirst({
      where: { columnId: validated.columnId },
      orderBy: { order: 'desc' }
    });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        priority: validated.priority || 'MEDIUM',
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        projectId: validated.projectId,
        columnId: validated.columnId,
        creatorId: userId,
        assigneeId: validated.assigneeId || null,
        order
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        column: true,
        _count: {
          select: { comments: true }
        }
      }
    });

    const activity = await prisma.activity.create({
      data: {
        projectId: validated.projectId,
        userId,
        action: 'CREATED_TASK',
        details: `Created task "${task.title}" in ${task.column.name}`
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    if (validated.assigneeId && validated.assigneeId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          userId: validated.assigneeId,
          title: 'Task Assigned',
          message: `${req.user!.name} assigned task "${task.title}" to you`,
          type: 'TASK_ASSIGNED',
          link: `/projects/${validated.projectId}?task=${task.id}`
        }
      });
      emitNotification(validated.assigneeId, notification);
    }

    emitTaskCreated(validated.projectId, task);
    emitActivity(validated.projectId, activity);

    res.status(201).json({ task });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

// PUT /api/tasks/:id - update task
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateTaskSchema.parse(req.body);

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { column: true, assignee: true }
    });

    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const dataToUpdate: any = {};
    if (validated.title !== undefined) dataToUpdate.title = validated.title;
    if (validated.description !== undefined) dataToUpdate.description = validated.description;
    if (validated.priority !== undefined) dataToUpdate.priority = validated.priority;
    if (validated.dueDate !== undefined) {
      dataToUpdate.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }
    if (validated.assigneeId !== undefined) dataToUpdate.assigneeId = validated.assigneeId;
    if (validated.columnId !== undefined) dataToUpdate.columnId = validated.columnId;
    if (validated.order !== undefined) dataToUpdate.order = validated.order;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        column: true,
        _count: {
          select: { comments: true }
        }
      }
    });

    let actionDetail = `Updated task "${updatedTask.title}"`;
    if (validated.assigneeId && validated.assigneeId !== existingTask.assigneeId) {
      actionDetail = `Assigned "${updatedTask.title}" to ${updatedTask.assignee?.name || 'someone'}`;
      if (validated.assigneeId !== userId) {
        const notification = await prisma.notification.create({
          data: {
            userId: validated.assigneeId,
            title: 'Task Assigned',
            message: `${req.user!.name} assigned task "${updatedTask.title}" to you`,
            type: 'TASK_ASSIGNED',
            link: `/projects/${updatedTask.projectId}?task=${updatedTask.id}`
          }
        });
        emitNotification(validated.assigneeId, notification);
      }
    } else if (validated.columnId && validated.columnId !== existingTask.columnId) {
      actionDetail = `Moved "${updatedTask.title}" to ${updatedTask.column.name}`;
    }

    const activity = await prisma.activity.create({
      data: {
        projectId: updatedTask.projectId,
        userId,
        action: 'UPDATED_TASK',
        details: actionDetail
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    emitTaskUpdated(updatedTask.projectId, updatedTask);
    emitActivity(updatedTask.projectId, activity);

    res.json({ task: updatedTask });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

// PUT /api/tasks/:id/move - move task between columns or change order
router.put('/:id/move', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { columnId, order } = req.body;

    if (!columnId || typeof order !== 'number') {
      res.status(400).json({ message: 'columnId and order (number) are required' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { column: true }
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        columnId,
        order
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        column: true,
        _count: {
          select: { comments: true }
        }
      }
    });

    const isColumnChange = task.columnId !== columnId;
    if (isColumnChange) {
      const activity = await prisma.activity.create({
        data: {
          projectId: task.projectId,
          userId,
          action: 'MOVED_TASK',
          details: `Moved "${task.title}" to ${updatedTask.column.name}`
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } }
        }
      });
      emitActivity(task.projectId, activity);
    }

    emitTaskMoved(task.projectId, { taskId: id, columnId, order, task: updatedTask });

    res.json({ task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ message: 'Error moving task', error: error.message });
  }
});

// DELETE /api/tasks/:id - delete task
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await prisma.task.delete({
      where: { id }
    });

    const activity = await prisma.activity.create({
      data: {
        projectId: task.projectId,
        userId,
        action: 'DELETED_TASK',
        details: `Deleted task "${task.title}"`
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    emitTaskDeleted(task.projectId, id);
    emitActivity(task.projectId, activity);

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

export default router;
