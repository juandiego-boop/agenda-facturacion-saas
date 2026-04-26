import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/reports/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      todayAppointments,
      monthAppointments,
      totalClients,
      monthRevenue,
      upcomingAppointments,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { businessId, date: { gte: startOfToday, lte: endOfToday }, status: { notIn: ['CANCELLED'] } },
      }),
      prisma.appointment.count({
        where: { businessId, date: { gte: startOfMonth, lte: endOfMonth }, status: { notIn: ['CANCELLED'] } },
      }),
      prisma.client.count({ where: { businessId } }),
      prisma.appointment.aggregate({
        where: { businessId, date: { gte: startOfMonth, lte: endOfMonth }, status: 'COMPLETED' },
        _sum: { price: true },
      }),
      prisma.appointment.findMany({
        where: {
          businessId,
          date: { gte: new Date() },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: { specialist: true, service: true, client: true },
        orderBy: { date: 'asc' },
        take: 5,
      }),
    ]);

    return res.json({
      todayAppointments,
      monthAppointments,
      totalClients,
      monthRevenue: monthRevenue._sum.price || 0,
      upcomingAppointments,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

// GET /api/reports/revenue
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const businessId = req.user!.businessId;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: start, lte: end },
        status: 'COMPLETED',
      },
      include: { specialist: true, service: true },
      orderBy: { date: 'asc' },
    });

    // Agrupar por día
    const revenueByDay: Record<string, number> = {};
    appointments.forEach((apt) => {
      const day = apt.date.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + apt.price;
    });

    // Ingresos por especialista
    const revenueBySpecialist: Record<string, { name: string; total: number; count: number }> = {};
    appointments.forEach((apt) => {
      const key = apt.specialistId;
      if (!revenueBySpecialist[key]) {
        revenueBySpecialist[key] = { name: apt.specialist.name, total: 0, count: 0 };
      }
      revenueBySpecialist[key].total += apt.price;
      revenueBySpecialist[key].count += 1;
    });

    // Ingresos por servicio
    const revenueByService: Record<string, { name: string; total: number; count: number }> = {};
    appointments.forEach((apt) => {
      const key = apt.serviceId;
      if (!revenueByService[key]) {
        revenueByService[key] = { name: apt.service.name, total: 0, count: 0 };
      }
      revenueByService[key].total += apt.price;
      revenueByService[key].count += 1;
    });

    const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0);

    return res.json({
      totalRevenue,
      totalAppointments: appointments.length,
      revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
      revenueBySpecialist: Object.values(revenueBySpecialist),
      revenueByService: Object.values(revenueByService),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener reporte de ingresos' });
  }
});

// GET /api/reports/specialists
router.get('/specialists', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { month, year } = req.query;

    const m = month ? parseInt(month as string) - 1 : new Date().getMonth();
    const y = year ? parseInt(year as string) : new Date().getFullYear();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const specialists = await prisma.specialist.findMany({
      where: { businessId, isActive: true },
      include: {
        appointments: {
          where: { date: { gte: start, lte: end }, status: 'COMPLETED' },
          select: { price: true },
        },
      },
    });

    const report = specialists.map((s) => {
      const totalRevenue = s.appointments.reduce((sum, a) => sum + a.price, 0);
      const commission = (totalRevenue * s.commission) / 100;
      return {
        id: s.id,
        name: s.name,
        appointmentsCount: s.appointments.length,
        totalRevenue,
        commission,
        commissionRate: s.commission,
        netRevenue: totalRevenue - commission,
      };
    });

    return res.json(report);
  } catch {
    return res.status(500).json({ error: 'Error al obtener reporte de especialistas' });
  }
});

export default router;
