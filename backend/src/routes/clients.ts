import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { search } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string } },
    ];
  }
  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { appointments: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(clients);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.parse(req.body);
    const client = await prisma.client.create({ data: { ...data, businessId: req.user!.businessId } });
    return res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    return res.status(500).json({ error: 'Error al crear cliente' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
    include: {
      appointments: {
        include: { specialist: true, service: true },
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  });
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  return res.json(client);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.partial().parse(req.body);
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
    const updated = await prisma.client.update({ where: { id: req.params.id }, data });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

export default router;
