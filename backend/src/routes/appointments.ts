import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const appointmentSchema = z.object({
  specialistId: z.string(),
  serviceId: z.string(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  date: z.string().datetime(),
  notes: z.string().optional(),
  price: z.number().positive().optional(),
});

// GET /api/appointments
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { date, specialistId, status, startDate, endDate } = req.query;
    const businessId = req.user!.businessId;

    const where: Record<string, unknown> = { businessId };

    if (specialistId) where.specialistId = specialistId;
    if (status) where.status = status;

    if (date) {
      const d = new Date(date as string);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      where.date = { gte: start, lte: end };
    } else if (startDate && endDate) {
      where.date = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        specialist: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, duration: true, color: true } },
        client: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { date: 'asc' },
    });

    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// POST /api/appointments
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = appointmentSchema.parse(req.body);
    const businessId = req.user!.businessId;

    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, businessId },
    });
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const endDate = new Date(data.date);
    endDate.setMinutes(endDate.getMinutes() + service.duration);

    // Verificar conflictos de horario
    const conflict = await prisma.appointment.findFirst({
      where: {
        specialistId: data.specialistId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          { date: { gte: new Date(data.date), lt: endDate } },
          { endDate: { gt: new Date(data.date), lte: endDate } },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ error: 'El especialista ya tiene una cita en ese horario' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        specialistId: data.specialistId,
        serviceId: data.serviceId,
        clientId: data.clientId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        date: new Date(data.date),
        endDate,
        notes: data.notes,
        price: data.price || service.price,
        status: 'CONFIRMED',
      },
      include: {
        specialist: true,
        service: true,
        client: true,
      },
    });

    return res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    return res.status(500).json({ error: 'Error al crear cita' });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const businessId = req.user!.businessId;

    const appointment = await prisma.appointment.findFirst({ where: { id, businessId } });
    if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId;

    const appointment = await prisma.appointment.findFirst({ where: { id, businessId } });
    if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });

    await prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    return res.json({ message: 'Cita cancelada' });
  } catch {
    return res.status(500).json({ error: 'Error al cancelar cita' });
  }
});

export default router;
