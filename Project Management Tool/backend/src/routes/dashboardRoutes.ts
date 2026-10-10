import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';

const router = Router();
router.use(authenticateToken);

// GET /api/dashboard - summary metrics and stats
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get user projects
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: { id: true, name: true, status: true, updatedAt: true }
    });

    const projectIds = userProjects.map(p => p.id);

    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter(p => p.status === 'ACTIVE').length;

    // Tasks across user projects
    const allProjectTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        column: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } }
      }
    });

    const completedTasks = allProjectTasks.filter(
      t => t.column.name.toLowerCase() === 'completed' || t.column.name.toLowerCase() === 'done'
    ).length;

    const now = new Date();
    const overdueTasks = allProjectTasks.filter(t => {
      const isCompleted = t.column.name.toLowerCase() === 'completed' || t.column.name.toLowerCase() === 'done';
      return !isCompleted && t.dueDate && new Date(t.dueDate) < now;
    }).length;

    // Recent activity across user's projects
    const recentActivities = await prisma.activity.findMany({
      where: {
        projectId: { in: projectIds }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } }
      }
    });

    // My tasks (assigned to current user)
    const myTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        projectId: { in: projectIds }
      },
      include: {
        column: true,
        project: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 8
    });

    res.json({
      metrics: {
        totalProjects,
        activeProjects,
        completedTasks,
        overdueTasks,
        totalTasks: allProjectTasks.length
      },
      recentActivities,
      myTasks,
      recentProjects: userProjects.slice(0, 5)
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

export default router;
