import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  duration: z.number().positive(),
  price: z.number().positive(),
  category: z.string().optional(),
  color: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const services = await prisma.service.findMany({
    where: { businessId: req.user!.businessId, isActive: true },
    orderBy: { name: 'asc' },
  });
  return res.json(services);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.create({
      data: { ...data, businessId: req.user!.businessId },
    });
    return res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    return res.status(500).json({ error: 'Error al crear servicio' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = serviceSchema.partial().parse(req.body);
    const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
    if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
    const updated = await prisma.service.update({ where: { id: req.params.id }, data });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  await prisma.service.update({ where: { id: req.params.id }, data: { isActive: false } });
  return res.json({ message: 'Servicio eliminado' });
});

export default router;
