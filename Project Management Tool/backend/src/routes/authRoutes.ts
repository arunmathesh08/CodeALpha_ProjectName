import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  gender: z.string().optional(),
  avatar: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Full Name must be at least 2 characters').optional(),
  gender: z.string().optional(),
  avatar: z.string().optional()
});

// POST /api/auth/register
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() }
    });

    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        password: hashedPassword,
        gender: validated.gender || 'MALE',
        avatar: validated.avatar || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        avatar: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      message: 'Account created successfully',
      user,
      token
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0]?.message || 'Validation error' });
      return;
    }
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Registration failed due to a server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() }
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = profileUpdateSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.gender !== undefined && { gender: validated.gender }),
        ...(validated.avatar !== undefined && { avatar: validated.avatar })
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        avatar: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// GET /api/auth/users (for member invite / assignee selection)
router.get('/users', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        avatar: true
      },
      take: 20
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

export default router;
