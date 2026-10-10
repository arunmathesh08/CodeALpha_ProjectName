import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { emitActivity, emitNotification } from '../socket.js';

const router = Router();
router.use(authenticateToken);

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']).optional()
});

// GET /api/projects - list user's projects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
});

// POST /api/projects - create new project
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validated = projectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        status: validated.status || 'ACTIVE',
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: 'OWNER'
          }
        },
        boards: {
          create: {
            name: 'Main Board',
            columns: {
              create: [
                { name: 'To Do', order: 0 },
                { name: 'In Progress', order: 1 },
                { name: 'Review', order: 2 },
                { name: 'Completed', order: 3 }
              ]
            }
          }
        },
        activities: {
          create: {
            userId: userId,
            action: 'CREATED_PROJECT',
            details: `Created project "${validated.name}"`
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        boards: {
          include: {
            columns: true
          }
        }
      }
    });

    res.status(201).json({ project });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// GET /api/projects/:id - get single project details
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        boards: {
          include: {
            columns: {
              orderBy: { order: 'asc' },
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                  include: {
                    assignee: {
                      select: { id: true, name: true, email: true, avatar: true }
                    },
                    creator: {
                      select: { id: true, name: true, email: true, avatar: true }
                    },
                    _count: {
                      select: { comments: true }
                    }
                  }
                }
              }
            }
          }
        },
        activities: {
          take: 15,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m: any) => m.userId === userId);
    if (!isOwner && !isMember) {
      res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
      return;
    }

    res.json({ project });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
});

// PUT /api/projects/:id - update project
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = projectSchema.partial().parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const isOwner = project.ownerId === userId;
    const isAdmin = project.members.some((m: any) => m.userId === userId && (m.role === 'ADMIN' || m.role === 'OWNER'));

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Only project owners and admins can update project settings.' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: validated,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    });

    const activity = await prisma.activity.create({
      data: {
        projectId: id,
        userId,
        action: 'UPDATED_PROJECT',
        details: `Updated project details`
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    emitActivity(id, activity);

    res.json({ project: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
});

// DELETE /api/projects/:id - delete project (owner only)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.ownerId !== userId) {
      res.status(403).json({ message: 'Only the project owner can delete this project.' });
      return;
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const projectId = req.params.id as string;
    const { email, role = 'MEMBER' } = req.body;

    if (!email) {
      res.status(400).json({ message: 'User email is required' });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!targetUser) {
      res.status(404).json({ message: `No user found with email ${email}` });
      return;
    }

    const alreadyMember = project.members.some((m: any) => m.userId === targetUser.id);
    if (alreadyMember) {
      res.status(400).json({ message: 'User is already a member of this project' });
      return;
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    const activity = await prisma.activity.create({
      data: {
        projectId,
        userId: currentUserId,
        action: 'ADDED_MEMBER',
        details: `Added ${targetUser.name} to the project`
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    const notification = await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: 'Added to Project',
        message: `${req.user!.name} added you to project "${project.name}"`,
        type: 'MEMBER_ADDED',
        link: `/projects/${projectId}`
      }
    });

    emitActivity(projectId, activity);
    emitNotification(targetUser.id, notification);

    res.status(201).json({ member: newMember });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
});

// DELETE /api/projects/:id/members/:targetUserId - remove member
router.delete('/:id/members/:targetUserId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const projectId = req.params.id as string;
    const targetUserId = req.params.targetUserId as string;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.ownerId !== currentUserId && currentUserId !== targetUserId) {
      res.status(403).json({ message: 'Permission denied to remove member' });
      return;
    }

    if (project.ownerId === targetUserId) {
      res.status(400).json({ message: 'Cannot remove the project owner' });
      return;
    }

    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId: targetUserId
      }
    });

    await prisma.task.updateMany({
      where: { projectId, assigneeId: targetUserId },
      data: { assigneeId: null }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
});

export default router;
