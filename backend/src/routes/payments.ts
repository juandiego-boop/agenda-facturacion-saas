import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const paymentSchema = z.object({
  appointmentId: z.string(),
  method: z.enum(['card', 'cash', 'transfer']),
  amount: z.number().positive().optional(),
});

// GET /api/payments
router.get('/', async (req: AuthRequest, res: Response) => {
  const payments = await prisma.payment.findMany({
    where: { businessId: req.user!.businessId },
    include: { appointment: { include: { specialist: true, service: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return res.json(payments);
});

// POST /api/payments - Registrar pago manual (efectivo/transferencia)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = paymentSchema.parse(req.body);
    const businessId = req.user!.businessId;

    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, businessId },
      include: { specialist: true },
    });
    if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });

    const amount = data.amount || appointment.price;
    const platformFeeRate = 0.02; // 2% comisión plataforma
    const platformFee = amount * platformFeeRate;
    const specialistFee = (amount * appointment.specialist.commission) / 100;
    const businessNet = amount - platformFee - specialistFee;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          businessId,
          appointmentId: data.appointmentId,
          amount,
          platformFee,
          specialistFee,
          businessNet,
          status: 'PAID',
          method: data.method,
        },
      });

      await tx.appointment.update({
        where: { id: data.appointmentId },
        data: { paymentStatus: 'PAID', status: 'COMPLETED' },
      });

      return p;
    });

    return res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    return res.status(500).json({ error: 'Error al registrar pago' });
  }
});

export default router;
