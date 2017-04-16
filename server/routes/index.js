import express from 'express';
import authRoutes from './auth';

// service routes
import fflipRoutes from './fflip';
import swaggerRoutes from './swagger';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount auth routes at /auth
router.use('/api/auth', authRoutes);

router.use('/_ff', fflipRoutes);

router.use('/_docs', swaggerRoutes);

export default router;
