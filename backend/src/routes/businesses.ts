import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  description: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

// GET /api/businesses/me - Info del negocio actual
router.get('/me', async (req: AuthRequest, res: Response) => {
  const business = await prisma.business.findUnique({
    where: { id: req.user!.businessId },
    include: { subscription: true },
  });
  return res.json(business);
});

// PUT /api/businesses/me
router.put('/me', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    const updated = await prisma.business.update({
      where: { id: req.user!.businessId },
      data,
    });
    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    return res.status(500).json({ error: 'Error al actualizar negocio' });
  }
});

// GET /api/businesses/me/users - Usuarios del negocio
router.get('/me/users', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { businessId: req.user!.businessId },
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  return res.json(users);
});

// POST /api/businesses/me/users - Invitar usuario
router.post('/me/users', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, role, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'El email ya está en uso' });

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'Temporal123!', 12);

    const user = await prisma.user.create({
      data: { email, name, role: role || 'SPECIALIST', password: hashedPassword, businessId: req.user!.businessId },
      select: { id: true, email: true, name: true, role: true },
    });
    return res.status(201).json(user);
  } catch {
    return res.status(500).json({ error: 'Error al crear usuario' });
  }
});

export default router;
