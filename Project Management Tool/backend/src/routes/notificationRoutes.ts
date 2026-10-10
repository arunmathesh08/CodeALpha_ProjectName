import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';

const router = Router();
router.use(authenticateToken);

// GET /api/notifications - get notifications for current user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// PUT /api/notifications/read-all - mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
});

// PUT /api/notifications/:id/read - mark single notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ notification: updated });
  } catch (error: any) {
    res.status(500).json({ message: 'Error marking notification read', error: error.message });
  }
});

export default router;
