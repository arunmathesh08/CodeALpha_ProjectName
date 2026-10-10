import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { emitActivity, emitCommentAdded, emitCommentDeleted, emitNotification } from '../socket.js';

const router = Router();
router.use(authenticateToken);

const commentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty')
});

// GET /api/comments/task/:taskId - list comments for a task
router.get('/task/:taskId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ comments });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// POST /api/comments/task/:taskId - create comment
router.post('/task/:taskId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.taskId as string;
    const validated = commentSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content: validated.content,
        taskId,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    const activity = await prisma.activity.create({
      data: {
        projectId: task.projectId,
        userId,
        action: 'ADDED_COMMENT',
        details: `Commented on "${task.title}": "${validated.content.substring(0, 30)}${validated.content.length > 30 ? '...' : ''}"`
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    const notifyUserIds = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId) notifyUserIds.add(task.assigneeId);
    if (task.creatorId && task.creatorId !== userId) notifyUserIds.add(task.creatorId);

    for (const targetId of notifyUserIds) {
      const notification = await prisma.notification.create({
        data: {
          userId: targetId,
          title: 'New Comment',
          message: `${req.user!.name} commented on "${task.title}"`,
          type: 'COMMENT_ADDED',
          link: `/projects/${task.projectId}?task=${task.id}`
        }
      });
      emitNotification(targetId, notification);
    }

    emitCommentAdded(task.projectId, { ...comment, taskId });
    emitActivity(task.projectId, activity);

    res.status(201).json({ comment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// PUT /api/comments/:id - edit comment
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = commentSchema.parse(req.body);

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (comment.userId !== userId) {
      res.status(403).json({ message: 'You can only edit your own comments' });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { content: validated.content },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    res.json({ comment: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Error updating comment', error: error.message });
  }
});

// DELETE /api/comments/:id - delete comment
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { task: true }
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (comment.userId !== userId) {
      res.status(403).json({ message: 'You can only delete your own comments' });
      return;
    }

    await prisma.comment.delete({
      where: { id }
    });

    emitCommentDeleted(comment.task.projectId, id, comment.taskId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
});

export default router;
