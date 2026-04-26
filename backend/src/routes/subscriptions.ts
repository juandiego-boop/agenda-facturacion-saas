import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const PLANS = {
  BASIC: { price: 10, name: 'Básico', features: ['Hasta 3 especialistas', '100 citas/mes', 'Reportes básicos'] },
  PRO: { price: 30, name: 'Pro', features: ['Hasta 10 especialistas', 'Citas ilimitadas', 'Reportes avanzados', 'Pagos online'] },
  PREMIUM: { price: 60, name: 'Premium', features: ['Especialistas ilimitados', 'Citas ilimitadas', 'Reportes completos', 'Pagos online', 'API access', 'Soporte prioritario'] },
};

router.get('/plans', (_req, res: Response) => {
  return res.json(PLANS);
});

router.get('/current', async (req: AuthRequest, res: Response) => {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId: req.user!.businessId },
  });
  return res.json(subscription);
});

export default router;
