import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const specialistSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  commission: z.number().min(0).max(100).default(0),
  serviceIds: z.array(z.string()).optional(),
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const specialists = await prisma.specialist.findMany({
    where: { businessId: req.user!.businessId, isActive: true },
    include: {
      specialistServices: { include: { service: true } },
      schedules: true,
    },
  });
  return res.json(specialists);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = specialistSchema.parse(req.body);
    const businessId = req.user!.businessId;

    const specialist = await prisma.$transaction(async (tx) => {
      const s = await tx.specialist.create({
        data: { name: data.name, email: data.email, phone: data.phone, bio: data.bio, commission: data.commission, businessId },
      });

      if (data.serviceIds?.length) {
        await tx.specialistService.createMany({
          data: data.serviceIds.map((sid) => ({ specialistId: s.id, serviceId: sid })),
        });
      }

      if (data.schedules?.length) {
        await tx.schedule.createMany({
          data: data.schedules.map((sc) => ({ ...sc, specialistId: s.id })),
        });
      }

      return s;
    });

    return res.status(201).json(specialist);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    return res.status(500).json({ error: 'Error al crear especialista' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = specialistSchema.partial().parse(req.body);
    const { id } = req.params;
    const businessId = req.user!.businessId;

    const existing = await prisma.specialist.findFirst({ where: { id, businessId } });
    if (!existing) return res.status(404).json({ error: 'Especialista no encontrado' });

    const updated = await prisma.specialist.update({
      where: { id },
      data: { name: data.name, email: data.email, phone: data.phone, bio: data.bio, commission: data.commission },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Error al actualizar especialista' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.specialist.findFirst({ where: { id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Especialista no encontrado' });
  await prisma.specialist.update({ where: { id }, data: { isActive: false } });
  return res.json({ message: 'Especialista desactivado' });
});

// GET /api/specialists/:id/availability
router.get('/:id/availability', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Fecha requerida' });

    const d = new Date(date as string);
    const dayOfWeek = d.getDay();

    const schedule = await prisma.schedule.findFirst({
      where: { specialistId: id, dayOfWeek, isActive: true },
    });

    if (!schedule) return res.json({ available: false, slots: [] });

    const appointments = await prisma.appointment.findMany({
      where: {
        specialistId: id,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        date: {
          gte: new Date(d.setHours(0, 0, 0, 0)),
          lte: new Date(d.setHours(23, 59, 59, 999)),
        },
      },
      select: { date: true, endDate: true },
    });

    return res.json({ available: true, schedule, appointments });
  } catch {
    return res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

export default router;
